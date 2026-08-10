import { EventPriority } from '../../core/event-emitter';
import { INCENSE_TYPES } from '../../data/items/incenses';
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
 *
 * The incenses that lift a type are the same thing under another
 * name — an Odd Incense does for Psychic what a Twisted Spoon does —
 * so they are boosted through here rather than through a second
 * listener that would have to agree with this one.
 */

/**
 * Every item that lifts a type, whichever family it came from
 */
const BOOSTS = new Map([...TYPE_BOOSTERS, ...INCENSE_TYPES]);

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

    for (const [item, boosted] of BOOSTS) {
      // Only an enabled item boosts: one that has been disabled is
      // still in the holder's grip but does nothing
      if (boosted === type && event.source.items[item] === true) {
        event.power *= TYPE_BOOSTER_FACTOR;
        return;
      }
    }
  });
}
