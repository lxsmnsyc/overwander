import { Around, canonicalMask } from '../data/overworld/autotile';
import type { TerrainRole } from '../data/overworld/terrain';
import { joins } from '../data/overworld/terrain';
import { CHUNK_CELLS } from './chunk';

/**
 * The chunk read as ground rather than as a list of things on it.
 *
 * The walls are the rim: everything outside the chunk proper, apron
 * included, is rock, so the board sits inside a solid frame. A
 * landmark keeps its ordinary ground; the sprite standing on the cell
 * is what says something is there.
 *
 * Inside the frame everything is walked on, and is water where the
 * biome is.
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
  /** Whether what a player walks on here is water. */
  water: boolean;
}

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

export default function boardTerrain(options: TerrainOptions): BoardTerrain {
  const walkable: TerrainRole = options.water ? 'water' : 'ground';

  const at = (x: number, y: number): TerrainRole =>
    x < 0 || y < 0 || x >= CHUNK_CELLS || y >= CHUNK_CELLS ? 'wall' : walkable;

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
