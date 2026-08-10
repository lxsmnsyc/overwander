import { runTransaction } from 'firebase/firestore';
import type { Items } from '../data/ids/items';
import type { Species } from '../data/ids/species';
import { getAvailableEvolutions, getConsumedItem, getSpeciesData } from '../data/species';
import type { EvolutionData } from '../data/species';
import { getCaught, getCaughtRef } from './caught';
import { getFirebaseFirestore } from './firebase';
import { getInventory, getEntryRef as getInventoryEntryRef } from './inventory';

/**
 * Every evolution the catch can take right now: its level, the items
 * its owner carries and the items it holds are all measured against
 * the species' evolution data. Resolves an empty list when the catch
 * is not the user's or nothing qualifies
 */
export async function listEvolutions(uid: string, catchId: string): Promise<EvolutionData[]> {
  const [caught, inventory] = await Promise.all([getCaught(catchId), getInventory(uid)]);

  if (caught == null || caught.owner !== uid) {
    return [];
  }

  return getAvailableEvolutions(caught.species, {
    level: caught.level,
    carried: new Set(inventory.filter((entry) => entry.amount > 0).map((entry) => entry.item)),
    held: new Set(caught.items),
  });
}

/**
 * Evolve the catch into the given species. The criteria are checked
 * again inside the transaction against the stored documents, and an
 * evolution that uses an item spends it from the inventory in the
 * same transaction, so the item and the new species land together.
 * Resolves the new species, or null when the evolution is refused:
 * the catch is not the user's, the species is not one of its
 * evolutions, a condition is unmet, or the required item is gone
 */
export async function evolveCatch(
  uid: string,
  catchId: string,
  into: Species,
): Promise<Species | null> {
  return runTransaction(getFirebaseFirestore(), async (transaction) => {
    const caughtRef = getCaughtRef(catchId);
    const caught = (await transaction.get(caughtRef)).data();

    if (caught == null || caught.owner !== uid) {
      return null;
    }

    const evolution = (getSpeciesData(caught.species).evolvesInto ?? []).find(
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
      stock = (await transaction.get(getInventoryEntryRef(uid, consumed))).data()?.amount ?? 0;

      if (stock > 0) {
        carried.add(consumed);
      }
    }

    const context = {
      level: caught.level,
      carried,
      // The catch carries what it holds, so the criteria read the
      // same document the species change is written back to
      held: new Set(caught.items),
    };

    if (!getAvailableEvolutions(caught.species, context).some((entry) => entry.species === into)) {
      return null;
    }

    if (consumed != null) {
      transaction.set(getInventoryEntryRef(uid, consumed), {
        user: uid,
        item: consumed,
        amount: stock - 1,
      });
    }
    transaction.set(caughtRef, { ...caught, species: into });
    return into;
  });
}
