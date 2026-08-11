import 'server-only';
import { asCaughtPokemon } from '../auth/caught-record';
import { CAUGHT_COLLECTION, INVENTORY_COLLECTION, inventoryEntryId } from '../auth/collections';
import { type HealthState, healedByItem } from '../auth/health';
import type { Items } from '../data/ids/items';
import { getAdminFirestore } from './firebase';
import { isEggRecord } from './catch-fields';
import { isCatchLocked } from './locks';
import { asNumber, docData } from './read';

/**
 * Healing between battles, written with admin credentials.
 *
 * A fight leaves a party hurt, statused or down, and the bag is what
 * puts it right without waiting for a candy: a berry off the bush, a
 * potion, a cure, a revive. The item leaves the bag and the pokemon's
 * health is written in the same transaction, so an item is never
 * spent on nothing and nothing is healed for free.
 *
 * What each item does is the item's own business — for a berry, the
 * same tables the battle reads — so the only decisions here are
 * whether the pokemon is the player's, whether it is in a state the
 * item can do something about, and whether the item is carried.
 */

/**
 * Use a healing item from the bag on one of the player's catches.
 *
 * A pokemon that is **down** can only be reached by a revive, and a
 * revive can only reach one that is down. Everything else is refused
 * where it would do nothing at all, since using it would spend it.
 *
 * Resolves the health and statuses the catch now has, or null when
 * the use is refused: the catch is not the player's, it is fighting,
 * it is still an egg, the item is not carried, or the item would
 * change nothing
 */
export default async function useHealingItem(
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
    // An egg has nothing to heal yet
    if (caught == null || caught.owner !== uid || isCatchLocked(caught) || isEggRecord(caught)) {
      return null;
    }

    const healed = healedByItem(asCaughtPokemon(caught), item);

    // The wrong cure, a pokemon already whole, a potion on a fainted
    // one, a revive on a standing one, or a berry that only does
    // anything inside a battle
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
