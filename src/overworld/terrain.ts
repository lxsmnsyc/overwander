import { Around, canonicalMask } from '../data/overworld/autotile';
import Landmark from '../data/overworld/landmark';
import type { TerrainRole } from '../data/overworld/terrain';
import { joins } from '../data/overworld/terrain';
import { CHUNK_CELLS } from './chunk';

/**
 * The chunk read as ground rather than as a list of things on it.
 *
 * Walls are where something is standing, **and the ring around it**.
 * A landmark alone on its cell autotiled to the one tile that is all
 * edge, which draws a pebble rather than the thing a player is walking
 * across the chunk to reach. Given the ring it becomes an outcrop with
 * a solid middle, and the chunk keeps that ring clear of everything
 * else anyway, so nothing is buried by it.
 *
 * Everything else is walked on, and is water where the biome is. That
 * includes the apron and the country past it: a threshold is a step
 * into the chunk next door rather than the end of the world, so
 * walling it would draw a room the player is somehow standing outside
 * of. The board says where the chunk stops in its own way, by shading
 * the apron.
 */

export interface BoardTerrain {
  /** What is on a cell, in board coordinates. */
  at: (x: number, y: number) => TerrainRole;
  /**
   * Which of a terrain's tiles the cell gets, as an autotile mask.
   * Already reduced to one of the 47 an artist draws, so two cells
   * that get the same tile compare equal
   */
  maskAt: (x: number, y: number) => number;
}

export interface TerrainOptions {
  /** Where the fixtures are, by row-major cell index. */
  landmarks: ReadonlyMap<number, Landmark>;
  /** Whether what a player walks on here is water. */
  water: boolean;
}

/**
 * Landmarks that lie on the ground rather than stand on it.
 *
 * A phenomenon is rippling water, a dust cloud, a shadow overhead; a
 * nest is a hollow something laid an egg in. Neither has a body to
 * build a block of rock for, so the cell keeps its ordinary ground and
 * the mark drawn on top is what says something is there
 */
const ON_THE_GROUND = new Set<Landmark>([Landmark.Phenomenon, Landmark.Nest]);

/** The eight neighbours, in the order their bits are counted. */
const NEIGHBOURS: [dx: number, dy: number, bit: number][] = [
  [0, -1, Around.North],
  [1, -1, Around.NorthEast],
  [1, 0, Around.East],
  [1, 1, Around.SouthEast],
  [0, 1, Around.South],
  [-1, 1, Around.SouthWest],
  [-1, 0, Around.West],
  [-1, -1, Around.NorthWest],
];

/**
 * How far the wall reaches out from the cell a landmark stands on.
 * One ring, which is exactly the space a chunk already keeps clear
 * around every landmark it places
 */
const WALL_REACH = 1;

/** Board coordinates as one number, the apron included. */
function keyOf(x: number, y: number): number {
  return (y + 1) * (CHUNK_CELLS + 2) + (x + 1);
}

export default function boardTerrain(options: TerrainOptions): BoardTerrain {
  const walkable: TerrainRole = options.water ? 'water' : 'ground';

  /**
   * Every cell the walls cover, worked out once.
   *
   * Once rather than per question: a mask asks about eight neighbours
   * and each of those would ask about nine cells of its own, so the
   * board would spend a few tens of thousands of lookups a frame
   * re-deriving the same rock
   */
  const walls = new Set<number>();

  for (const [cell, landmark] of options.landmarks) {
    if (ON_THE_GROUND.has(landmark)) {
      continue;
    }
    const x = cell % CHUNK_CELLS;
    const y = Math.floor(cell / CHUNK_CELLS);

    // Out into the apron as well, so an outcrop against the rim is a
    // whole one rather than a slice
    for (let dy = -WALL_REACH; dy <= WALL_REACH; dy += 1) {
      for (let dx = -WALL_REACH; dx <= WALL_REACH; dx += 1) {
        walls.add(keyOf(x + dx, y + dy));
      }
    }
  }

  const at = (x: number, y: number): TerrainRole => (walls.has(keyOf(x, y)) ? 'wall' : walkable);

  return {
    at,
    maskAt: (x, y) => {
      const self = at(x, y);
      let mask = 0;

      for (const [dx, dy, bit] of NEIGHBOURS) {
        if (joins(self, at(x + dx, y + dy))) {
          mask |= bit;
        }
      }
      return canonicalMask(mask);
    },
  };
}
