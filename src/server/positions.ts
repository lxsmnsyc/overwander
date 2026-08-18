import 'server-only';
import { POSITION_COLLECTION } from '../auth/collections';
import {
  type PositionRecord,
  asCellCoordinate,
  asChunkCoordinate,
  asPositionRecord,
} from '../auth/position-record';
import { getAdminFirestore } from './firebase';
import { docData } from './read';

/**
 * Where a player is, written with admin credentials.
 *
 * It is written here rather than by the browser for the ordinary
 * reason: a client that could write this document could write anybody
 * else's. What it is *not* is checked — the position is the player's
 * own report of themselves, clamped to somewhere that exists.
 *
 * That is deliberate, and it does not weaken anything. Nothing in the
 * game trusts a position: reaching a landmark is checked against the
 * landmark and its window, a spawn against the store, a portal against
 * the chunk seed. A player who lies about where they are stands
 * somewhere they are not and finds exactly what is there
 */

/**
 * Remember where the player is standing. The write is a whole
 * document rather than a merge — there is nothing else in it — and it
 * is stamped so a later look can tell a stale record from a fresh one
 */
export default async function savePosition(
  uid: string,
  chunkX: number,
  chunkY: number,
  cellX: number,
  cellY: number,
  now: number,
): Promise<void> {
  await getAdminFirestore()
    .collection(POSITION_COLLECTION)
    .doc(uid)
    .set({
      player: uid,
      chunkX: asChunkCoordinate(chunkX),
      chunkY: asChunkCoordinate(chunkY),
      cellX: asCellCoordinate(cellX),
      cellY: asCellCoordinate(cellY),
      movedAt: now,
    });
}

/**
 * Where anybody is standing, or null for a player who has never
 * walked. It is read here rather than from a browser because the
 * rules let a player read only their own — which is the right rule
 * for a document a client could otherwise sweep the whole collection
 * of, and the wrong answer for the profile a lobby opens
 */
export async function readPosition(uid: string): Promise<PositionRecord | null> {
  const stored = docData(
    await getAdminFirestore().collection(POSITION_COLLECTION).doc(uid).get(),
  );

  return stored == null ? null : asPositionRecord(stored);
}
