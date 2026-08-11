import 'server-only';
import { CAUGHT_COLLECTION } from '../auth/collections';
import { CANDY_STACKS } from '../auth/stacks';
import getCandyCost, { CANDY_PER_CATCH, SPECIES_DAY_CANDY_BOOST } from '../auth/candy-rules';
import { asCaughtPokemon } from '../auth/caught-record';
import { friendshipFactor, gainFriendship } from '../data/constants/friendship';
import { getMaxHealth } from '../auth/health';
import { MAX_LEVEL } from '../data/constants/levels';
import type Families from '../data/ids/families';
import type { Species } from '../data/ids/species';
import { getSpeciesData, isFeaturedSpecies } from '../data/species';
import { isEggRecord, isGuardedRecord } from './catch-fields';
import { getAdminFirestore } from './firebase';
import { isCatchLocked } from './locks';
import { asNumber, docData } from './read';
import { grantStack, readStackIn, spendStackIn } from './stacks';

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

/**
 * Add candies to a family's stack, creating it on first acquisition
 */
export async function grantCandy(uid: string, family: Families, count = 1): Promise<void> {
  return grantStack(CANDY_STACKS, uid, family, count);
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
      isCatchLocked(caught) ||
      // And a locked one is being kept as it is: a level is the
      // largest change there is to make to a pokemon
      isGuardedRecord(caught)
    ) {
      return null;
    }

    const record = asCaughtPokemon(caught);
    const { family } = getSpeciesData(asSpecies(caught.species));
    const held = await readStackIn(transaction, CANDY_STACKS, uid, family);
    const cost = getCandyCost(record);

    // The candy and the level land together or not at all: a candy
    // spent without the level is the failure this transaction exists
    // to prevent
    if (!spendStackIn(transaction, CANDY_STACKS, uid, family, held, cost)) {
      return null;
    }

    const level = record.level + 1;
    transaction.update(caughtRef, {
      level,
      // A level restores what the last fight took, status and all
      health: getMaxHealth({ ...record, level }),
      statuses: 0,
      // Growing up together is the surest way a pokemon comes to
      // think well of somebody — and the level pays for five more
      // points of effort, which the sheet works out from the level
      // itself rather than storing twice
      friendship: gainFriendship(record.friendship, 'level', 1, friendshipFactor(record.ball)),
    });
    return level;
  });
}
