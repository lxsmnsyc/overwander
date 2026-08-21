import 'server-only';
import { ITEM_STACKS } from '../auth/stacks';
import { MAX_SLOTS, getSlots, withSlots } from '../data/constants/slots';
import { Items } from '../data/ids/items';
import { UTILITY_BELT_SLOT } from '../data/items/utility-belt';
import { isEggRecord, isGuardedRecord } from './catch-fields';
import { readCaughtIn, updateCaughtIn } from './caught-io';
import { tx } from './db';
import { isCatchLocked } from './locks';
import { asNumber } from './read';
import { readStackIn, writeStackIn } from './stacks';

/**
 * Using a Utility Belt, written with admin credentials.
 *
 * How much room a pokemon has is the one thing about it that decides
 * what it can be handed afterwards, so the only thing that moves it
 * does so here: the belt is checked against the bag, the room against
 * the stored record, and both are written in one transaction — a belt
 * is never spent on a pokemon that gained nothing.
 */

/**
 * Widen one of the player's catches by a slot.
 *
 * Resolves the number of item slots the catch now has, or null when
 * the use is refused: the catch is not the player's, it is fighting,
 * it is still an egg or guarded, no belt is carried, or the pokemon
 * already has as much room as the field can hold
 */
export default async function useUtilityBelt(uid: string, catchId: string): Promise<number | null> {
  return tx(async (transaction) => {
    const caught = await readCaughtIn(transaction, catchId);

    // A pokemon fights as the snapshot froze it, so widening one
    // mid-raid would change the record its own battle is not reading;
    // an egg is not a pokemon yet, and has nothing to hold
    if (
      caught == null ||
      caught.owner !== uid ||
      isCatchLocked(caught) ||
      isEggRecord(caught) ||
      isGuardedRecord(caught)
    ) {
      return null;
    }

    const stock = await readStackIn(transaction, ITEM_STACKS, uid, Items.UtilityBelt);

    if (stock < 1) {
      return null;
    }

    const slots = asNumber(caught.slots);
    const room = getSlots(slots, UTILITY_BELT_SLOT);

    // Nothing left to widen, so nothing is spent
    if (room >= MAX_SLOTS) {
      return null;
    }

    await writeStackIn(transaction, ITEM_STACKS, uid, Items.UtilityBelt, stock - 1);
    await updateCaughtIn(transaction, catchId, {
      slots: withSlots(slots, UTILITY_BELT_SLOT, room + 1),
    });

    return room + 1;
  });
}
