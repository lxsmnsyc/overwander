import { AttackPriority, EventPriority } from '../../../core/event-emitter';
import { Stats } from '../../../data/constants/stats';
import type Abilities from '../../../data/ids/abilities';
import { MoveCategories, Moves } from '../../../data/ids/moves';
import { getMoveData } from '../../../data/moves';
import type Battle from '../../core';
import { BattleEvents, type UnitDamageEvent } from '../../events';
import type { Lifecycle } from '../../lifecycle';
import type Unit from '../../unit';

/**
 * What the signature abilities that remember something share: state
 * kept per unit and dropped when that unit arrives on the field or
 * falls. An ability lifting and settling again is not an arrival
 */
export function createUnitState<T>(battle: Battle): {
  state: Map<Unit, T>;
  lifecycles: Lifecycle[];
} {
  const state = new Map<Unit, T>();

  return {
    state,
    lifecycles: [
      battle.on(BattleEvents.UnitEntersField, EventPriority.Post, (event) => {
        if (!event.reactivation) {
          state.delete(event.source);
        }
      }),
      battle.on(BattleEvents.UnitFaints, EventPriority.Post, (event) => {
        state.delete(event.source);
      }),
    ],
  };
}

/** A tally per unit, with an unwritten one reading zero */
export interface UnitCounter {
  get(unit: Unit): number;
  set(unit: Unit, value: number): void;
  clear(unit: Unit): void;
}

export function createUnitCounter(battle: Battle): {
  counter: UnitCounter;
  lifecycles: Lifecycle[];
} {
  const { state, lifecycles } = createUnitState<number>(battle);

  return {
    counter: {
      get: (unit) => state.get(unit) ?? 0,
      set(unit, value) {
        state.set(unit, value);
      },
      clear(unit) {
        state.delete(unit);
      },
    },
    lifecycles,
  };
}

/**
 * What a blow actually took off, which is not what it asked for:
 * overkill and a non-lethal clamp both settle out of the health
 * standing before it. Read it from a UnitDamage listener at Post
 */
export function createDamageTaken(battle: Battle): {
  taken(event: UnitDamageEvent): number | undefined;
  lifecycles: Lifecycle[];
} {
  const standing = new WeakMap<object, number>();

  return {
    taken(event) {
      const before = standing.get(event);

      if (before == null) {
        return undefined;
      }

      standing.delete(event);

      return Math.max(0, before - event.target.health);
    },
    lifecycles: [
      battle.on(BattleEvents.UnitDamage, AttackPriority.Pre, (event) => {
        standing.set(event, event.target.health);
      }),
    ],
  };
}

/**
 * Whether anybody still standing carries the ability, wherever they
 * stand. It is what a field-wide signature reads: the effect belongs
 * to the fight rather than to a side
 */
export function fieldHasAbility(battle: Battle, ability: Abilities): boolean {
  for (const unit of battle.units()) {
    if (unit.alive && unit.hasAbility(ability)) {
      return true;
    }
  }

  return false;
}

/**
 * The standing holder on the other side of the fight from this unit,
 * for an effect a holder works on its enemies
 */
export function enemyHolder(battle: Battle, unit: Unit, ability: Abilities): Unit | undefined {
  for (const other of battle.units(unit.team.alliance)) {
    if (other.alive && other.hasAbility(ability)) {
      return other;
    }
  }

  return undefined;
}

/**
 * The moves no signature reads: a confused unit hitting itself, the
 * bare fallback swing and the last resort. None of them are the
 * pokemon's own attack, and one of them has no registry entry to ask
 */
const PSEUDO_MOVES = new Set<Moves>([Moves._Confused, Moves.Struggle, Moves.Attack]);

/** Whether this is a physical move the pokemon actually chose */
export function isPhysicalMove(move: Moves): boolean {
  return !PSEUDO_MOVES.has(move) && getMoveData(move).category === MoveCategories.Physical;
}

