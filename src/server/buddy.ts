import 'server-only';
import { BUDDY_COLLECTION, CAUGHT_COLLECTION } from '../auth/collections';
import type { Items } from '../data/ids/items';
import { getAdminFirestore } from './firebase';
import { asNumberArray, docData } from './read';

/**
 * Whether the player's buddy is holding the item. Overworld effects
 * read it — the Shiny Charm's boost, for one — and they run on the
 * server, where the answer decides what a meeting is worth.
 *
 * Ownership is re-checked: a trade leaves the buddy record pointing
 * at someone else's pokemon, and a charm held by a pokemon the player
 * no longer owns is not theirs to benefit from
 */
export default async function isBuddyHolding(uid: string, item: Items): Promise<boolean> {
  const db = getAdminFirestore();
  const buddy = docData(await db.collection(BUDDY_COLLECTION).doc(uid).get());
  const catchId = buddy?.caught;

  if (typeof catchId !== 'string' || catchId === '') {
    return false;
  }

  const caught = docData(await db.collection(CAUGHT_COLLECTION).doc(catchId).get());

  if (caught == null || caught.owner !== uid) {
    return false;
  }
  return new Set(asNumberArray(caught.items)).has(item);
}
