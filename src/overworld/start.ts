import AleaRNG from '../core/alea';
import { CELL_COUNT, CHUNK_CELLS } from './chunk';
import type World from './world';

/**
 * How wide the starting region is, in chunks: a player's first
 * entrance lands somewhere in a 1000x1000 square centered on the
 * origin, so the world's population spreads out instead of piling
 * onto chunk 0,0
 */
export const START_AREA = 1000;

export interface StartPosition {
  chunkX: number;
  chunkY: number;
  cellX: number;
  cellY: number;
}

/**
 * Where a player first steps into the overworld. The draw is seeded
 * by the player, so their starting point is fixed the first time and
 * every time they return before anything is stored — reloading does
 * not reshuffle them across the map. The cell is free: landmarks are
 * skipped, so nobody opens the game already standing on a raid
 */
export default function pickStartPosition(world: World, seed: string): StartPosition {
  const rng = new AleaRNG(`${seed}start`);
  const half = START_AREA / 2;
  // The draws land in order: the chunk coordinates, then the cell
  const chunkX = Math.floor(rng.random() * START_AREA) - half;
  const chunkY = Math.floor(rng.random() * START_AREA) - half;
  const occupied = world.getChunk(chunkX, chunkY).getLandmarkCells();
  const free: number[] = [];

  for (let cell = 0; cell < CELL_COUNT; cell++) {
    if (!occupied.has(cell)) {
      free.push(cell);
    }
  }

  const cell = free[Math.floor(rng.random() * free.length)];

  return {
    chunkX,
    chunkY,
    cellX: cell % CHUNK_CELLS,
    cellY: Math.floor(cell / CHUNK_CELLS),
  };
}
