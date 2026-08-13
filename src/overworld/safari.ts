import { type BaseEvent, EventPriority } from '../core/event-emitter';
import { EventEngine } from '../core/event-engine';
import { MAX_LEVEL } from '../data/constants/levels';
import { Stats, getIV, getOtherStat } from '../data/constants/stats';
import { Types } from '../data/constants/types';
import { TimeOfDay, getTimeOfDay, isWaterBiome } from '../data/ids/biome';
import { Balls, Items } from '../data/ids/items';
import { getNatureFactor } from '../data/ids/natures';
import { SPECIES_DAY_CATCH_BOOST, getSpeciesData, isFeaturedSpecies } from '../data/species';
import { type Encounter, EncounterType, isRaidEncounter } from './encounter';

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
 * Flat catch multipliers per ball. Every conditional ball holds a
 * neutral 1 here — their real modifier depends on the encounter or
 * the safari clock and resolves in getBallModifier. The Master
 * Ball's infinity saturates the catch chance to certainty.
 *
 * The Premier, Heal and Luxury Balls catch like a plain Poke Ball.
 * That is the whole of the Premier Ball, which is a commemorative
 * ball and nothing else; the other two are worth throwing for what
 * happens after the catch rather than for the catch itself — a Heal
 * Ball mends whatever is walking beside the player, and a pokemon
 * caught in a Luxury Ball warms to them twice as fast
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
  [Balls.DuskBall]: 1,
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
 * Mainline Net Ball: shines on Bug and Water types
 */
const NET_BALL_MODIFIER = 3.5;

/**
 * The Dive Ball's home is the water. The mainline condition is
 * being underwater, surfing or fishing; here the encounter's biome
 * stands in for all three
 */
const DIVE_BALL_MODIFIER = 3.5;

/**
 * Mainline Nest Ball: (41 - level) / 10, strongest against the
 * weakest encounters and never worse than a plain ball
 */
const NEST_BALL_LEVEL_BASE = 41;
const NEST_BALL_SCALE = 10;
const NEST_BALL_CAP = 4;

/**
 * Mainline Repeat Ball: a species the player already owns comes
 * along more readily
 */
const REPEAT_BALL_MODIFIER = 3.5;

/**
 * Mainline Dusk Ball: darkness helps. Caves have no biome of their
 * own here, so the day cycle carries the condition alone
 */
const DUSK_BALL_MODIFIER = 3;

const DUSK_TIMES = TimeOfDay.Evening | TimeOfDay.Night;

/**
 * What a ball's condition is measured against beyond the encounter
 * itself
 */
export interface SafariContext {
  /**
   * Whether the player already owns this species; the Repeat Ball
   * reads it. Unknown counts as not owned
   */
  speciesCaught?: boolean;
}

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

/**
 * What each ball already thrown adds to the next one.
 *
 * A player who came in well stocked used to be handed their last ball
 * outright, which is a rule that does nothing at all for the first
 * ninety-nine throws and then decides the encounter by itself — and it
 * asked the session how full the bag was, which is not something a
 * meeting between two pokemon should depend on.
 *
 * This is the same mercy paid out a percent at a time instead. It is
 * compound, so it is nothing for a while and then matters: the tenth
 * throw is worth a tenth more than the first, the seventieth twice as
 * much. Nothing rare falls to it — a Mewtwo would take hundreds of
 * balls before the drift caught up — but a long, patient meeting is
 * worth more than the same number of throws spread over several
 */
const THROW_DRIFT = 1.01;

const CATCH_RATE_SCALE = 255;

/**
 * How much of a ball's pull is left against a pokemon at the level
 * cap.
 *
 * The mainline formula reads how hurt the thing is, which is a number
 * an encounter here does not have: nothing is fought before it is
 * caught. Level is what this game knows about how much of a pokemon is
 * standing there, and a full-grown one shrugging off a ball a young one
 * would not is the same fact told the way this game can tell it
 */
export const LEVEL_CATCH_FLOOR = 0.45;

