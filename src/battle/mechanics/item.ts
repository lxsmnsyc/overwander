import { EventPriority } from '../../core/event-emitter';
import { ItemFlags } from '../../data/ids/items';
import { getItemData } from '../../data/items';
import type Battle from '../core';
import { BattleEvents } from '../events';
import { countHeldItems } from '../utils';

export default function setupItemMechanics(battle: Battle): void {
  // A unit cannot carry more holdable items than the battle allows
  battle.on(BattleEvents.UnitAddItem, EventPriority.Pre, (event) => {
    if (
      event.source.items[event.item] == null &&
      getItemData(event.item).flags & ItemFlags.Holdable &&
      countHeldItems(event.source) >= battle.limits.items
    ) {
      event.disabled = true;
    }
  });

  battle.on(BattleEvents.UnitAddItem, EventPriority.Exact, (event) => {
    event.source.items[event.item] = true;
  });
  battle.on(BattleEvents.UnitRemoveItem, EventPriority.Exact, (event) => {
    event.source.items[event.item] = undefined;
  });
  battle.on(BattleEvents.UnitEnableItem, EventPriority.Exact, (event) => {
    event.source.items[event.item] = true;
  });
  battle.on(BattleEvents.UnitDisableItem, EventPriority.Exact, (event) => {
    event.source.items[event.item] = false;
  });
}
