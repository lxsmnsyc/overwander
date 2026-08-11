import 'server-only';
import { asCaughtPokemon } from '../auth/caught-record';
import { CAUGHT_COLLECTION, INVENTORY_COLLECTION, inventoryEntryId } from '../auth/collections';
import { getMaxHealth, rescaleHealth } from '../auth/health';
import type { Items } from '../data/ids/items';
import type { Species } from '../data/ids/species';
import { getAvailableEvolutions, getConsumedItem, getSpeciesData } from '../data/species';
import { isEggRecord } from './catch-fields';
import { getAdminFirestore } from './firebase';
import { isCatchLocked } from './locks';
import { asNumber, asNumberArray, docData } from './read';

/**
 * Evolving, written with admin credentials. An evolution turns a
 * common pokemon into a rare one and spends a stone doing it, so the
 * criteria are checked here against the stored documents — level,
 * held item, carried item — and never taken from the caller.
 *
 * Resolves the new species, or null when the evolution is refused:
 * the catch is not the player's, the species is not one of its
 * evolutions, a condition is unmet, or the required item is gone
 */
export default async function evolveCatch(
  uid: string,
  catchId: string,
  into: Species,
): Promise<Species | null> {
  const db = getAdminFirestore();

  return db.runTransaction(async (transaction) => {
    const caughtRef = db.collection(CAUGHT_COLLECTION).doc(catchId);
    const caught = docData(await transaction.get(caughtRef));

    // A pokemon in a live battle fights as the species its snapshot
    // froze, so it evolves once the fight is over and not before —
    // and an egg has to become a pokemon before it can become a
    // different one
    if (caught == null || caught.owner !== uid || isCatchLocked(caught) || isEggRecord(caught)) {
      return null;
    }

    // oxlint-disable-next-line typescript/no-unnecessary-type-assertion
    const species = asNumber(caught.species) as Species;
    const evolution = (getSpeciesData(species).evolvesInto ?? []).find(
      (entry) => entry.species === into,
    );

    if (evolution == null) {
      return null;
    }

    const consumed = getConsumedItem(evolution);
    // Only the item this evolution actually needs is read; the rest
    // of the bag has no bearing on the criteria
    const carried = new Set<Items>();
    let stock = 0;

    if (consumed != null) {
      const stackRef = db.collection(INVENTORY_COLLECTION).doc(inventoryEntryId(uid, consumed));

      stock = asNumber(docData(await transaction.get(stackRef))?.amount);

      if (stock > 0) {
        carried.add(consumed);
      }
    }

    const context = {
      level: asNumber(caught.level),
      carried,
      // The catch carries what it holds, so the criteria read the
      // same document the species change is written back to
      // oxlint-disable-next-line typescript/no-unnecessary-type-assertion
      held: new Set(asNumberArray(caught.items) as Items[]),
    };

    if (!getAvailableEvolutions(species, context).some((entry) => entry.species === into)) {
      return null;
    }

    if (consumed != null) {
      transaction.set(db.collection(INVENTORY_COLLECTION).doc(inventoryEntryId(uid, consumed)), {
        user: uid,
        item: consumed,
        amount: stock - 1,
      });
    }
    // An evolution is a bigger pokemon, not a healed one: the share
    // of health it had is what it keeps, so a Charmander at half
    // stays a Charmeleon at half
    const record = asCaughtPokemon(caught);

    transaction.update(caughtRef, {
      species: into,
      health: rescaleHealth(
        record.health,
        getMaxHealth(record),
        getMaxHealth({ ...record, species: into }),
      ),
    });
    return into;
  });
}
