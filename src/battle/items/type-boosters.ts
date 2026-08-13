import { EventPriority } from '../../core/event-emitter';
import { INCENSE_TYPES } from '../../data/items/incenses';
import { PLATES } from '../../data/items/plates';
import { TYPE_BOOSTERS } from '../../data/items/type-boosters';
import { BattleEvents } from '../events';
import { createHeldItems, holds } from './__create';

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
 * The incenses and the plates that lift a type are the same thing
 * under another name — an Odd Incense does for Psychic what a Twisted
 * Spoon does, and a Flame Plate what a Charcoal does — so all three
 * families are boosted through here rather than through listeners
 * that would have to agree with this one.
 */

/**
 * Every item that lifts a type, whichever family it came from
 */
const BOOSTS = new Map([...TYPE_BOOSTERS, ...INCENSE_TYPES, ...PLATES]);

/**
 * A fifth more power, as the mainline has paid since Gen 4
 */
export const TYPE_BOOSTER_FACTOR = 1.2;

export default createHeldItems(
  () => BOOSTS.keys(),
  (battle) =>
    battle.on(BattleEvents.CheckUnitMovePower, EventPriority.Post, (event) => {
      if (event.power == null) {
        return;
      }

      const type = event.source.checkMoveType(event.move, event.target);

      for (const [item, boosted] of BOOSTS) {
        // Only an enabled item boosts: one that has been disabled is
        // still in the holder's grip but does nothing
        if (boosted === type && holds(event.source, item)) {
          event.power *= TYPE_BOOSTER_FACTOR;
          return;
        }
      }
    }),
);
