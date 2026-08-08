import { EventPriority } from '../../core/event-emitter';
import type Battle from '../core';
import { BattleEvents } from '../events';

export default function setupAbilityMechanics(battle: Battle): void {
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
