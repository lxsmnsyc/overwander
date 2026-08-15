import { EventPriority } from '../../core/event-emitter';
import { Slots, countsAgainstSlots } from '../../data/constants/slots';
import type Abilities from '../../data/ids/abilities';
import type Battle from '../core';
import { BattleEvents } from '../events';
import type Unit from '../unit';

/**
 * Abilities occupying the unit's slots. The special tier — a Boss, a
 * Shadow, the mark left where a shadow was — takes no room: they are
 * what a pokemon is rather than something it was given
 */
function countAbilities(unit: Unit): number {
  let count = 0;

  for (const key in unit.abilities) {
    // tsc requires the assertion to index the Abilities-mapped record;
    // tsgolint resolves the const enum to number and disagrees
    // oxlint-disable-next-line typescript/no-unnecessary-type-assertion
    const ability = Number(key) as Abilities;

    // oxlint-disable-next-line typescript/no-unnecessary-condition
    if (unit.abilities[ability] != null && countsAgainstSlots(ability)) {
      count += 1;
    }
  }

  return count;
}

export default function setupAbilityMechanics(battle: Battle): void {
  // A unit carries what it has room for, held to what the fight allows
  battle.on(BattleEvents.UnitAddAbility, EventPriority.Pre, (event) => {
    if (
      event.source.abilities[event.ability] == null &&
      countsAgainstSlots(event.ability) &&
      countAbilities(event.source) >= event.source.checkSlots(Slots.Ability)
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
