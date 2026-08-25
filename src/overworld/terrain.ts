import { Around, canonicalMask } from '../data/overworld/autotile';
import type { TerrainRole } from '../data/overworld/terrain';
import { joins } from '../data/overworld/terrain';
import { CHUNK_CELLS } from './chunk';

/**
 * The chunk read as ground rather than as a list of things on it.
 *
 * The chunk has no rim of its own: its ground runs on outward past
 * the edge, apron included, so a chunk reads as a stretch of open
 * country and the next one begins where this one leaves off. A
 * landmark keeps its ordinary ground; the sprite standing on the
 * cell is what says something is there.
 *
 * Everything is walked on, and is water where the biome is. The
 * chunk's spots break the surface up: a pool of water on a land
 * chunk, a bank of ground on a water one.
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
  /**
   * The chunk's terrain spots by row-major index: pools of water on a
   * land chunk, banks of ground in a wetland, rock on the open sea
   */
  spots?: Set<number>;
  /** What a spot is made of. Without one: water on land, ground at sea. */
  spotRole?: TerrainRole;
  /**
   * Open-sea cells drawn with the ground tiles — the lighter shelf
   * mixed through the deep. Only a look: they are swum like the rest
   */
  shallows?: Set<number>;
  /** The chunk's rock outcrops, drawn as wall and walked around. */
  rocks?: Set<number>;
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

  const at = (x: number, y: number): TerrainRole => {
    // Past the edge the walkable ground simply continues, so the way
    // out is drawn as country going on rather than as a boundary
    if (x < 0 || x >= CHUNK_CELLS || y < 0 || y >= CHUNK_CELLS) {
      return walkable;
    }

    const cell = y * CHUNK_CELLS + x;

    if (options.rocks?.has(cell) === true) {
      return 'wall';
    }
    // A spot is the other ground: a pool in a field, a bank in a
    // wetland
    if (options.spots?.has(cell) === true) {
      return options.spotRole ?? (options.water ? 'ground' : 'water');
    }
    if (options.shallows?.has(cell) === true) {
      return 'ground';
    }
    return walkable;
  };

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
