import { AttackPriority, EventPriority } from '../../../core/event-emitter';
import type Abilities from '../../../data/ids/abilities';
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
