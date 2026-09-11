import type { Items } from '../data/ids/items';
import type Natures from '../data/ids/natures';
import useMintOnServerSide from '../server/mints';
import { requireUid } from '../server/auth';
import getIdToken from './session';

/**
 * Feeding a mint to a pokemon.
 *
 * A nature is the other half of what a catch was born with, so a mint
 * is decided by the server against the stored record the way a bottle
 * cap is. The dialog only says which mint and on which pokemon; see
 * [`src/data/items/mints.ts`](../data/items/mints.ts) for what each
 * one leaves behind.
 */

/**
 * Use a mint from the bag on one of the player's catches.
 *
 * Resolves the nature the catch now has, or null when the mint could
 * not be used: the catch is not the player's, it is fighting, it is
 * still an egg, none of that mint is carried, or the pokemon already
 * has that nature
 */
export default async function useMint(catchId: string, item: Items): Promise<Natures | null> {
  return useMintOnServer(await getIdToken(), catchId, item);
}

async function useMintOnServer(
  token: string,
  catchId: string,
  item: Items,
): Promise<Natures | null> {
  'use server';
  return useMintOnServerSide(await requireUid(token), catchId, item);
}
