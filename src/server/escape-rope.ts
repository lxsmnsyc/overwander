import 'server-only';
import { Items } from '../data/ids/items';
import type { PositionRecord } from '../auth/position-record';
import { CHUNK_CELLS } from '../overworld/chunk';
import getWorld from '../overworld/current';
import { Depth } from '../overworld/depth';
import { nearestMouth } from '../overworld/cave';
import { consumeItem } from './inventory';
import savePosition, { readPosition } from './positions';

/**
 * Climbing out of a cave, written with admin credentials. The rope
 * leaves the bag on the server's word, and everything else is derived.
 * Unlike a portal it moves the player itself: the position is what the
 * rope is for.
 */

/**
 * Come up at the nearest mouth, or null where they are not
 * underground, nothing is in reach, or no rope is carried. Taken last,
 * so a player with no way out above them keeps theirs.
 *
 * Where they are is read from the register, which lags a walk by a
 * cell or two. The search is by chunk, so either side of a boundary
 * finds the same way up
 */
export default async function useEscapeRope(
  uid: string,
  now: number,
): Promise<PositionRecord | null> {
  const at = await readPosition(uid);

  // A rope is for the dark: above ground the walk home is the walk
  if (at == null || at.depth !== Depth.Cave) {
    return null;
  }

  const found = nearestMouth(getWorld(Depth.Cave), at.chunkX, at.chunkY);

  if (found == null) {
    return null;
  }
  if (!(await consumeItem(uid, Items.EscapeRope))) {
    return null;
  }

  const cellX = found.mouth.surface % CHUNK_CELLS;
  const cellY = Math.floor(found.mouth.surface / CHUNK_CELLS);
  const movedAt = await savePosition(
    uid,
    found.chunkX,
    found.chunkY,
    cellX,
    cellY,
    Depth.Surface,
    now,
  );

  return {
    player: uid,
    chunkX: found.chunkX,
    chunkY: found.chunkY,
    cellX,
    cellY,
    depth: Depth.Surface,
    movedAt,
  };
}
