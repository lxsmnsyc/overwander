import { Around, canonicalMask } from '../data/overworld/autotile';
import type { TerrainRole } from '../data/overworld/terrain';
import { joins } from '../data/overworld/terrain';

/**
 * The board read as ground rather than as a list of things on it.
 *
 * The board has no rim of its own: what it draws past its edge is
 * the neighbouring chunks' own ground, so a lake or a ridge crosses
 * the boundary without a seam. A landmark keeps its ordinary ground;
 * the sprite standing on the cell is what says something is there.
 *
 * Everything but a wall is walked on, water included.
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
 * Which of a terrain's tiles a cell gets, from a question asked of its
 * eight neighbours. The question is whatever the caller is tiling: the
 * ground asks what its neighbours are made of, a street asks whether
 * the street runs on
 */
export function maskAround(
  x: number,
  y: number,
  joined: (x: number, y: number) => boolean,
): number {
  let mask = 0;

  for (const [dx, dy, bit] of NEIGHBOURS) {
    if (joined(x + dx, y + dy)) {
      mask |= bit;
    }
  }
  return canonicalMask(mask);
}

export default function boardTerrain(at: (x: number, y: number) => TerrainRole): BoardTerrain {
  return {
    at,
    maskAt: (x, y) => {
      const self = at(x, y);

      return maskAround(x, y, (nx, ny) => joins(self, at(nx, ny)));
    },
  };
}
