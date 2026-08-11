import 'server-only';
import { asBoolean } from '../auth/__normalize';
import { asCaughtPokemon, isAuctionableCatch } from '../auth/caught-record';
import { CAUGHT_COLLECTION } from '../auth/collections';
import { ITEM_STACKS } from '../auth/stacks';
import { getMaxHealth, rescaleHealth } from '../auth/health';
import type { Items } from '../data/ids/items';
import {
  isPurifiable,
  isPurifyingGem,
  purifyAbilities,
  purifyIVs,
} from '../data/items/purifying-gem';
import { isEggRecord, isGuardedRecord } from './catch-fields';
import { getAdminFirestore } from './firebase';
import { readStackIn, writeStackIn } from './stacks';
import { isCatchLocked } from './locks';
import { type UpdateFields, asNumber, docData } from './read';

/**
 * Purifying, written with admin credentials.
 *
 * What a shadow costs to raise is read off its `shadow` field, and
 * what it is is read off its abilities, so putting one right rewrites
 * both — and the values it was born with, which nothing else but a
 * bottle cap touches. All of it lands in one transaction with the gem
 * leaving the bag, so a pokemon is never half-purified and a gem is
 * never spent on nothing.
 *
 * The rules both sides read live in
 * [`src/data/items/purifying-gem.ts`](../data/items/purifying-gem.ts)
 */

/**
 * What a purified record becomes. It is the whole of the change, in
 * one place, because the nurse applies it to a party the same way the
 * gem applies it to one pokemon
 */
export function purifiedFields(caught: Record<string, unknown>): UpdateFields {
  const record = asCaughtPokemon(caught);
  const ivs = purifyIVs(record.ivs);

  return {
    ivs,
    // Purifying lifts every value by two, so it is the other way a
    // pokemon becomes perfect long after it was caught
    auctionable: isAuctionableCatch({ ...record, ivs }),
    // The shadow comes off, which is what puts the candy cost back
    // down: nothing else reads it
    shadow: false,
    abilities: purifyAbilities(record.abilities),
    // Better values mean a bigger pool, and the share of it the
    // pokemon was carrying is what it keeps
    health: rescaleHealth(record.health, getMaxHealth(record), getMaxHealth({ ...record, ivs })),
  };
}

/**
 * Whether a stored record is a shadow the gem can still do something
 * for, and the player's to spend one on
 */
export function isPurifiableRecord(caught: Record<string, unknown>, uid: string): boolean {
  if (caught.owner !== uid || isCatchLocked(caught) || isGuardedRecord(caught)) {
    return false;
  }
  // An egg is not a pokemon yet; whatever is inside it was decided
  // when it was found, and it keeps until it hatches
  return !isEggRecord(caught) && isPurifiable({ shadow: asBoolean(caught.shadow) });
}

/**
 * Spend a Purifying Gem on one of the player's shadows.
 *
 * Resolves the values the catch now has, or null when the use is
 * refused: the catch is not the player's, it is fighting, it is still
 * an egg, the item is not a gem, none is carried, or the pokemon is
 * not a shadow in the first place
 */
export default async function usePurifyingGem(
  uid: string,
  catchId: string,
  item: Items,
): Promise<number | null> {
  if (!isPurifyingGem(item)) {
    return null;
  }

  const db = getAdminFirestore();

  return db.runTransaction(async (transaction) => {
    const caughtRef = db.collection(CAUGHT_COLLECTION).doc(catchId);
    const caught = docData(await transaction.get(caughtRef));

    if (caught == null || !isPurifiableRecord(caught, uid)) {
      return null;
    }

    const stock = await readStackIn(transaction, ITEM_STACKS, uid, item);

    if (stock < 1) {
      return null;
    }

    const purified = purifiedFields(caught);

    writeStackIn(transaction, ITEM_STACKS, uid, item, stock - 1);
    transaction.update(caughtRef, purified);
    return asNumber(purified.ivs);
  });
}
