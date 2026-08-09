import { type BaseEvent, EventPriority } from '../core/event-emitter';
import { EventEngine } from '../core/event-engine';
import { Stats } from '../data/constants/stats';
import { Balls, Items } from '../data/ids/items';
import { getSpeciesData } from '../data/species';
import { type Encounter, EncounterType } from './encounter';

export const enum SafariState {
  Active = 0,
  Caught = 1,
  Fled = 2,
  Exited = 3,
}

export const enum ThrowResult {
  Caught = 0,
  BrokeFree = 1,
  Fled = 2,
}

export const enum SafariEvents {
  /**
   * The preferred ball changed
   */
  ChooseBall = 0,
  /**
   * The encounter accepted a fed item
   */
  Feed = 1,
  /**
   * A throw resolved, carrying its result
   */
  Throw = 2,
  /**
   * The session reached a terminal state (caught, fled or exited)
   */
  End = 3,
}

export interface SafariEvent extends BaseEvent {
  session: SafariSession;
}

export interface SafariChooseBallEvent extends SafariEvent {
  ball: Balls;
}

export interface SafariFeedEvent extends SafariEvent {
  item: Items;
  /**
   * The accumulated catch bonus after this feeding
   */
  bonus: number;
}

export interface SafariThrowEvent extends SafariEvent {
  ball: Balls;
  result: ThrowResult;
}

export interface SafariEndEvent extends SafariEvent {
  state: SafariState;
}

export type SafariEventMap = {
  [SafariEvents.ChooseBall]: [SafariChooseBallEvent, EventPriority];
  [SafariEvents.Feed]: [SafariFeedEvent, EventPriority];
  [SafariEvents.Throw]: [SafariThrowEvent, EventPriority];
  [SafariEvents.End]: [SafariEndEvent, EventPriority];
};

/**
 * Flat catch multipliers per ball; the Quick and Timer Balls hold a
 * neutral 1 here because their real modifier is turn-dependent and
 * resolves in getBallModifier. The Master Ball's infinity saturates
 * the catch chance to certainty
 */
export const BALL_MODIFIERS: Record<Balls, number> = {
  [Balls.PokeBall]: 1,
  [Balls.GreatBall]: 1.5,
  [Balls.UltraBall]: 2,
  [Balls.MasterBall]: Number.POSITIVE_INFINITY,
  [Balls.PremierBall]: 1,
  [Balls.HealBall]: 1,
  [Balls.LuxuryBall]: 1,
  [Balls.NetBall]: 1,
  [Balls.DiveBall]: 1,
  [Balls.NestBall]: 1,
  [Balls.RepeatBall]: 1,
  [Balls.TimerBall]: 1,
  [Balls.QuickBall]: 1,
  [Balls.DuskBall]: 1.5,
};

/**
 * Mainline Quick Ball: a strong opener, neutral afterwards
 */
const QUICK_BALL_MODIFIER = 5;

/**
 * Mainline Timer Ball: grows by 1229/4096 per elapsed turn, capped
 * at 4x (around the tenth turn)
 */
const TIMER_BALL_RATE = 1229 / 4096;
const TIMER_BALL_CAP = 4;

/**
 * Items an encounter can be fed and the catch multiplier each
 * grants; future bait items slot in here
 */
export const FEED_CATCH_BONUS: Partial<Record<Items, number>> = {
  [Items.CheriBerry]: 1.25,
  [Items.ChestoBerry]: 1.25,
  [Items.PechaBerry]: 1.25,
  [Items.RawstBerry]: 1.25,
  [Items.AspearBerry]: 1.25,
  [Items.LeppaBerry]: 1.25,
  [Items.OranBerry]: 1.25,
  [Items.PersimBerry]: 1.25,
  [Items.LumBerry]: 1.25,
  [Items.SitrusBerry]: 1.25,
};

/**
 * Feeding stacks multiplicatively up to this total bonus
 */
const MAX_CATCH_BONUS = 4;

const CATCH_RATE_SCALE = 255;

/**
 * Even the fastest species stays catchable: flee rolls cap here
 */
const MAX_FLEE_CHANCE = 0.5;

/**
 * A stable identity for an overworld encounter: the chunk cell
 * coordinates, the snapshot window and the rolled individual value
 */
export function encounterKey(encounter: Encounter): string {
  return `${encounter.x},${encounter.y}@${encounter.timestamp}:${encounter.individualValue}`;
}

/**
 * A safari-style catch attempt on one encounter: no battle, just
 * throwing, feeding and hoping. Following the battle classes, the
 * action methods only emit — the actual effects ride the Exact
 * mechanics listeners registered in setupSafariMechanics, so a Pre
 * listener can veto any action by disabling its event and a UI
 * hooks in at Post. Inventory and persistence live elsewhere, and
 * the random source is injected so every roll is reproducible
 */
export default class SafariSession extends EventEngine<SafariEventMap> {
  state = SafariState.Active;

  /**
   * The preferred ball the next throw will use; set by the
   * ChooseBall mechanics
   */
  ball = Balls.PokeBall;

