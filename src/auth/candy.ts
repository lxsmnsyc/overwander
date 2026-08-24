// Rows arrive untyped; the converter below restores const-enum fields
// via assertions that tsc requires but tsgolint (resolving const enums
// to number) considers unnecessary
// oxlint-disable typescript/no-unnecessary-type-assertion
import type Families from '../data/ids/families';
import { asNumber, asRecordArray } from './__normalize';
import { CANDY_STACKS, getStack, listStacks } from './stacks';
import { useCandy as feedOnServer, useRareCandy as rareOnServer } from '../server/candy';
import { requireUid } from '../server/auth';
import getSupabase from './supabase';
import getIdToken from './session';

export {
  CANDY_BY_RARITY,
  CANDY_PER_LEVEL,
  SHADOW_CANDY_MULTIPLIER,
  SPECIES_DAY_CANDY_BOOST,
  getCatchCandy,
} from './candy-rules';
export { default as getCandyCost } from './candy-rules';

/**
 * One family's candy stack, a row in `bag_candies`. A candy feeds any
 * catch of its family, so the stack is keyed by family rather than by
 * species
 */
export interface CandyStack {
  /**
   * The owning uid
   */
  user: string;
  /**
   * The evolution family the candy feeds
   */
  family: Families;
  /**
   * How many are held; never goes below zero
   */
  count: number;
}

/**
 * Every candy stack the player holds, in the shape `stacks.ts` reads
 */
async function readBag(uid: string): Promise<unknown> {
  const { data } = await getSupabase()
    .from('bag_candies')
    .select('family, count')
    .eq('player', uid);

  return {
    candies: Object.fromEntries(
      asRecordArray(data).map((row) => [asNumber(row.family), asNumber(row.count)]),
    ),
  };
}

/**
 * Every candy stack the user holds
 */
export async function getCandies(uid: string): Promise<CandyStack[]> {
  return listStacks(await readBag(uid), CANDY_STACKS).map(([family, count]) => ({
    user: uid,
    // oxlint-disable-next-line typescript/no-unnecessary-type-assertion
    family: family as Families,
    count,
  }));
}

/**
 * How many candies of one family the user holds
 */
export async function getCandyCount(uid: string, family: Families): Promise<number> {
  return getStack(await readBag(uid), CANDY_STACKS, family);
}

/**
 * Candy is paid out by the server, alongside the catch that earned it
 * — see [`src/server/candy.ts`](../server/candy.ts). A client that
 * could write these stacks could write itself levels
 */

/**
 * Spend candies to raise a catch of the same family by a level — one
 * for an ordinary catch, two for a shadow. The server does the
 * spending: the candy and the level move together in one
 * transaction, so a candy can never be spent without the level
 * landing, and the caller is whoever their token says. Resolves the
 * new level, or null when the feeding is refused: the catch is not
 * theirs, the stack cannot cover the cost, or the catch already sits
 * at MAX_LEVEL
 */
export async function useCandy(catchId: string): Promise<number | null> {
  return feedCandyOnServer(await getIdToken(), catchId);
}

async function feedCandyOnServer(token: string, catchId: string): Promise<number | null> {
  'use server';
  return feedOnServer(await requireUid(token), catchId);
}

/**
 * Spend one Rare Candy from the bag for the same level, whatever the
 * catch's family. Resolves the new level, or null when the feeding is
 * refused or the bag holds none
 */
export async function useRareCandy(catchId: string): Promise<number | null> {
  return feedRareOnServer(await getIdToken(), catchId);
}

async function feedRareOnServer(token: string, catchId: string): Promise<number | null> {
  'use server';
  return rareOnServer(await requireUid(token), catchId);
}
