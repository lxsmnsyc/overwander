// Rows arrive untyped; the converter below restores const-enum fields
// via assertions that tsc requires but tsgolint (resolving const enums
// to number) considers unnecessary
// oxlint-disable typescript/no-unnecessary-type-assertion
import type Families from '../data/ids/families';
import { asNumber, asRecordArray } from './__normalize';
import { CANDY_STACKS, listStacks } from './stacks';
import { useCandy as feedOnServer, useRareCandy as rareOnServer } from '../server/candy';
import { requireUid } from '../server/auth';
import check, { COUNT, ID, TOKEN } from '../server/validate';
import getSupabase from './supabase';
import getIdToken from './session';

export {
  CANDY_BY_RARITY,
  CANDY_PER_LEVEL,
  SHADOW_CANDY_MULTIPLIER,
  SPECIES_DAY_CANDY_BOOST,
  getCatchCandy,
  getReleaseCandy,
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

/** What a player is told when their candies cannot be read, in place of the store's own message */
export const CANDIES_UNREADABLE = 'Could not read your candies just now.';

/**
 * Every candy stack the player holds, in the shape `stacks.ts` reads.
 * A refused read is raised rather than answered as no candy at all
 */
async function readBag(uid: string): Promise<unknown> {
  const { data, error } = await getSupabase()
    .from('bag_candies')
    .select('family, count')
    .eq('player', uid);

  if (error != null) {
    throw new Error(CANDIES_UNREADABLE);
  }

  const candies: Record<number, number> = {};

  for (const row of asRecordArray(data)) {
    candies[asNumber(row.family)] = asNumber(row.count);
  }
  return { candies };
}

/**
 * Every candy stack the user holds
 */
export async function getCandies(uid: string): Promise<CandyStack[]> {
  const stacks: CandyStack[] = [];

  for (const [family, count] of listStacks(await readBag(uid), CANDY_STACKS)) {
    stacks.push({
      user: uid,
      // oxlint-disable-next-line typescript/no-unnecessary-type-assertion
      family: family as Families,
      count,
    });
  }
  return stacks;
}

/**
 * How many candies of one family the user holds. One row asked for,
 * not every family's
 */
export async function getCandyCount(uid: string, family: Families): Promise<number> {
  const { data, error } = await getSupabase()
    .from('bag_candies')
    .select('count')
    .eq('player', uid)
    .eq('family', family)
    .maybeSingle();

  if (error != null) {
    throw new Error(CANDIES_UNREADABLE);
  }

  return asNumber((data as { count?: unknown } | null)?.count);
}

/**
 * Candy is paid out by the server, alongside the catch that earned it
 * — see [`src/server/candy.ts`](../server/candy.ts). A client that
 * could write these stacks could write itself levels
 */

/**
 * Spend candies to raise a catch of the same family — one candy a
 * level for an ordinary catch, two for a shadow, and as many levels
 * as are asked for. The server does the spending: the candy and the
 * levels move together in one transaction, so a candy can never be
 * spent without the level landing, and the caller is whoever their
 * token says.
 *
 * Resolves the level it reached, which is **not** always the one the
 * caller asked for: it grows as far as the pile stretches and stops
 * at the cap. Null when the feeding is refused outright: the catch is
 * not theirs, the pile cannot cover one level, or it already sits at
 * MAX_LEVEL
 */
export async function useCandy(catchId: string, levels = 1): Promise<number | null> {
  return feedCandyOnServer(await getIdToken(), catchId, levels);
}

async function feedCandyOnServer(
  token: string,
  catchId: string,
  levels: number,
): Promise<number | null> {
  'use server';
  check(TOKEN, token);
  check(ID, catchId);
  check(COUNT, levels);
  return feedOnServer(await requireUid(token), catchId, levels);
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
  check(TOKEN, token);
  check(ID, catchId);
  return rareOnServer(await requireUid(token), catchId);
}
