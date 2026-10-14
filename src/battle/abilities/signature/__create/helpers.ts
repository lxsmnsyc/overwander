import { AttackPriority, EventPriority } from '../../../../core/event-emitter';
import { Stats } from '../../../../data/constants/stats';
import type Abilities from '../../../../data/ids/abilities';
import type { Moves } from '../../../../data/ids/moves';
import { MoveCategories, MoveFlags, MoveTargets } from '../../../../data/ids/moves';
import { getMoveData } from '../../../../data/moves';
import { Statuses } from '../../../../data/ids/status';
import type Battle from '../../../battle';
import { BattleEvents, type UnitDamageEvent } from '../../../events';
import type { Lifecycle } from '../../../lifecycle';
import type Unit from '../../../unit';
import { getAbilityHolders } from '../../__create';
import { BATTLE_STATS } from '../../__create/stats';
import { PSEUDO_MOVES } from '../../../../data/moves/pseudo';

/**
 * What the signature abilities that remember something share: state
 * kept per unit and dropped when that unit arrives on the field or
 * falls. An ability lifting and settling again is not an arrival
 */
/** The first enemy still standing, for an ability that casts at one */
export function firstEnemy(battle: Battle, unit: Unit): Unit | undefined {
  for (const enemy of battle.units(unit.team.alliance)) {
    if (enemy.alive) {
      return enemy;
    }
  }

  return undefined;
}

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
 * A standing holder of this ability anywhere on the field, or none.
 *
 * The candidates come from the ability factory's own holder list
 * rather than from a sweep of the field, since these questions are
 * asked from checks that run on every stat and every hit. The two
 * things the list does not know are still asked of each candidate:
 * whether it is still standing, and whether something is suppressing
 * what it carries
 */
export function fieldHolder(battle: Battle, ability: Abilities): Unit | undefined {
  for (const unit of getAbilityHolders(battle, ability)) {
    if (unit.alive && unit.hasAbility(ability)) {
      return unit;
    }
  }

  return undefined;
}

/**
 * Whether anybody still standing carries the ability, wherever they
 * stand. It is what a field-wide signature reads: the effect belongs
 * to the fight rather than to a side
 */
export function fieldHasAbility(battle: Battle, ability: Abilities): boolean {
  return fieldHolder(battle, ability) != null;
}

/**
 * The standing holder on the other side of the fight from this unit,
 * for an effect a holder works on its enemies
 */
export function enemyHolder(battle: Battle, unit: Unit, ability: Abilities): Unit | undefined {
  for (const other of getAbilityHolders(battle, ability)) {
    if (other.alive && other.team.alliance !== unit.team.alliance && other.hasAbility(ability)) {
      return other;
    }
  }

  return undefined;
}

/**
 * The standing holder on this unit's own side, itself included: an
 * effect that reaches everybody under the same banner
 */
export function sideHolder(battle: Battle, unit: Unit, ability: Abilities): Unit | undefined {
  for (const other of getAbilityHolders(battle, ability)) {
    if (other.alive && other.team === unit.team && other.hasAbility(ability)) {
      return other;
    }
  }

  return undefined;
}

/**
 * The standing holder beside this unit, itself excluded: an effect one
 * pokemon works on the rest of its side
 */
export function allyHolder(battle: Battle, unit: Unit, ability: Abilities): Unit | undefined {
  for (const other of getAbilityHolders(battle, ability)) {
    if (other !== unit && other.alive && other.team === unit.team && other.hasAbility(ability)) {
      return other;
    }
  }

  return undefined;
}

/** The standing teammate with the smallest share of its HP left, itself excluded */
export function worstHurtMate(unit: Unit): Unit | undefined {
  let worst: Unit | undefined;
  let lowest = Infinity;

  for (const mate of unit.team.units) {
    if (mate === unit || !mate.alive) {
      continue;
    }

    const share = mate.health / mate.checkStat(Stats.HP, 0);

    if (share < lowest) {
      worst = mate;
      lowest = share;
    }
  }

  return worst;
}

/** Whether this is a physical move the pokemon actually chose */
export function isPhysicalMove(move: Moves): boolean {
  return !PSEUDO_MOVES.has(move) && getMoveData(move).category === MoveCategories.Physical;
}

/** Whether the move is one aimed at a single pokemon the holder chose */
export function isSingleTargetMove(move: Moves): boolean {
  return !PSEUDO_MOVES.has(move) && getMoveData(move).target === MoveTargets.Unit;
}

/** Whether the move is one carried on sound the pokemon actually chose */
export function isSoundMove(move: Moves): boolean {
  return !PSEUDO_MOVES.has(move) && (getMoveData(move).flags & MoveFlags.Sound) !== 0;
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

/** Whether the unit is carrying poison of either kind */
export function isPoisoned(unit: Unit): boolean {
  return unit.status[Statuses.Poisoned] != null || unit.status[Statuses.BadlyPoisoned] != null;
}
