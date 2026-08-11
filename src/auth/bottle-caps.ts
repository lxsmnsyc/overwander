import type { Stats } from '../data/constants/stats';
import type { Items } from '../data/ids/items';
import useBottleCapOnServerSide from '../server/bottle-caps';
import { requireUid } from '../server/firebase';
import { syncServerClock } from './clock';
import getIdToken from './session';

/**
 * Spending a bottle cap on a pokemon.
 *
 * A cap is the one item that changes what a catch already is, so the
 * whole of it — which stats it raises, whether it is spent at all —
 * is decided by the server against the stored record. The dialog only
 * says which cap is being used, and on which pokemon; see
 * [`src/data/items/bottle-caps.ts`](../data/items/bottle-caps.ts) for
 * the rules both sides read.
 */

/**
 * Use a bottle cap from the bag on one of the player's catches.
 *
 * Resolves the individual values the catch now has, or null when the
 * cap could not be used: the catch is not the player's, it is
 * fighting, it is still an egg, none of that cap is carried, or the
 * pokemon is already perfect
 */
export default async function useBottleCap(
  catchId: string,
  item: Items,
): Promise<Record<Stats, number> | null> {
  return useBottleCapOnServer(await getIdToken(), catchId, item);
}

async function useBottleCapOnServer(
  token: string,
  catchId: string,
  item: Items,
): Promise<Record<Stats, number> | null> {
  'use server';
  return useBottleCapOnServerSide(await requireUid(token), catchId, item, await syncServerClock());
}