  /**
   * The accumulated feeding bonus; grown by the Feed mechanics
   */
  catchBonus = 1;

  /**
   * Turns elapsed in this session: every resolved throw or feeding
   * advances it (the safari clock behind Quick and Timer Balls)
   */
  turn = 0;

  constructor(
    public readonly encounter: Encounter,
    public readonly random: () => number,
  ) {
    super();
    setupSafariMechanics(this);
  }

  chooseBall(ball: Balls): void {
    this.emit(SafariEvents.ChooseBall, {
      id: 'SafariChooseBall',
      disabled: false,
      session: this,
      ball,
    });
  }

  /**
   * The chance the next throw lands: species catch rate, ball
   * modifier and accumulated feeding bonus
   */
  /**
   * The effective modifier of a ball right now: the Quick Ball only
   * shines on the opening turn, the Timer Ball rewards patience
   */
  getBallModifier(ball = this.ball): number {
    if (ball === Balls.QuickBall) {
      return this.turn === 0 ? QUICK_BALL_MODIFIER : 1;
    }
    if (ball === Balls.TimerBall) {
      return Math.min(TIMER_BALL_CAP, 1 + this.turn * TIMER_BALL_RATE);
    }
    return BALL_MODIFIERS[ball];
  }

  getCatchChance(): number {
    const rate = getSpeciesData(this.encounter.species).catchRate;

    return Math.min(1, (rate * this.getBallModifier() * this.catchBonus) / CATCH_RATE_SCALE);
  }

  /**
   * The chance the encounter flees after a failed throw: faster
   * species bolt more readily, raid encounters never do
   */
  getFleeChance(): number {
    if (this.encounter.type === EncounterType.Raid) {
      return 0;
    }

    const speed = getSpeciesData(this.encounter.species).stats[Stats.Speed];

    return Math.min(MAX_FLEE_CHANCE, speed / CATCH_RATE_SCALE);
  }

  /**
   * Feed the encounter a catch-improving item; false when the item
   * has no feeding effect
   */
  feed(item: Items): boolean {
    this.assertActive();

    if (FEED_CATCH_BONUS[item] == null) {
      return false;
    }
    this.emit(SafariEvents.Feed, {
      id: 'SafariFeed',
      disabled: false,
      session: this,
      item,
      bonus: this.catchBonus,
    });
    return true;
  }

  /**
   * Throw the preferred ball: the Exact mechanics roll the check
   * (catch first, flee on a failure) and settle the event's result
   */
  throwBall(): ThrowResult {
    this.assertActive();

    const event: SafariThrowEvent = {
      id: 'SafariThrow',
      disabled: false,
      session: this,
      ball: this.ball,
      result: ThrowResult.BrokeFree,
    };

    this.emit(SafariEvents.Throw, event);

    // Sequenced here, after the Throw emission fully settles, so
    // observers see Throw before End; the state itself still
    // changes in the End mechanics
    if (event.result === ThrowResult.Caught) {
      this.end(SafariState.Caught);
    } else if (event.result === ThrowResult.Fled) {
      this.end(SafariState.Fled);
    }
    return event.result;
  }

  /**
   * Leave the encounter; unlike a flee it can be met again
   */
  runAway(): void {
    this.assertActive();
    this.end(SafariState.Exited);
  }

  /**
   * Emit the terminal transition; the End mechanics apply the state
   */
  end(state: SafariState): void {
    this.emit(SafariEvents.End, {
      id: 'SafariEnd',
      disabled: false,
      session: this,
      state,
    });
  }

  private assertActive(): void {
    if (this.state !== SafariState.Active) {
      throw new Error('The safari session has ended');
    }
  }
}

/**
 * The session's mechanics, battle-style: every action's effect
 * rides its event at Exact, so Pre listeners can veto any action by
 * disabling its event and UIs observe settled events at Post
 */
function setupSafariMechanics(session: SafariSession): void {
  session.on(SafariEvents.ChooseBall, EventPriority.Exact, (event) => {
    event.session.ball = event.ball;
  });

  session.on(SafariEvents.Feed, EventPriority.Exact, (event) => {
    const bonus = FEED_CATCH_BONUS[event.item];

    if (bonus != null) {
      event.session.catchBonus = Math.min(MAX_CATCH_BONUS, event.session.catchBonus * bonus);
      event.bonus = event.session.catchBonus;
    }
  });

  session.on(SafariEvents.Throw, EventPriority.Exact, (event) => {
    const target = event.session;

    if (target.random() < target.getCatchChance()) {
      event.result = ThrowResult.Caught;
    } else if (target.random() < target.getFleeChance()) {
      event.result = ThrowResult.Fled;
    }
  });

  session.on(SafariEvents.End, EventPriority.Exact, (event) => {
    event.session.state = event.state;
  });

  // The safari clock: resolved feedings and throws each consume a
  // turn (vetoed actions never reach Post, costing nothing)
  session.on(SafariEvents.Feed, EventPriority.Post, (event) => {
    event.session.turn += 1;
  });
  session.on(SafariEvents.Throw, EventPriority.Post, (event) => {
    event.session.turn += 1;
  });
}
