import { EventPriority } from '../../../core/event-emitter';
import type Abilities from '../../../data/ids/abilities';
import type Battle from '../../core';
import { BattleEvents } from '../../events';
import type { Lifecycle } from '../../lifecycle';
import type Unit from '../../unit';

/**
 * What the counting signature abilities share. A tally kept per unit,
 * emptied when its holder arrives on the field or falls: an ability
 * lifting and settling again is not an arrival
 */
export interface UnitCounter {
  get(unit: Unit): number;
  set(unit: Unit, value: number): void;
  clear(unit: Unit): void;
}

export function createUnitCounter(battle: Battle): {
  counter: UnitCounter;
  lifecycles: Lifecycle[];
} {
  const counts = new Map<Unit, number>();

  return {
    counter: {
      get: (unit) => counts.get(unit) ?? 0,
      set(unit, value) {
        counts.set(unit, value);
      },
      clear(unit) {
        counts.delete(unit);
      },
    },
    lifecycles: [
      battle.on(BattleEvents.UnitEntersField, EventPriority.Post, (event) => {
        if (!event.reactivation) {
          counts.delete(event.source);
        }
      }),
      battle.on(BattleEvents.UnitFaints, EventPriority.Post, (event) => {
        counts.delete(event.source);
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