/**
 * What the level leaves of a throw: all of it at level 1, falling
 * evenly to `LEVEL_CATCH_FLOOR` at the cap.
 *
 * Evenly rather than on a curve, because a player who has met a few
 * dozen pokemon should be able to feel the rule without being told
 * it — twice the level, about half again as hard. It multiplies rather
 * than replacing anything, so a species that was easy to catch is
 * still the easier of the two at any level
 */
export function levelCatchFactor(level: number): number {
  const grown = Math.min(1, Math.max(0, (level - 1) / (MAX_LEVEL - 1)));

  return 1 - (1 - LEVEL_CATCH_FLOOR) * grown;
}

/**
 * Even the fastest species stays catchable: flee rolls cap here
 */
const MAX_FLEE_CHANCE = 0.5;

/**
 * A stable identity for an overworld encounter: the chunk cell
 * coordinates, the snapshot window and the rolled individual value
 */
export function encounterKey(encounter: Encounter): string {
  return spawnKey(encounter.x, encounter.y, encounter.timestamp, encounter.individualValue);
}

/**
 * The same key, from what a published roll already says.
 *
 * The chunk knows all three parts before anybody has met anything —
 * where it is, which window it is showing and what was rolled — which
 * is what lets the map leave out a pokemon that has already fled from
 * this player rather than drawing one that cannot be met
 */
export function spawnKey(x: number, y: number, timestamp: number, individualValue: number): string {
  return `${x},${y}@${timestamp}:${individualValue}`;
}

/**
 * The window a key belongs to, read back out of it.
 *
 * A fled encounter is only worth remembering while the window that
 * staged it is live: the spawn is gone when the window turns over,
 * and the key with it. Answers zero for anything that is not a key,
 * which reads as long expired
 */
