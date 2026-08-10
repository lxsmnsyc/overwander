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

/**
 * Landmarks keep to the central 8x8 and spawns to the central
 * 12x12, so a player entering from a chunk edge never lands on an
 * interactable immediately
 */
export const LANDMARK_AREA = 8;

export const SPAWN_AREA = 12;

/**
 * Row-major cell indices of a size x size square centered on the
 * chunk grid
 */
export function centeredCells(size: number): number[] {
  const offset = (CHUNK_CELLS - size) / 2;
  const cells: number[] = [];

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      cells.push((offset + y) * CHUNK_CELLS + (offset + x));
    }
  }
  return cells;
}

const MIN_LANDMARKS = 3;
const MAX_LANDMARKS = 5;

/**
 * The cells touching one, diagonals included, clipped to the chunk.
 * A landmark keeps this ring clear of everything else, so there is
 * always somewhere to stand beside it
 */
export function neighborCells(cell: number): number[] {
  const x = cell % CHUNK_CELLS;
  const y = Math.floor(cell / CHUNK_CELLS);
  const cells: number[] = [];

  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      const nx = x + dx;
      const ny = y + dy;

      if ((dx !== 0 || dy !== 0) && nx >= 0 && nx < CHUNK_CELLS && ny >= 0 && ny < CHUNK_CELLS) {
        cells.push(ny * CHUNK_CELLS + nx);
      }
    }
  }
  return cells;
}

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
   * cell within the central 8x8, keyed by row-major cell index.
   * Rolled from the chunk seed alone — no clock or snapshot
   * involved — so the same chunk yields the same landmarks on the
   * same cells forever.
   *
   * Every landmark also keeps the ring of cells around it clear: no
   * two of them touch, and nothing else is placed there either, so a
   * player always has room to walk up to one and step around it. A
   * chunk that runs out of room takes fewer landmarks rather than
   * crowding them
   */
  getLandmarkCells(): Map<number, Landmark> {
    if (this.landmarkCells == null) {
      const rng = new AleaRNG(`${this.seed}landmarks`);
      const count = MIN_LANDMARKS + Math.floor(rng.random() * (MAX_LANDMARKS - MIN_LANDMARKS + 1));
      let free = centeredCells(LANDMARK_AREA);
      const cells = new Map<number, Landmark>();

      for (let i = 0; i < count && free.length > 0; i++) {
        // The draws land in pair order: the landmark, then its cell
        const landmark = LANDMARKS[Math.floor(rng.random() * LANDMARKS.length)];
        const [cell] = free.splice(Math.floor(rng.random() * free.length), 1);

        cells.set(cell, landmark);

        // Its own approach is now spoken for, so the next landmark
        // goes somewhere with room of its own
        const taken = new Set(neighborCells(cell));

        free = free.filter((candidate) => !taken.has(candidate));
      }
      this.landmarkCells = cells;
    }
    return this.landmarkCells;
  }

  private landmarkArea: Set<number> | null = null;

  /**
   * Every cell a landmark occupies or keeps clear: the landmarks
   * themselves plus the ring around each. Nothing else in the chunk
   * may stand here — it is what a player walks through to reach one
   */
  getLandmarkArea(): Set<number> {
    if (this.landmarkArea == null) {
      const area = new Set<number>();

      for (const cell of this.getLandmarkCells().keys()) {
        area.add(cell);
        for (const neighbor of neighborCells(cell)) {
          area.add(neighbor);
        }
      }
      this.landmarkArea = area;
    }
    return this.landmarkArea;
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
