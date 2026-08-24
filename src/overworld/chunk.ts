import AleaRNG from '../core/alea';
import type Biome from '../data/ids/biome';
import type Decoration from '../data/overworld/decoration';
import {
  MAX_DECORATIONS,
  MIN_DECORATIONS,
  getBiomeDecorations,
} from '../data/overworld/decoration';
import type Landmark from '../data/overworld/landmark';
import { LANDMARKS } from '../data/overworld/landmark';

/**
 * A chunk is a 16x16 grid of cells; scenery, landmarks and snapshot
 * spawns each occupy one cell, never sharing
 */
export const CHUNK_CELLS = 16;

export const CELL_COUNT = CHUNK_CELLS * CHUNK_CELLS;

/**
 * How wide the opening in each side's wall is. The rest of the rim is
 * rock: a chunk is entered and left through its four gates, not
 * anywhere along an edge
 */
export const GATE_CELLS = 4;

const GATE_START = (CHUNK_CELLS - GATE_CELLS) / 2;

/**
 * Whether a row or column lines up with the gates, which are centered
 * on every side
 */
export function isGateCell(along: number): boolean {
  return along >= GATE_START && along < GATE_START + GATE_CELLS;
}

/**
 * How much of the chunk anything may be placed in: the central 14x14,
 * which is the whole grid but for a clear cell all the way round.
 *
 * The three kinds used to keep to squares of their own — landmarks to
 * the middle eight, spawns to the middle twelve — which drew every
 * chunk as a target, busy in the middle and empty at the rim. One area
 * for all of them spreads the chunk out, and the ring it leaves is
 * what a player walks in on from a neighbouring chunk
 */
export const PLACEMENT_AREA = 14;

/**
 * Row-major cell indices of a size x size square centered on the
 * chunk grid. A window that cannot sit dead centre on an even grid is
 * pushed off the **near** edge — the low rows and columns — rather
 * than the far one, so the corner a chunk is read from is clear
 */
export function centeredCells(size: number): number[] {
  const offset = Math.ceil((CHUNK_CELLS - size) / 2);
  const cells: number[] = [];

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      cells.push((offset + y) * CHUNK_CELLS + (offset + x));
    }
  }
  return cells;
}

const MIN_LANDMARKS = 8;
const MAX_LANDMARKS = 12;

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
 * The free list with a placed cell and its ring struck out. It is the
 * whole of the spacing rule: nothing in a chunk ever touches anything
 * else, so there is always somewhere to stand beside it
 */
function clear(free: number[], cell: number): number[] {
  const taken = new Set(neighborCells(cell));

  return free.filter((candidate) => !taken.has(candidate));
}

/**
 * Cells and the rings around them, as one set
 */
function spread(cells: Iterable<number>): Set<number> {
  const area = new Set<number>();

  for (const cell of cells) {
    area.add(cell);
    for (const neighbor of neighborCells(cell)) {
      area.add(neighbor);
    }
  }
  return area;
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

  private decorationCells: Map<number, Decoration> | null = null;

  /**
   * The chunk's 5-10 pieces of scenery, each on its own cell, keyed by
   * row-major cell index.
   *
   * Placed **first** of the three, and the order matters: scenery is
   * the chunk's own furniture and never moves, landmarks are fixed
   * too, and spawns roll again every few minutes. Laying the fixed
   * things down first means a window's pokemon fit themselves around
   * the chunk rather than the chunk being rearranged around them
   */
  getDecorationCells(): Map<number, Decoration> {
    if (this.decorationCells == null) {
      const kinds = getBiomeDecorations(this.biome);
      const cells = new Map<number, Decoration>();

      if (kinds.length > 0) {
        const rng = new AleaRNG(`${this.seed}decorations`);
        const count =
          MIN_DECORATIONS + Math.floor(rng.random() * (MAX_DECORATIONS - MIN_DECORATIONS + 1));
        let free = centeredCells(PLACEMENT_AREA);

        for (let i = 0; i < count && free.length > 0; i++) {
          // The draws land in pair order: the kind, then its cell
          const decoration = kinds[Math.floor(rng.random() * kinds.length)];
          const [cell] = free.splice(Math.floor(rng.random() * free.length), 1);

          cells.set(cell, decoration);
          free = clear(free, cell);
        }
      }
      this.decorationCells = cells;
    }
    return this.decorationCells;
  }

  private decorationArea: Set<number> | null = null;

  /**
   * Every cell scenery occupies or keeps clear
   */
  getDecorationArea(): Set<number> {
    this.decorationArea ??= spread(this.getDecorationCells().keys());
    return this.decorationArea;
  }

  private landmarkCells: Map<number, Landmark> | null = null;

  /**
   * The chunk's 8-12 landmarks (duplicates allowed), each on its own
   * cell, keyed by row-major cell index. Rolled from the chunk seed
   * alone — no clock or snapshot involved — so the same chunk yields
   * the same landmarks on the same cells forever.
   *
   * Every landmark keeps the ring of cells around it clear: no two of
   * them touch, nothing else is placed there either, and the scenery
   * already standing is given the same berth. A chunk that runs out of
   * room takes fewer landmarks rather than crowding them
   */
  getLandmarkCells(): Map<number, Landmark> {
    if (this.landmarkCells == null) {
      const rng = new AleaRNG(`${this.seed}landmarks`);
      const count = MIN_LANDMARKS + Math.floor(rng.random() * (MAX_LANDMARKS - MIN_LANDMARKS + 1));
      const scenery = this.getDecorationArea();
      let free = centeredCells(PLACEMENT_AREA).filter((cell) => !scenery.has(cell));
      const cells = new Map<number, Landmark>();

      for (let i = 0; i < count && free.length > 0; i++) {
        // The draws land in pair order: the landmark, then its cell
        const landmark = LANDMARKS[Math.floor(rng.random() * LANDMARKS.length)];
        const [cell] = free.splice(Math.floor(rng.random() * free.length), 1);

        cells.set(cell, landmark);

        // Its own approach is now spoken for, so the next landmark
        // goes somewhere with room of its own
        free = clear(free, cell);
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
    this.landmarkArea ??= spread(this.getLandmarkCells().keys());
    return this.landmarkArea;
  }

  /**
   * The scenery standing on a given cell, if any
   */
  getDecorationAt(cellX: number, cellY: number): Decoration | null {
    return this.getDecorationCells().get(cellY * CHUNK_CELLS + cellX) ?? null;
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
