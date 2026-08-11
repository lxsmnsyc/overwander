import 'server-only';
import { CANDY_COLLECTION, CAUGHT_COLLECTION, candyStackId } from '../auth/collections';
import getCandyCost, { CANDY_PER_CATCH, SPECIES_DAY_CANDY_BOOST } from '../auth/candy-rules';
import { asCaughtPokemon } from '../auth/caught-record';
import { getMaxHealth } from '../auth/health';
import { MAX_LEVEL } from '../data/constants/levels';
import type Families from '../data/ids/families';
import type { Species } from '../data/ids/species';
import { getSpeciesData, isFeaturedSpecies } from '../data/species';
import { isEggRecord } from './catch-fields';
import { getAdminFirestore } from './firebase';
import { isCatchLocked } from './locks';
import { asNumber, docData } from './read';

/**
 * A stored species id, restored the same way the client's converters
 * restore one
 */
// oxlint-disable-next-line typescript/no-unnecessary-type-assertion
const asSpecies = (value: unknown): Species => asNumber(value) as Species;

/**
 * Candy, written with admin credentials. A candy is what a level
 * costs, so minting one is minting levels: the client asks for a
 * feeding and the server decides whether it happened
 */

function getStackRef(uid: string, family: Families): FirebaseFirestore.DocumentReference {
  return getAdminFirestore().collection(CANDY_COLLECTION).doc(candyStackId(uid, family));
}

/**
 * Add candies to a family's stack, creating it on first acquisition
 */
export async function grantCandy(uid: string, family: Families, count = 1): Promise<void> {
  const db = getAdminFirestore();

  await db.runTransaction(async (transaction) => {
    const ref = getStackRef(uid, family);
    const current = asNumber(docData(await transaction.get(ref))?.count);

    transaction.set(ref, { user: uid, family, count: current + count });
  });
}

/**
 * Reward a catch with its family's candy. Catching on the family's
 * own day pays four times as much — the timestamp comes from the
 * server clock, so the day cannot be chosen by the caller
 */
export async function grantCatchCandy(
  uid: string,
  species: Species,
  timestamp: number,
): Promise<number> {
  const { family } = getSpeciesData(species);
  const count = isFeaturedSpecies(species, timestamp)
    ? CANDY_PER_CATCH * SPECIES_DAY_CANDY_BOOST
    : CANDY_PER_CATCH;

  await grantCandy(uid, family, count);
  return count;
}

/**
 * Spend candies to raise a catch of the same family by a level. The
 * candy and the level move in one transaction, so a candy can never
 * be spent without the level landing.
 *
 * Growing is also mending: the level comes with full health and a
 * clean slate, which is what a candy is for beyond the number. It is
 * the slow way to put a party right — a berry is the quick one — and
 * it is the only thing that lifts a fainted pokemon without an item.
 *
 * Resolves the new level, or null when the feeding is refused: the
 * catch is not the player's, the stack cannot cover the cost, or the
 * catch already sits at MAX_LEVEL
 */
export async function useCandy(uid: string, catchId: string): Promise<number | null> {
  const db = getAdminFirestore();

  return db.runTransaction(async (transaction) => {
    const caughtRef = db.collection(CAUGHT_COLLECTION).doc(catchId);
    const caught = docData(await transaction.get(caughtRef));

    if (
      caught == null ||
      caught.owner !== uid ||
      asNumber(caught.level) >= MAX_LEVEL ||
      // An egg is level 1 until it hatches, and there is nothing in
      // there yet to feed
      isEggRecord(caught) ||
      // A pokemon in a live battle fights at the level its snapshot
      // froze; raising it now would only disagree with the fight
      isCatchLocked(caught)
    ) {
      return null;
    }

    const { family } = getSpeciesData(asSpecies(caught.species));
    const stackRef = getStackRef(uid, family);
    const count = asNumber(docData(await transaction.get(stackRef))?.count);
    const cost = getCandyCost({ flags: asNumber(caught.flags) });

    if (count < cost) {
      return null;
    }

    const record = asCaughtPokemon(caught);
    const level = record.level + 1;

    transaction.set(stackRef, { user: uid, family, count: count - cost });
    transaction.update(caughtRef, {
      level,
      // A level restores what the last fight took, status and all
      health: getMaxHealth({ ...record, level }),
      statuses: 0,
    });
    return level;
  });
}
