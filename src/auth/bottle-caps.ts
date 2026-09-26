import type { Stats } from '../data/constants/stats';
import type { Items } from '../data/ids/items';
import useBottleCapOnServerSide from '../server/bottle-caps';
import { requireUid } from '../server/auth';
import check, { GAME_ID, ID, MAYBE_STAT, TOKEN } from '../server/validate';
import getIdToken from './session';

/**
 * Spending a bottle cap on a pokemon.
 *
 * A cap is the one item that changes what a catch already is, so
 * whether it is spent at all is decided by the server against the
 * stored record. The dialog says which cap, on which pokemon, and for
 * a plain cap which stat; see
 * [`src/data/items/bottle-caps.ts`](../data/items/bottle-caps.ts) for
 * the rules both sides read.
 */

/**
 * Use a bottle cap from the bag on one of the player's catches, on
 * `stat` for a plain cap. A golden cap takes no stat.
 *
 * Resolves the individual values the catch now has, or null when the
 * cap could not be used: the catch is not the player's, it is
 * fighting, it is still an egg, none of that cap is carried, or the
 * stat is already perfect
 */
export default async function useBottleCap(
  catchId: string,
  item: Items,
  stat: Stats | null = null,
): Promise<number | null> {
  return useBottleCapOnStatServer(await getIdToken(), catchId, item, stat);
}

/**
 * Retired: a tab from before a plain cap asked for a stat still calls
 * this slot, and its cap goes on the weakest stat
 */
export async function useBottleCapOnServer(
  token: string,
  catchId: string,
  item: Items,
): Promise<number | null> {
  'use server';
  check(TOKEN, token);
  check(ID, catchId);
  check(GAME_ID, item);
  return useBottleCapOnServerSide(await requireUid(token), catchId, item, null);
}

async function useBottleCapOnStatServer(
  token: string,
  catchId: string,
  item: Items,
  stat: Stats | null,
): Promise<number | null> {
  'use server';
  check(TOKEN, token);
  check(ID, catchId);
  check(GAME_ID, item);
  check(MAYBE_STAT, stat);
  return useBottleCapOnServerSide(await requireUid(token), catchId, item, stat);
}
