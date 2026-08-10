import 'server-only';
import { INVENTORY_COLLECTION, inventoryEntryId } from '../auth/collections';
import type { Items } from '../data/ids/items';
import { getAdminFirestore } from './firebase';
import { asNumber, docData } from './read';

/**
 * The bag, written with admin credentials. Items are value: a client
 * that could write these documents could mint Master Balls, so the
 * rules leave the collection read-only and every change lands here.
 *
 * The uid is the one a verified token resolved to — these functions
 * are internal to the server and never take it from a request
 */

function getEntryRef(uid: string, item: Items): FirebaseFirestore.DocumentReference {
  return getAdminFirestore().collection(INVENTORY_COLLECTION).doc(inventoryEntryId(uid, item));
}

/**
 * Add items to the bag, creating the stack on first acquisition
 */
export async function grantItem(uid: string, item: Items, count = 1): Promise<void> {
  const db = getAdminFirestore();

  await db.runTransaction(async (transaction) => {
    const ref = getEntryRef(uid, item);
    const current = asNumber(docData(await transaction.get(ref))?.amount);

    transaction.set(ref, { user: uid, item, amount: current + count });
  });
}

/**
 * Spend items; resolves false (and changes nothing) when the player
 * does not carry enough. A stack spent to zero stays as a zero
 * document and is filtered out on read
 */
export async function consumeItem(uid: string, item: Items, count = 1): Promise<boolean> {
  const db = getAdminFirestore();

  return db.runTransaction(async (transaction) => {
    const ref = getEntryRef(uid, item);
    const current = asNumber(docData(await transaction.get(ref))?.amount);

    if (current < count) {
      return false;
    }
    transaction.set(ref, { user: uid, item, amount: current - count });
    return true;
  });
}
