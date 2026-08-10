import { EventPriority } from '../../core/event-emitter';
import { TYPE_BOOSTERS } from '../../data/items/type-boosters';
import type Battle from '../core';
import { BattleEvents } from '../events';

/**
 * Type-enhancing held items: a Charcoal makes its holder's Fire moves
 * hit a fifth harder, a Mystic Water does the same for Water, and so
 * on for every attacking type.
 *
 * They ride the power check at Post, after the move's own base power
 * is in, and read the move's **resolved** type rather than its
 * printed one — a move turned Electric by something else is boosted
 * by a Magnet, not by whatever its data says.
 */

/**
 * A fifth more power, as the mainline has paid since Gen 4
 */
export const TYPE_BOOSTER_FACTOR = 1.2;

export default function setupTypeBoosters(battle: Battle): void {
  battle.on(BattleEvents.CheckUnitMovePower, EventPriority.Post, (event) => {
    if (event.power == null) {
      return;
    }

    const type = event.source.checkMoveType(event.move, event.target);

    for (const [item, boosted] of TYPE_BOOSTERS) {
      // Only an enabled item boosts: one that has been disabled is
      // still in the holder's grip but does nothing
      if (boosted === type && event.source.items[item] === true) {
        event.power *= TYPE_BOOSTER_FACTOR;
        return;
      }
    }
  });
}