/** Whether the move is held down over steps rather than let go at once */
export function isChannelledMove(move: Moves): boolean {
  return !PSEUDO_MOVES.has(move) && (getMoveData(move).steps ?? 0) > 0;
}

/**
 * The shared half of every effect that slows down the next thing a
 * unit reaches for: a coil, a spiral, a blow to the head. The mark is
 * dropped as the cast begins rather than as it is asked about, since
 * the AI asks about a cast time many times before one starts
 */
export function createNextCastPenalty(
  battle: Battle,
  scale: number,
): {
  mark(unit: Unit): void;
  lifecycles: Lifecycle[];
} {
  const marked = new Set<Unit>();

  return {
    mark(unit) {
      marked.add(unit);
    },
    lifecycles: [
      battle.on(BattleEvents.CheckUnitMoveCastTime, EventPriority.Post, (event) => {
        if (marked.has(event.source)) {
          event.duration *= scale;
        }
      }),
      battle.on(BattleEvents.UnitCast, EventPriority.Post, (event) => {
        marked.delete(event.source);
      }),
    ],
  };
}

/**
 * Marks that let go on their own, for the effects that hold somebody
 * for a few seconds rather than until something happens. The clock
 * only runs while at least one mark stands
 */
export function createTimedMarks(battle: Battle): {
  mark(unit: Unit, duration: number): void;
  has(unit: Unit): boolean;
  lifecycles: Lifecycle[];
} {
  const marks = new Map<Unit, number>();

  const clock = battle.on(BattleEvents.Tick, EventPriority.Post, (event) => {
    const expired: Unit[] = [];

    for (const [unit, left] of marks) {
      const next = left - event.duration;

      if (next <= 0) {
        expired.push(unit);
      } else {
        marks.set(unit, next);
      }
    }

    for (const unit of expired) {
      marks.delete(unit);
    }

    if (marks.size === 0) {
      clock.stop();
    }
  });

  clock.stop();

  return {
    mark(unit, duration) {
      marks.set(unit, duration);
      clock.start();
    },
    has: (unit) => marks.has(unit),
    lifecycles: [clock],
  };
}

/**
 * The five a fight is fought with. HP is left out: it is not a stat a
 * pokemon leans on, it is the room it has to be wrong in
 */
export const BATTLE_STATS = [
  Stats.Attack,
  Stats.Defense,
  Stats.SpecialAttack,
  Stats.SpecialDefense,
  Stats.Speed,
];

/**
 * Reads which of a unit's five stats stand highest and lowest. Asking
 * for a stat emits the same event the caller is answering, so the
 * measurement raises a flag the caller checks before it does anything
 */
/**
 * The mean of a unit's five battle stats, with the same guard the
 * extremes carry: reading the stats asks the stat check again, and a
 * listener built on this must sit that reading out
 */
export function createStatAverage(): {
  measuring(): boolean;
  average(unit: Unit): number;
} {
  let measuring = false;

  return {
    measuring: () => measuring,
    average(unit) {
      measuring = true;

      let total = 0;

      for (const stat of BATTLE_STATS) {
        total += unit.checkStat(stat, 0);
      }

      measuring = false;

      return total / BATTLE_STATS.length;
    },
  };
}

export function createStatExtremes(): {
  measuring(): boolean;
  extremes(unit: Unit): { highest: Stats; lowest: Stats };
} {
  let measuring = false;

  return {
    measuring: () => measuring,
    extremes(unit) {
      measuring = true;

      let highest = BATTLE_STATS[0];
      let lowest = BATTLE_STATS[0];
      let highestValue = Number.NEGATIVE_INFINITY;
      let lowestValue = Number.POSITIVE_INFINITY;

      for (const stat of BATTLE_STATS) {
        const value = unit.checkStat(stat, 0);

        if (value > highestValue) {
          highest = stat;
          highestValue = value;
        }

        if (value < lowestValue) {
          lowest = stat;
          lowestValue = value;
        }
      }

      measuring = false;

      return { highest, lowest };
    },
  };
}
