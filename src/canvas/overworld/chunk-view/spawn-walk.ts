import { BOARD_CELLS } from '../../../overworld/board';
import { CHUNK_CELLS } from '../../../overworld/grid';
import type { LiveSpawn } from '../../../overworld/spawn-life';
import { type RoamArea, positionAt } from '../../../overworld/spawn-life/roam';
import facingToward from '../../sprites/facing';
import type { SpriteDirection } from '../../sprites/sheet';

/** What the board holds of a roaming pokemon: its cycle, its area and where its chunk sits on the board */
export interface SpawnWalk {
  live: LiveSpawn;
  area: RoamArea;
  /** Where the chunk's own cell 0 sits on the board, in cells */
  shiftX: number;
  shiftY: number;
}

/** Where a roaming pokemon is drawn at one instant */
export interface SpawnStep {
  /** The board cell it is nearest, which is the one it is drawn in and pressed on */
  index: number;
  /** Where it stands, in cells: the middle of its cell plus how far off it is */
  x: number;
  y: number;
  /** The way it faces, null until it has taken a step */
  facing: SpriteDirection | null;
  /** Whether it is between two cells, so the walk is what is drawn */
  moving: boolean;
  /** How long into this walk it is, in milliseconds, for the walk cycle */
  walked: number;
}

/**
 * Where a pokemon is on the board at a local instant, from the cell and
 * the offset the cycle gives. Null when it has walked off the board
 */
export function stepSpawn(walk: SpawnWalk, now: number): SpawnStep | null {
  // Its chunk cell and how far off it, which every client computes the same
  const found = positionAt(walk.area, walk.live, now);

  // And the same cell on the board
  const x = (found.cell % CHUNK_CELLS) + walk.shiftX;
  const y = Math.floor(found.cell / CHUNK_CELLS) + walk.shiftY;

  if (x < 0 || y < 0 || x >= BOARD_CELLS || y >= BOARD_CELLS) {
    return null;
  }
  return {
    index: y * BOARD_CELLS + x,
    x: x + found.dx,
    y: y + found.dy,
    facing: found.heading == null ? null : facingToward(0, 0, found.heading[0], found.heading[1]),
    moving: found.moving,
    walked: found.walked,
  };
}
