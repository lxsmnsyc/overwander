import { EventPriority } from '../../core/event-emitter';
import type Battle from '../core';
import { BattleEvents } from '../events';

/**
 * How many items a unit may hold is not the battle's business: the
 * record it was fielded from has a `slots` field, and a unit walks in
 * carrying exactly what that allowed. A second ceiling here would only
 * disagree with it — and used to, silently dropping a raid boss'
 * abilities on the floor
 */
export default function setupItemMechanics(battle: Battle): void {
  battle.on(BattleEvents.UnitAddItem, EventPriority.Exact, (event) => {
    event.source.items[event.item] = true;
  });
  battle.on(BattleEvents.UnitRemoveItem, EventPriority.Exact, (event) => {
    event.source.items[event.item] = undefined;
    // Remembered after the item is gone: what a unit spent in a
    // battle is what its catch record loses when the battle ends
    event.source.consumed.add(event.item);
  });
  battle.on(BattleEvents.UnitEnableItem, EventPriority.Exact, (event) => {
    event.source.items[event.item] = true;
  });
  battle.on(BattleEvents.UnitDisableItem, EventPriority.Exact, (event) => {
    event.source.items[event.item] = false;
  });
}
