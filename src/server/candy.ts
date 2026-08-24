import 'server-only';
import { CANDY_STACKS, ITEM_STACKS } from '../auth/stacks';
import getCandyCost, { SPECIES_DAY_CANDY_BOOST, getCatchCandy } from '../auth/candy-rules';
import { type CaughtPokemon, asCaughtPokemon } from '../auth/caught-record';
import { Items } from '../data/ids/items';
import { friendshipFactor, gainFriendship } from '../data/constants/friendship';
import { getMaxHealth } from '../auth/health';
import { MAX_LEVEL } from '../data/constants/levels';
import type Families from '../data/ids/families';
import type { Species } from '../data/ids/species';
import { getSpeciesData, isFeaturedSpecies } from '../data/species';
import { isEggRecord, isGuardedRecord } from './catch-fields';
import { readCaughtIn, updateCaughtIn } from './caught-io';
import { type Tx, tx } from './db';
import { isCatchLocked } from './locks';
import { asNumber } from './read';
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
 * Reward a catch with its family's candy. What it pays is what the
 * species is worth meeting — one for a base stage, five for a
 * legendary — and catching on the family's own day pays four times
 * that again; the timestamp comes from the server clock, so the day
 * cannot be chosen by the caller
 */
export async function grantCatchCandy(
  uid: string,
  species: Species,
  timestamp: number,
): Promise<number> {
  const { family } = getSpeciesData(species);
  const earned = getCatchCandy(species);
  const count = isFeaturedSpecies(species, timestamp) ? earned * SPECIES_DAY_CANDY_BOOST : earned;

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
  return feed(uid, catchId, async (transaction, caught, record) => {
    const { family } = getSpeciesData(asSpecies(caught.species));
    const held = await readStackIn(transaction, CANDY_STACKS, uid, family);

    return spendStackIn(transaction, CANDY_STACKS, uid, family, held, getCandyCost(record));
  });
}

/**
 * A Rare Candy is the universal one: the same level, paid with a
 * single item out of the bag instead of the family's stack, so what
 * a family's candy costs never enters into it.
 *
 * Resolves the new level, or null when the feeding is refused for the
 * same reasons a family candy is, or the bag holds none
 */
export async function useRareCandy(uid: string, catchId: string): Promise<number | null> {
  return feed(uid, catchId, async (transaction) => {
    const held = await readStackIn(transaction, ITEM_STACKS, uid, Items.RareCandy);

    return spendStackIn(transaction, ITEM_STACKS, uid, Items.RareCandy, held, 1);
  });
}

/**
 * The feeding both candies share: the same refusals, the same level,
 * the same transaction. `pay` is the only difference (which stack
 * covers it), and a payment that fails leaves everything unwritten
 */
async function feed(
  uid: string,
  catchId: string,
  pay: (
    transaction: Tx,
    caught: Record<string, unknown>,
    record: CaughtPokemon,
  ) => Promise<boolean>,
): Promise<number | null> {
  return tx(async (transaction) => {
    const caught = await readCaughtIn(transaction, catchId);

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

    // The candy and the level land together or not at all: a candy
    // spent without the level is the failure this transaction exists
    // to prevent
    if (!(await pay(transaction, caught, record))) {
      return null;
    }

    const level = record.level + 1;
    await updateCaughtIn(transaction, catchId, {
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
