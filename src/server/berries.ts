import 'server-only';
import { asCaughtPokemon } from '../auth/caught-record';
import { CAUGHT_COLLECTION, INVENTORY_COLLECTION, inventoryEntryId } from '../auth/collections';
import { type HealthState, healedByBerry } from '../auth/health';
import type { Items } from '../data/ids/items';
import { getAdminFirestore } from './firebase';
import { isEggRecord } from './catch-fields';
import { isCatchLocked } from './locks';
import { asNumber, docData } from './read';

/**
 * Feeding a berry between battles, written with admin credentials.
 *
 * A fight leaves a party hurt and statused, and a berry is what puts
 * it right without waiting for a candy. The berry leaves the bag and
 * the pokemon's health is written in the same transaction, so a berry
 * is never spent on nothing and nothing is healed for free.
 *
 * What each berry does is the berry's own business — the same tables
 * the battle reads — so the only decisions here are whether the
 * pokemon is the player's, whether it is in a state the berry can do
 * something about, and whether the berry is actually carried.
 */

/**
 * Feed one of the player's catches a berry from the bag.
 *
 * A pokemon that is **down** can be fed: nothing in the game revives,
 * so a restoring berry is the way back up. A pokemon that is whole
 * and clean cannot — there would be nothing for the berry to do, and
 * it would be spent doing it.
 *
 * Resolves the health and status the catch now has, or null when the
 * feeding is refused: the catch is not the player's, it is fighting,
 * it is still an egg, the berry is not carried, or the berry would
 * change nothing
 */
export default async function feedBerry(
  uid: string,
  catchId: string,
  item: Items,
): Promise<HealthState | null> {
  const db = getAdminFirestore();

  return db.runTransaction(async (transaction) => {
    const caughtRef = db.collection(CAUGHT_COLLECTION).doc(catchId);
    const caught = docData(await transaction.get(caughtRef));

    // A pokemon in a live battle is fighting on a frozen snapshot;
    // healing the record under it would leave the two disagreeing.
    // An egg has nothing to feed yet
    if (caught == null || caught.owner !== uid || isCatchLocked(caught) || isEggRecord(caught)) {
      return null;
    }

    const healed = healedByBerry(asCaughtPokemon(caught), item);

    // The wrong cure, a pokemon already whole, or a berry that only
    // does anything inside a battle
    if (healed == null) {
      return null;
    }

    const stackRef = db.collection(INVENTORY_COLLECTION).doc(inventoryEntryId(uid, item));
    const stock = asNumber(docData(await transaction.get(stackRef))?.amount);

    if (stock < 1) {
      return null;
    }

    transaction.set(stackRef, { user: uid, item, amount: stock - 1 });
    transaction.update(caughtRef, { health: healed.health, statuses: healed.statuses });
    return healed;
  });
}
