import 'server-only';
import { asCaughtPokemon } from '../auth/caught-record';
import { CAUGHT_COLLECTION, INVENTORY_COLLECTION, inventoryEntryId } from '../auth/collections';
import AleaRNG from '../core/alea';
import type { Items } from '../data/ids/items';
import { getMaxHealth, rescaleHealth } from '../auth/health';
import { BOTTLE_CAPS, polishIVs } from '../data/items/bottle-caps';
import { isEggRecord } from './catch-fields';
import { getAdminFirestore } from './firebase';
import { isCatchLocked } from './locks';
import { asNumber, docData } from './read';

/**
 * Using a bottle cap, written with admin credentials. Individual
 * values are the one part of a catch that nothing else can move, so
 * the only thing that moves them does it here: the cap is checked
 * against the bag, the stats against the stored record, and both are
 * written in one transaction — a cap is never spent on a pokemon that
 * did not change, and a pokemon never changes without one being spent.
 *
 * Which stats a plain cap polishes is the server's roll, not the
 * caller's: a client that chose would simply choose whichever stat it
 * wanted, and the cap would stop being a cap
 */

/**
 * Use a bottle cap on one of the player's catches. A golden cap
 * raises every value it can reach; a plain one raises a single stat,
 * drawn from the ones that are not already perfect so the cap is never
 * spent on a stat that needed nothing.
 *
 * Resolves the values the catch now has, or null when the use is
 * refused: the catch is not the player's, it is fighting, it is still
 * an egg, the item is not a cap, none is carried, or the pokemon is
 * already perfect
 */
export default async function useBottleCap(
  uid: string,
  catchId: string,
  item: Items,
  now: number,
): Promise<number | null> {
  const polishes = BOTTLE_CAPS.get(item);

  if (polishes == null) {
    return null;
  }

  const db = getAdminFirestore();

  return db.runTransaction(async (transaction) => {
    const caughtRef = db.collection(CAUGHT_COLLECTION).doc(catchId);
    const caught = docData(await transaction.get(caughtRef));

    // A pokemon fights as the snapshot froze it, and an egg is not a
    // pokemon yet: what is inside it was decided when it was found,
    // and it stays that way until it hatches
    if (caught == null || caught.owner !== uid || isCatchLocked(caught) || isEggRecord(caught)) {
      return null;
    }

    const stackRef = db.collection(INVENTORY_COLLECTION).doc(inventoryEntryId(uid, item));
    const stock = asNumber(docData(await transaction.get(stackRef))?.amount);

    if (stock < 1) {
      return null;
    }

    // Seeded by the catch, the cap and the instant, so the same cap
    // used twice on the same pokemon picks its own stat each time
    const record = asCaughtPokemon(caught);
    const rng = new AleaRNG(`${uid}:${catchId}:${item}:${now}`);
    const polished = polishIVs(record.ivs, polishes, () => rng.random());

    // Nothing left to polish, so nothing is spent
    if (polished == null) {
      return null;
    }

    transaction.set(stackRef, { user: uid, item, amount: stock - 1 });
    // Only the per-stat values move. `individualValue` is the roll the
    // encounter was staged from and stays the record of it — the
    // stored stats are what every reader uses, which is what lets a
    // bred egg and a capped pokemon differ from their own roll
    transaction.update(caughtRef, {
      ivs: polished,
      // A polished health value is a bigger pool, and the share of it
      // the pokemon was carrying is what it keeps
      health: rescaleHealth(
        record.health,
        getMaxHealth(record),
        getMaxHealth({ ...record, ivs: polished }),
      ),
    });
    return polished;
  });
}
