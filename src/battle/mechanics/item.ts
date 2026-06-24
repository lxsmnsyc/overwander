import { EventPriority } from '../../core/event-emitter';
import type { Battle } from '../core';
import { BattleEvents } from '../events';

export function setupItemMechanics(battle: Battle) {
  battle.on(BattleEvents.UnitAddItem, EventPriority.Exact, event => {
    event.source.items[event.item] = true;
  });
  battle.on(BattleEvents.UnitRemoveItem, EventPriority.Exact, event => {
    event.source.items[event.item] = undefined;
  });
  battle.on(BattleEvents.UnitEnableItem, EventPriority.Exact, event => {
    event.source.items[event.item] = true;
  });
  battle.on(BattleEvents.UnitDisableItem, EventPriority.Exact, event => {
    event.source.items[event.item] = false;
  });
}
