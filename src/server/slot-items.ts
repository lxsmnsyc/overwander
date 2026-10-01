import 'server-only';
import { ITEM_STACKS } from '../auth/stacks';
import { type Slots, getSlots, mostSlots, withSlots } from '../data/constants/slots';
import type { Items } from '../data/ids/items';
import { isEggRecord, isGuardedRecord } from './catch-fields';
import { readCaughtIn, updateCaughtIn } from './caught-io';
import { tx } from './db';
import { isCatchLocked } from './locks';
import { asNumber } from './read';
import { readStackIn, writeStackIn } from './stacks';

/**
 * Widen one of the player's catches by a slot of one kind, spending one
 * `price` out of the bag. The item and the room move in one transaction,
 * so nothing is spent on a pokemon that gained nothing.
 *
 * Resolves the slots of that kind the catch now has, or null when it is
 * refused: the catch is not the player's, it is fighting, it is still an
 * egg or guarded, none of the item is carried, or it is already as roomy
 * as that kind allows
 */
export default async function widenSlot(
  uid: string,
  catchId: string,
  price: Items,
  kind: Slots,
): Promise<number | null> {
  return tx(async (transaction) => {
    const caught = await readCaughtIn(transaction, catchId);

    if (
      caught == null ||
      caught.owner !== uid ||
      isCatchLocked(caught) ||
      isEggRecord(caught) ||
      isGuardedRecord(caught)
    ) {
      return null;
    }

    const stock = await readStackIn(transaction, ITEM_STACKS, uid, price);

    if (stock < 1) {
      return null;
    }

    const slots = asNumber(caught.slots);
    const room = getSlots(slots, kind);

    if (room >= mostSlots(kind)) {
      return null;
    }

    await writeStackIn(transaction, ITEM_STACKS, uid, price, stock - 1);
    await updateCaughtIn(transaction, catchId, { slots: withSlots(slots, kind, room + 1) });

    return room + 1;
  });
}
