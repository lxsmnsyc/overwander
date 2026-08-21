import type { Items } from '../data/ids/items';
import type { Moves } from '../data/ids/moves';
import { requireUid } from '../server/auth';
import teachOnServerSide, { learnLevelUpMove as learnOnServerSide } from '../server/moves';
import getIdToken from './session';

/**
 * Learning a move, as the client asks for it.
 *
 * None of it is the client's to decide: which move a machine teaches,
 * whether the species can learn it, which move a level actually offers
 * and whether the price is carried are all worked out again on the
 * server from the stored record.
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

/**
 * Learn a move the pokemon has just grown into — one its species
 * learns at exactly the level it now sits at. Nothing is charged: the
 * candy that bought the level paid for it.
 *
 * The offer is the level the pokemon is standing on and no other, so
 * this cannot reach back for an older move — that is the Move
 * Reminder's trade, and it costs a Heart Scale.
 *
 * Resolves the move list as it now stands, or null when it is refused
 */
export async function learnLevelUpMove(
  catchId: string,
  move: Moves,
  replaces = 0,
): Promise<Moves[] | null> {
  return learnOnServer(await getIdToken(), catchId, move, replaces);
}

async function learnOnServer(
  token: string,
  catchId: string,
  move: Moves,
  replaces: number,
): Promise<Moves[] | null> {
  'use server';
  return learnOnServerSide(await requireUid(token), catchId, move, replaces);
}