export function encounterWindow(key: string): number {
  const window = Number(key.slice(key.lastIndexOf('@') + 1, key.lastIndexOf(':')));

  return Number.isFinite(window) ? window : 0;
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
export default class SafariSession<
  E extends Encounter = Encounter,
> extends EventEngine<SafariEventMap> {
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

  /**
   * How many balls the player carries right now, all kinds counted
   * together. The persistence layer refreshes it before each throw,
   * since the bag lives outside the session
   */
  ballsLeft = 0;

  /**
   * How many balls have been thrown at this encounter.
   *
   * The safari clock beside it counts feedings too, and this must not:
   * what wears a pokemon down is being thrown at, and a player who fed
   * it a berry has already been paid for that in the feeding bonus
   */
  throws = 0;

  /**
   * Whether the encounter is still chewing.
   *
   * One treat at a time: a player cannot pour the whole bag out at
   * once and walk the bonus up to its cap before throwing anything.
   * What clears it is a **throw that missed** — the encounter shook
   * the ball off and is open to being talked round again — so the
   * rhythm is feed, throw, feed, throw rather than feed, feed, feed
   */
  fed = false;

  constructor(
    public readonly encounter: E,
    public readonly random: () => number,
    public readonly context: SafariContext = {},
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
   * The effective modifier of a ball right now. The conditional
   * balls each read the encounter or the safari clock: the Quick
   * Ball only shines on the opening turn, the Timer Ball rewards
   * patience, the Net Ball answers Bug and Water types, the Dive
   * Ball the water biomes, the Nest Ball low levels, the Repeat Ball
   * a species already owned, and the Dusk Ball the dark hours.
   * Everything else takes its flat multiplier
   */
  getBallModifier(ball = this.ball): number {
    switch (ball) {
      case Balls.QuickBall:
        return this.turn === 0 ? QUICK_BALL_MODIFIER : 1;
      case Balls.TimerBall:
        return Math.min(TIMER_BALL_CAP, 1 + this.turn * TIMER_BALL_RATE);
      case Balls.NetBall: {
        const { types } = getSpeciesData(this.encounter.species);

        return types.includes(Types.Bug) || types.includes(Types.Water) ? NET_BALL_MODIFIER : 1;
      }
      case Balls.DiveBall:
        return isWaterBiome(this.encounter.biome) ? DIVE_BALL_MODIFIER : 1;
      case Balls.NestBall:
        return Math.max(
          1,
          Math.min(NEST_BALL_CAP, (NEST_BALL_LEVEL_BASE - this.encounter.level) / NEST_BALL_SCALE),
        );
      case Balls.RepeatBall:
        return this.context.speciesCaught === true ? REPEAT_BALL_MODIFIER : 1;
      case Balls.DuskBall:
        return (getTimeOfDay(this.encounter.timestamp) & DUSK_TIMES) === 0 ? 1 : DUSK_BALL_MODIFIER;
      // The unconditional balls: their multiplier never moves
      case Balls.PokeBall:
      case Balls.GreatBall:
      case Balls.UltraBall:
      case Balls.MasterBall:
      case Balls.PremierBall:
      case Balls.HealBall:
      case Balls.LuxuryBall:
      default:
        return BALL_MODIFIERS[ball];
    }
  }

  /**
   * Whether the encounter belongs to the day's featured family, which
   * comes along four times as readily
   */
  isFeatured(): boolean {
    return isFeaturedSpecies(this.encounter.species, this.encounter.timestamp);
  }

  /**
   * The chance the next throw lands: species catch rate, ball
   * modifier, accumulated feeding bonus, how grown the thing standing
   * there is, the family day's own bonus, and how many balls it has
   * already shaken off
   */
  getCatchChance(): number {
    const rate = getSpeciesData(this.encounter.species).catchRate;
    const day = this.isFeatured() ? SPECIES_DAY_CATCH_BOOST : 1;
    const grown = levelCatchFactor(this.encounter.level);
    // Every ball already thrown at it leaves it a little readier for
    // the next one
    const wearing = THROW_DRIFT ** this.throws;

    return Math.min(
      1,
      (rate * this.getBallModifier() * this.catchBonus * day * grown * wearing) / CATCH_RATE_SCALE,
    );
  }

  /**
   * How fast the thing standing there actually is: its own Speed, with
   * its level, its individual value and its nature in it rather than
   * the number printed against its species.
   *
   * The species' base Speed said that every Rattata in the world runs
   * alike — a level 5 one met in the first field bolts exactly as
   * readily as a level 40 one, and the fast individual with the fast
   * nature is no harder to hold onto than its slow cousin. Both of
   * those are facts the game already knows about the pokemon in front
   * of the player, and neither of them was being asked.
   *
   * No effort values: nothing wild has trained
   */
  getSpeed(): number {
    return getOtherStat(
      this.encounter.level,
      getSpeciesData(this.encounter.species).stats[Stats.Speed],
      getIV(this.encounter.ivs, Stats.Speed),
      0,
      getNatureFactor(this.encounter.nature, Stats.Speed),
    );
  }

  /**
   * The chance the encounter flees after a failed throw: the faster it
   * is, the more readily it bolts, capped so that even the fastest
   * stays catchable.
   *
   * Reading the real stat makes the flee roll grow with the level the
   * way the catch chance shrinks with it — a young pokemon is easy to
   * catch and easy to keep hold of, and a full-grown one is neither.
   * What was fought for — a raid's legendary, a beaten grunt's parting
   * gift — never bolts at all
   */
  getFleeChance(): number {
    if (isRaidEncounter(this.encounter.type) || this.encounter.type === EncounterType.Rocket) {
      return 0;
    }
    return Math.min(MAX_FLEE_CHANCE, this.getSpeed() / CATCH_RATE_SCALE);
  }

  /**
   * Whether the encounter would take a treat right now: it has to be
   * standing there, and it has to have finished the last one
   */
  canFeed(): boolean {
    return this.state === SafariState.Active && !this.fed;
  }

  /**
   * Feed the encounter a catch-improving item; false when the item
   * has no feeding effect, or when it is still chewing the last one
   */
  feed(item: Items): boolean {
    this.assertActive();

    if (!this.canFeed() || FEED_CATCH_BONUS[item] == null) {
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
      // It has a mouthful; nothing else is offered until a throw
      // misses
      event.session.fed = true;
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
    event.session.throws += 1;
    // A ball it shook off leaves it open to another treat. A catch
    // ends the session, so clearing the flag there would be for
    // nobody
    if (event.result !== ThrowResult.Caught) {
      event.session.fed = false;
    }
  });
}
