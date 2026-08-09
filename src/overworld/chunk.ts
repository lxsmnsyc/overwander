import AleaRNG from '../core/alea';
import type Biome from '../data/ids/biome';
import type Landmark from '../data/overworld/landmark';
import { LANDMARKS } from '../data/overworld/landmark';

/**
 * A chunk is a 16x16 grid of cells; landmarks and snapshot spawns
 * each occupy one cell, never sharing
 */
export const CHUNK_CELLS = 16;

export const CELL_COUNT = CHUNK_CELLS * CHUNK_CELLS;

const MIN_LANDMARKS = 3;
const MAX_LANDMARKS = 5;

/**
 * One overworld cell: its coordinates, the biome its climate
 * resolved to, and the seed that deterministically drives everything
 * generated inside it
 */
export default class Chunk {
  constructor(
    public readonly x: number,
    public readonly y: number,
    public readonly seed: string,
    public readonly biome: Biome,
  ) {}

  private landmarkCells: Map<number, Landmark> | null = null;

  /**
   * The chunk's 3-5 landmarks (duplicates allowed), each on its own
   * cell, keyed by row-major cell index. Rolled from the chunk seed
   * alone — no clock or snapshot involved — so the same chunk yields
   * the same landmarks on the same cells forever
   */
  getLandmarkCells(): Map<number, Landmark> {
    if (this.landmarkCells == null) {
      const rng = new AleaRNG(`${this.seed}landmarks`);
      const count = MIN_LANDMARKS + Math.floor(rng.random() * (MAX_LANDMARKS - MIN_LANDMARKS + 1));
      const free = Array.from({ length: CELL_COUNT }, (_, cell) => cell);
      const cells = new Map<number, Landmark>();

      for (let i = 0; i < count; i++) {
        // The draws land in pair order: the landmark, then its cell
        const landmark = LANDMARKS[Math.floor(rng.random() * LANDMARKS.length)];
        const [cell] = free.splice(Math.floor(rng.random() * free.length), 1);

        cells.set(cell, landmark);
      }
      this.landmarkCells = cells;
    }
    return this.landmarkCells;
  }

  /**
   * The chunk's landmarks in roll order
   */
  getLandmarks(): Landmark[] {
    return [...this.getLandmarkCells().values()];
  }

  /**
   * The landmark occupying the given cell, if any
   */
  getLandmarkAt(cellX: number, cellY: number): Landmark | null {
    return this.getLandmarkCells().get(cellY * CHUNK_CELLS + cellX) ?? null;
  }
}
