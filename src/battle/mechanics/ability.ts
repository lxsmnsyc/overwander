import { EventPriority } from '../../core/event-emitter';
import type Battle from '../core';
import { BattleEvents } from '../events';
import type Unit from '../unit';

/**
 * Abilities currently occupying the unit's slots (disabled ones
 * included)
 */
function countAbilities(unit: Unit): number {
  let count = 0;

  for (const active of Object.values(unit.abilities)) {
    // tsc types the mapped-record values as possibly undefined;
    // tsgolint disagrees, so the guard is flagged as unnecessary
    // oxlint-disable-next-line typescript/no-unnecessary-condition
    if (active != null) {
      count += 1;
    }
  }

  return count;
}

export default function setupAbilityMechanics(battle: Battle): void {
  // A unit cannot have more abilities than the battle allows
  battle.on(BattleEvents.UnitAddAbility, EventPriority.Pre, (event) => {
    if (
      event.source.abilities[event.ability] == null &&
      countAbilities(event.source) >= battle.limits.abilities
    ) {
      event.disabled = true;
    }
  });

  battle.on(BattleEvents.UnitAddAbility, EventPriority.Exact, (event) => {
    event.source.abilities[event.ability] = true;
  });
  battle.on(BattleEvents.UnitRemoveAbility, EventPriority.Exact, (event) => {
    event.source.abilities[event.ability] = undefined;
  });
  battle.on(BattleEvents.UnitEnableAbility, EventPriority.Exact, (event) => {
    event.source.abilities[event.ability] = true;
  });
  battle.on(BattleEvents.UnitDisableAbility, EventPriority.Exact, (event) => {
    event.source.abilities[event.ability] = false;
  });
}
