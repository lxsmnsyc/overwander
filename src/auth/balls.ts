import type { Balls, Items } from '../data/ids/items';
import useBallOnServerSide from '../server/balls';
import { requireUid } from '../server/auth';
import check, { GAME_ID, ID, TOKEN } from '../server/validate';
import getIdToken from './session';

/**
 * Putting one of the player's pokemon in a different ball.
 *
 * The bag decides nothing here: which ball a record ends up in, and
 * whether one is spent at all, is settled by the server against the
 * stored catch. See [`src/server/balls.ts`](../server/balls.ts).
 */

/**
 * Spend a ball from the bag on one of the player's catches, replacing
 * the ball it is in. Resolves the ball it now sits in, or null where
 * the swap was refused
 */
export default async function useBall(catchId: string, item: Items): Promise<Balls | null> {
  return useBallOnServer(await getIdToken(), catchId, item);
}

async function useBallOnServer(token: string, catchId: string, item: Items): Promise<Balls | null> {
  'use server';
  check(TOKEN, token);
  check(ID, catchId);
  check(GAME_ID, item);
  return useBallOnServerSide(await requireUid(token), catchId, item);
}
