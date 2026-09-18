import 'server-only';
import { Moves } from '../data/ids/moves';
import type { PositionRecord } from '../auth/position-record';
import { CHUNK_CELLS } from '../overworld/chunk';
import getWorld from '../overworld/current';
import { Depth } from '../overworld/depth';
import { type FieldMove, canUseFieldMove } from '../overworld/field-moves';
import { portalInRegion } from '../overworld/portal';
import { nearestTown } from '../overworld/town';
import { isInWorld } from '../overworld/world';
import resolveBuddy from './buddy';
import { climbOut } from './escape-rope';
import savePosition, { readPosition } from './positions';

/**
 * The field moves that move a player somewhere, written with admin
 * credentials. Surf and Fly change only how the board walks, so they
 * have nothing to write.
 */

/** Whether this player's buddy can learn the move */
async function buddyCan(uid: string, move: FieldMove): Promise<boolean> {
  return canUseFieldMove((await resolveBuddy(uid))?.species, move);
}

/** Dig out of a cave to the nearest mouth, the way a rope does but for free */
export async function useDig(uid: string, now: number): Promise<PositionRecord | null> {
  return climbOut(uid, now, async () => buddyCan(uid, Moves.Dig));
}

/**
 * Arrive at the portal of the nearest town, found or not, from anywhere
 * above ground or below it. Null when the buddy cannot learn Teleport
 * or no town stands within reach
 */
export async function useTeleport(uid: string, now: number): Promise<PositionRecord | null> {
  const [at, able] = await Promise.all([readPosition(uid), buddyCan(uid, Moves.Teleport)]);

  if (at == null || !able) {
    return null;
  }

  const town = nearestTown(
    getWorld(),
    at.chunkX * CHUNK_CELLS + at.cellX,
    at.chunkY * CHUNK_CELLS + at.cellY,
  );
  const arrival = town == null ? null : portalInRegion(getWorld(), town.regionX, town.regionY);

  if (arrival == null || !isInWorld(arrival.x, arrival.y)) {
    return null;
  }

  const cellX = arrival.cell % CHUNK_CELLS;
  const cellY = Math.floor(arrival.cell / CHUNK_CELLS);
  const movedAt = await savePosition(uid, arrival.x, arrival.y, cellX, cellY, Depth.Surface, now);

  return {
    player: uid,
    chunkX: arrival.x,
    chunkY: arrival.y,
    cellX,
    cellY,
    depth: Depth.Surface,
    movedAt,
  };
}
