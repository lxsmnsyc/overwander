import { Stats } from '../../data/constants/stats';
import type { Moves } from '../../data/ids/moves';
import type Battle from '../core';
import { BattleEvents, type CheckUnitAIRatingEvent } from '../events';
import type Team from '../team';
import type Unit from '../unit';

/** How strong a unit currently is. Internal to the AI module */
export function checkUnitRating(battle: Battle, source: Unit): number {
  const event: CheckUnitAIRatingEvent = {
    id: 'CheckUnitAIRating',
    disabled: false,
    source,
    rating: 0,
  };
  battle.emit(BattleEvents.CheckUnitAIRating, event);
  return event.rating;
}

/** Every move a unit carries */
function* carriedMoves(unit: Unit): IterableIterator<Moves> {
  for (const state of Object.values(unit.moves)) {
    // oxlint-disable-next-line typescript/no-unnecessary-condition
    if (state) {
      yield state.move;
    }
  }
}

/**
 * What one unit's decision knows about the field, worked out once per
 * decision rather than once per move and target it weighs. Scoring is a
 * pure question, so nothing here goes stale while a decision runs
 */
export class AIContext {
  private readonly ratings = new Map<Unit, number>();
  private readonly healthShares = new Map<Team, number>();

  constructor(
    readonly battle: Battle,
    readonly source: Unit,
  ) {}

  /** The living units on the caster's side, the caster included */
  *friends(): IterableIterator<Unit> {
    for (const unit of this.battle.units()) {
      if (unit.alive && unit.team.alliance === this.source.team.alliance) {
        yield unit;
      }
    }
  }

  /** The living units on every other side */
  *foes(): IterableIterator<Unit> {
    for (const unit of this.battle.units(this.source.team.alliance)) {
      if (unit.alive) {
        yield unit;
      }
    }
  }

  /** Whether any living foe is known to have a move that passes the test */
  foesKnow(test: (move: Moves) => boolean): boolean {
    for (const foe of this.foes()) {
      for (const move of carriedMoves(foe)) {
        if (test(move)) {
          return true;
        }
      }
    }
    return false;
  }

  rating(unit: Unit): number {
    let rating = this.ratings.get(unit);

    if (rating == null) {
      rating = checkUnitRating(this.battle, unit);
      this.ratings.set(unit, rating);
    }
    return rating;
  }

  /**
   * How big a threat a unit is to the caster, in bands from 0 (under
   * half the caster's rating) to 3 (half again or more)
   */
  threatBand(unit: Unit): number {
    const ratio = this.rating(unit) / Math.max(1, this.rating(this.source));

    if (ratio >= 1.5) {
      return 3;
    }
    if (ratio >= 1) {
      return 2;
    }
    if (ratio >= 0.5) {
      return 1;
    }
    return 0;
  }

  /** A team's remaining health over its full health, fainted units counting as none */
  healthShare(team: Team = this.source.team): number {
    let share = this.healthShares.get(team);

    if (share == null) {
      let health = 0;
      let max = 0;

      for (const unit of team.units) {
        max += Math.max(1, unit.checkStat(Stats.HP, 0));
        if (unit.alive) {
          health += unit.health;
        }
      }
      share = max > 0 ? health / max : 0;
      this.healthShares.set(team, share);
    }
    return share;
  }
}

/** The decision in progress, per battle */
const current = new WeakMap<Battle, AIContext>();

/** Run a decision with one context shared by every question it asks */
export function withAIContext<T>(battle: Battle, source: Unit, decide: () => T): T {
  const previous = current.get(battle);

  current.set(battle, new AIContext(battle, source));
  try {
    return decide();
  } finally {
    if (previous == null) {
      current.delete(battle);
    } else {
      current.set(battle, previous);
    }
  }
}

/**
 * The context of the decision being made for this unit. A question
 * asked outside a decision, as a test does, gets a fresh one
 */
export function getAIContext(battle: Battle, source: Unit): AIContext {
  const context = current.get(battle);

  return context?.source === source ? context : new AIContext(battle, source);
}
