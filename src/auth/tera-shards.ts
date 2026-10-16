import type { Types } from '../data/constants/types';
import type { Items } from '../data/ids/items';
import useTeraShardsOnServerSide from '../server/tera-shards';
import { requireUid } from '../server/auth';
import check, { GAME_ID, ID, TOKEN } from '../server/validate';
import getIdToken from './session';

/**
 * Spending Tera Shards on a pokemon. How many it takes and whether the
 * type would change is decided by the server against the stored
 * record; the dialog says which shard and which pokemon.
 */

/**
 * Spend `TERA_SHARD_COST` shards of one type from the bag on one of
 * the player's catches.
 *
 * Resolves its new Tera type, or null when refused: see `useTeraShards`
 * in `src/server/tera-shards.ts`
 */
export default async function useTeraShards(catchId: string, item: Items): Promise<Types | null> {
  return useTeraShardsOnServer(await getIdToken(), catchId, item);
}

async function useTeraShardsOnServer(
  token: string,
  catchId: string,
  item: Items,
): Promise<Types | null> {
  'use server';
  check(TOKEN, token);
  check(ID, catchId);
  check(GAME_ID, item);
  return useTeraShardsOnServerSide(await requireUid(token), catchId, item);
}
