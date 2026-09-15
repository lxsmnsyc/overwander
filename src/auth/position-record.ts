import { CHUNK_CELLS } from '../overworld/chunk';
import { Depth, WORLD_MAX, WORLD_MIN } from '../overworld/world';
import { asNumber, asRecord, asString } from './__normalize';

/**
 * Where a player is standing.
 *
 * Everything else the overworld holds comes out of a seed and a
 * window: the same chunk for everybody, derived rather than stored.
 * This is the exception, and it is stored for one reason — a player
 * who walked forty chunks, or spent a Portal Key to cross the world,
 * should not be put back at their starting point by a page reload.
 *
 * It is the client's word. The server clamps it to somewhere that
 * exists and stamps when it arrived, but it does not check the walk:
 * positions are saved every few seconds rather than every step, so
 * there is no path to check, and nothing in the game trusts a
 * position anyway. Reaching a landmark is checked against the
 * landmark, never against how far away the caller claimed to be — see
 * [Reaching, not treading](../../docs/database/overworld.md)
 */
export interface PositionRecord {
  player: string;
  chunkX: number;
  chunkY: number;
  /**
   * The cell within the chunk, as a column and a row
   */
  cellX: number;
  cellY: number;
  /**
   * Which layer they are on. The caves are the same coordinates one
   * layer down, so a cell alone no longer says where somebody is
   */
  depth: Depth;
  /**
   * When it was last written, on the server's clock
   */
  movedAt: number;
}

/**
 * A layer that exists, whatever arrived. Anything that is not the
 * caves is the surface, which is where every row written before there
 * were caves belongs
 */
export function asDepth(value: unknown): Depth {
  // tsc needs the widening to compare a number against a const enum;
  // tsgolint resolves the enum to number and calls it redundant
  // oxlint-disable-next-line typescript/no-unnecessary-type-assertion
  return asNumber(value) === (Depth.Cave as number) ? Depth.Cave : Depth.Surface;
}

/**
 * A coordinate brought inside the world, whatever arrived
 */
export function asChunkCoordinate(value: unknown): number {
  return Math.min(WORLD_MAX, Math.max(WORLD_MIN, Math.trunc(asNumber(value))));
}

/**
 * A cell brought inside the chunk
 */
export function asCellCoordinate(value: unknown): number {
  return Math.min(CHUNK_CELLS - 1, Math.max(0, Math.trunc(asNumber(value))));
}

/**
 * Restore a position from an untyped row; the client and
 * the privileged server read through the same normalizer, so a
 * hand-written row cannot put anybody outside the world
 */
export function asPositionRecord(value: unknown): PositionRecord {
  const data = asRecord(value);

  return {
    player: asString(data.player),
    chunkX: asChunkCoordinate(data.chunkX),
    chunkY: asChunkCoordinate(data.chunkY),
    cellX: asCellCoordinate(data.cellX),
    cellY: asCellCoordinate(data.cellY),
    depth: asDepth(data.depth),
    movedAt: asNumber(data.movedAt),
  };
}
