import type { Species } from '../data/ids/species';
import { getSpeciesData, meetsEvolutionCriteria } from '../data/species';
import type { EvolutionData } from '../data/species';
import evolveOnServerSide from '../server/evolution';
import { requireUid } from '../server/auth';
import { getCaught } from './caught';
import { getInventory } from './inventory';
import getIdToken from './session';

/**
 * One of the shapes a pokemon could grow into, and whether it could do
 * it today
 */
export interface EvolutionOption {
  evolution: EvolutionData;
  /**
   * Whether every condition is met right now: the level reached, the
   * stone in the bag, the item in its hands
   */
  available: boolean;
}

/**
 * Every evolution the species has, with the ones it cannot take yet
 * left in.
 *
 * Offering only what is possible right now means a Charmander's sheet
 * says nothing at all about Charmeleon, so a player has no way to
 * learn what they are working towards except to reach it by accident.
 * The unmet ones are shown and refused instead, which is the same
 * answer with the reason attached.
 *
 * Resolves an empty list when the catch is not the user's
 */
export async function listEvolutionOptions(
  uid: string,
  catchId: string,
): Promise<EvolutionOption[]> {
  const [caught, inventory] = await Promise.all([getCaught(catchId), getInventory(uid)]);

  if (caught == null || caught.owner !== uid) {
    return [];
  }

  const context = {
    level: caught.level,
    carried: new Set(inventory.filter((entry) => entry.amount > 0).map((entry) => entry.item)),
    held: new Set(caught.items),
    traded: caught.traded,
  };

  return (getSpeciesData(caught.species).evolvesInto ?? []).map((evolution) => ({
    evolution,
    available: meetsEvolutionCriteria(evolution, context),
  }));
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
