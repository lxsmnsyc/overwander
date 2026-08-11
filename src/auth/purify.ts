import type { Items } from '../data/ids/items';
import { requireUid } from '../server/firebase';
import usePurifyingGemOnServerSide from '../server/purify';
import getIdToken from './session';

/**
 * Spending a Purifying Gem on a shadow.
 *
 * The gem is the one item that takes a shadow off a pokemon: the
 * Shadow ability becomes the cosmetic `Purified`, the doubled candy
 * cost drops back to what everything else pays, and every value it was
 * born with goes up by two. The server decides all of it against the
 * stored record; see
 * [`src/data/items/purifying-gem.ts`](../data/items/purifying-gem.ts)
 * for the rules both sides read.
 */

/**
 * Use a Purifying Gem from the bag on one of the player's shadows.
 *
 * Resolves the individual values the catch now has, or null when the
 * gem could not be used: the catch is not the player's, it is
 * fighting, it is still an egg, none of the item is carried, or the
 * pokemon was never a shadow
 */
export default async function usePurifyingGem(
  catchId: string,
  item: Items,
): Promise<number | null> {
  return purifyOnServer(await getIdToken(), catchId, item);
}

async function purifyOnServer(token: string, catchId: string, item: Items): Promise<number | null> {
  'use server';
  return usePurifyingGemOnServerSide(await requireUid(token), catchId, item);
}
