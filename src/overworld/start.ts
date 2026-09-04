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
 * Where a player first steps into the overworld.
 *
 * The draw is whatever seed the caller hands it, and the caller hands
 * it a **random** one: two players who start on the same day start in
 * different places, and one player's world is not a function of their
 * name. It is drawn once — the position is written down as soon as it
 * is picked, so returning is returning rather than being re-rolled.
 *
 * The cell is free: landmarks, scenery and rock are all skipped, so
 * nobody opens the game already standing on a raid or inside a
 * boulder
 */
export default function pickStartPosition(world: World, seed: string): StartPosition {
  const rng = new AleaRNG(`${seed}start`);
  const half = START_AREA / 2;
  // The draws land in order: the chunk coordinates, then the cell
  const chunkX = Math.floor(rng.random() * START_AREA) - half;
  const chunkY = Math.floor(rng.random() * START_AREA) - half;

  return { chunkX, chunkY, ...pickFreeCell(world, chunkX, chunkY, rng) };
}

/**
 * A cell in this chunk that can actually be stood on.
 *
 * Anything that puts somebody down somewhere they did not walk to
 * wants one: arriving already standing on a raid is not an arrival,
 * and arriving inside a boulder is somewhere a walk could never have
 * reached. Every fixture a route walks round is skipped, which is the
 * same set the board refuses to path through. A chunk with no free
 * cell at all answers with its middle, which is somewhere rather than
 * nowhere
 */
export function pickFreeCell(
  world: World,
  chunkX: number,
  chunkY: number,
  rng: AleaRNG,
): { cellX: number; cellY: number } {
  const chunk = world.getChunk(chunkX, chunkY);
  const occupied = new Set([
    ...chunk.getLandmarkCells().keys(),
    ...chunk.getDecorationCells().keys(),
    ...chunk.getRockCells(),
  ]);
  const free: number[] = [];

  for (let cell = 0; cell < CELL_COUNT; cell++) {
    if (!occupied.has(cell)) {
      free.push(cell);
    }
  }

  const middle = Math.floor(CELL_COUNT / 2);
  const cell = free.length === 0 ? middle : free[Math.floor(rng.random() * free.length)];

  return { cellX: cell % CHUNK_CELLS, cellY: Math.floor(cell / CHUNK_CELLS) };
}
