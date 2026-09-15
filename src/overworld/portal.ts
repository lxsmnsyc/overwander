import type Biome from '../data/ids/biome';
import type Chunk from './chunk';
import { CHUNK_CELLS, cellInChunk, chunkOfCell } from './grid';
import { portalCellIn, portalSpot, townName, townOfRegion } from './town';
import type World from './world';

/**
 * Where a portal goes.
 *
 * A portal is not a teleport: it opens onto **another portal**, and
 * the traveller names the town they want. Towns are the only places
 * in the world with names of their own, which is what makes the
 * network something players can talk about: a name told to somebody
 * is a place they can now reach, once somebody has been there.
 *
 * Where a named town's portal stands is a pure function of the
 * region, so both sides work it out rather than one telling the
 * other. A client that lied about its destination would be asking to
 * be sent somewhere the server derives differently, and gets sent
 * where the derivation says.
 *
 * All of it is derived from the seed alone, the name included, so
 * none of this touches a store, a window or a clock. What the store
 * holds is only **which towns anybody has walked into**, since that
 * is the one thing about a town no derivation can answer.
 *
 * A region with no town still has a portal, out in the country. It is
 * somewhere to leave from and nowhere to arrive at: nothing names it.
 */

/** One end of a crossing */
export interface PortalDestination {
  /** The chunk it stands in */
  x: number;
  y: number;
  /**
   * The cell the portal stands on, which is where the traveller
   * arrives: they come out of a portal, not beside one
   */
  cell: number;
  biome: Biome;
  /** The town it stands in the middle of, as the store named it */
  name: string;
}

/**
 * The cell a chunk's portal stands on, or null when it has none.
 * A chunk with two would be two ways to the same place, so the first
 * is the one that counts
 */
export function getPortalCell(chunk: Chunk): number | null {
  // Asked of the region rather than of the chunk's landmarks: every
  // region has exactly one portal, and a landmark roll is not free
  return portalCellIn(chunk.world, chunk.x, chunk.y);
}

/**
 * Where a crossing to this region comes out, or null when the region
 * has no town and so nothing anybody could have named
 */
export function portalInRegion(
  world: World,
  regionX: number,
  regionY: number,
): PortalDestination | null {
  const town = townOfRegion(world, regionX, regionY);

  if (town == null) {
    return null;
  }

  const [x, y] = portalSpot(world, regionX, regionY);
  const chunkX = chunkOfCell(x);
  const chunkY = chunkOfCell(y);

  return {
    x: chunkX,
    y: chunkY,
    cell: cellInChunk(y) * CHUNK_CELLS + cellInChunk(x),
    biome: town.biome,
    name: townName(town),
  };
}
