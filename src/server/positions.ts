import 'server-only';
import { POSITION_COLLECTION } from '../auth/collections';
import { asCellCoordinate, asChunkCoordinate } from '../auth/position-record';
import { getAdminFirestore } from './firebase';

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
