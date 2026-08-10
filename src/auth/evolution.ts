import type { Species } from '../data/ids/species';
import { getAvailableEvolutions } from '../data/species';
import type { EvolutionData } from '../data/species';
import evolveOnServerSide from '../server/evolution';
import { requireUid } from '../server/firebase';
import { getCaught } from './caught';
import { getInventory } from './inventory';
import getIdToken from './session';

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
 * again by the server against the stored documents, and an evolution
 * that uses an item spends it in the same transaction, so the stone
 * and the new species land together or not at all.
 *
 * Resolves the new species, or null when the evolution is refused:
 * the catch is not the caller's, the species is not one of its
 * evolutions, a condition is unmet, or the required item is gone
 */
export async function evolveCatch(catchId: string, into: Species): Promise<Species | null> {
  return evolveOnServer(await getIdToken(), catchId, into);
}

async function evolveOnServer(
  token: string,
  catchId: string,
  into: Species,
): Promise<Species | null> {
  'use server';
  return evolveOnServerSide(await requireUid(token), catchId, into);
}
