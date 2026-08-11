import type Biome from '../data/ids/biome';
import { BIOME_CONFIGS } from '../data/ids/biome';
import Landmark from '../data/overworld/landmark';
import type Chunk from './chunk';
import type World from './world';
import { isInWorld } from './world';

/**
 * Where a portal goes.
 *
 * A portal is not a teleport: it opens onto **another portal**, and
 * the traveller names the biome rather than the place. The one they
 * arrive at is the nearest portal of that biome to the one they are
 * standing in — which is a pure function of the two of them, so both
 * sides work it out rather than one telling the other. A client that
 * lied about its destination would be asking to be sent somewhere the
 * server derives differently, and gets sent where the derivation says.
 *
 * Landmarks come out of the chunk seed alone, so none of this touches
 * a store, a window or a clock: the network exists as soon as the
 * world does, and it is the same network for everybody.
 */

/**
 * How far a portal reaches, in chunks. It is a long way — far past
 * what anybody would walk — but it is finite, so the search always
 * ends and a biome that is not within it simply is not on offer
 */
export const PORTAL_RANGE = 96;

/**
 * How many biomes the world actually grows. `Beyond` is not one of
 * them — nothing is generated there — so a search that has found this
 * many has found everything there is and can stop walking
 */
const BIOME_COUNT = Object.keys(BIOME_CONFIGS).length;

/**
 * One end of a crossing
 */
export interface PortalDestination {
  x: number;
  y: number;
  /**
   * The cell the portal stands on, which is where the traveller
   * arrives: they come out of a portal, not beside one
   */
  cell: number;
  biome: Biome;
  /**
   * How many chunks away it is, as a ring rather than as the crow
   * flies — the same measure the search walks outward in
   */
  distance: number;
}

/**
 * The cell a chunk's portal stands on, or null when it has none.
 * A chunk with two would be two ways to the same place, so the first
 * is the one that counts
 */
export function getPortalCell(chunk: Chunk): number | null {
  for (const [cell, landmark] of chunk.getLandmarkCells()) {
    if (landmark === Landmark.Portal) {
      return cell;
    }
  }
  return null;
}

/**
 * Every biome a portal here can reach, and where it comes out.
 *
 * One walk outward answers for all of them at once: the first portal
 * of a biome the search meets is the nearest one, and a biome already
 * answered for is not asked about again. Chunks are only rolled for
 * their landmarks where their biome is still wanted, which is what
 * keeps a search for something rare from paying for the common ground
 * it crosses.
 *
 * The chunk the traveller is standing in is not a destination — a
 * portal that came out where it went in would be a wasted key
 */
export function findPortals(
  world: World,
  fromX: number,
  fromY: number,
  range = PORTAL_RANGE,
): Map<Biome, PortalDestination> {
  const found = new Map<Biome, PortalDestination>();

  for (let radius = 1; radius <= range && found.size < BIOME_COUNT; radius++) {
    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        // The ring alone; everything inside it was walked already
        if (Math.max(Math.abs(dx), Math.abs(dy)) !== radius) {
          continue;
        }

        const x = fromX + dx;
        const y = fromY + dy;

        if (!isInWorld(x, y)) {
          continue;
        }

        const biome = world.getChunkBiome(x, y);

        // Already answered for, and the answer was nearer than this
        if (found.has(biome)) {
          continue;
        }

        const cell = getPortalCell(world.getChunk(x, y));

        if (cell != null) {
          found.set(biome, { x, y, cell, biome, distance: radius });
        }
      }
    }
  }
  return found;
}

/**
 * Where a portal here comes out for the biome named, or null when
 * nothing of that biome is in reach. It is the same walk `findPortals`
 * makes — the server checks a crossing by asking for it again rather
 * than by trusting what arrived
 */
export function findPortal(
  world: World,
  fromX: number,
  fromY: number,
  biome: Biome,
  range = PORTAL_RANGE,
): PortalDestination | null {
  return findPortals(world, fromX, fromY, range).get(biome) ?? null;
}
