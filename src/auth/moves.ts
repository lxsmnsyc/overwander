import type { Items } from '../data/ids/items';
import type { Moves } from '../data/ids/moves';
import { requireUid } from '../server/firebase';
import teachOnServerSide from '../server/moves';
import getIdToken from './session';

/**
 * Teaching a move, as the client asks for it.
 *
 * A machine is the only thing that changes what a pokemon knows after
 * it has been met, so none of it is the client's to decide: which move
 * the machine teaches, whether the species can learn it, and whether
 * the machine is carried are all worked out again on the server from
 * the stored record.
 */

/**
 * Use a technical machine on one of the player's catches. `replaces`
 * names which of the four the new move goes over and is ignored by a
 * pokemon that still has room for one.
 *
 * Resolves the move list as it now stands, or null when the teaching
 * is refused
 */
export default async function teachMove(
  catchId: string,
  item: Items,
  replaces = 0,
): Promise<Moves[] | null> {
  return teachOnServer(await getIdToken(), catchId, item, replaces);
}

async function teachOnServer(
  token: string,
  catchId: string,
  item: Items,
  replaces: number,
): Promise<Moves[] | null> {
  'use server';
  return teachOnServerSide(await requireUid(token), catchId, item, replaces);
}
