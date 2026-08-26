import AleaRNG from '../core/alea';
import type Biome from '../data/ids/biome';
import { isOpenSea, isWaterBiome } from '../data/ids/biome';
import type Decoration from '../data/overworld/decoration';
import {
  MAX_DECORATIONS,
  MIN_DECORATIONS,
  getBiomeDecorations,
} from '../data/overworld/decoration';
import Landmark, { LANDMARKS } from '../data/overworld/landmark';

/**
 * A chunk is a 16x16 grid of cells; scenery, landmarks and snapshot
 * spawns each occupy one cell, never sharing
 */
export const CHUNK_CELLS = 16;

export const CELL_COUNT = CHUNK_CELLS * CHUNK_CELLS;

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
 * How many terrain spots a chunk gets: grown pools on land, banks in
 * a wetland. Few enough that most of the ground is still ground
 */
const MIN_WATER_SPOTS = 1;
const MAX_WATER_SPOTS = 3;

/**
 * The roll pool on the open seas: a berry bush cannot grow on water
 * and people have nowhere to stand, so neither bushes nor any of the
 * landmarks somebody stands at is rolled there
 */
const SEA_PEOPLE = new Set([
  Landmark.BerryPatch,
  Landmark.WanderingNpc,
  Landmark.TeamRocket,
  Landmark.Trainer,
  Landmark.GymLeader,
  Landmark.EliteFour,
  Landmark.Champion,
  Landmark.Market,
  Landmark.GymSeat,
  Landmark.AuctionBoard,
]);

const SEA_LANDMARKS = LANDMARKS.filter((kind) => !SEA_PEOPLE.has(kind));

/**
 * The landmarks a chunk holds at most one of: a second portal goes
 * nowhere the first does not, and a gym or a champion's seat is a
 * place, not a patrol
 */
const SINGLETON_LANDMARKS = new Set([
  Landmark.Portal,
  Landmark.GymLeader,
  Landmark.Champion,
  // One seat to a chunk: a seat is a place players come back to, and
  // two of them beside each other would be one contest split in half
  Landmark.GymSeat,
  // And one board: every board shows the same global lots, so a
  // second in the same chunk is the same board twice
  Landmark.AuctionBoard,
]);

/**
 * How many shallow patches an open-sea chunk gets: the lighter
 * ground tiles mixed through the water, so the sea is not one
 * unbroken sheet
 */
const MIN_SHALLOWS = 4;
const MAX_SHALLOWS = 7;

/**
 * How many rock outcrops a chunk grows. The seas always have some
 * standing out of the water; on land they are rarer, and a chunk
 * with none is an ordinary field
 */
const SEA_ROCKS: [minimum: number, maximum: number] = [1, 3];
const LAND_ROCKS: [minimum: number, maximum: number] = [0, 2];

/**
 * How many cells one grown patch holds — a pool, a bank or a rock
 * outcrop alike
 */
const MIN_BLOB_CELLS = 5;
const MAX_BLOB_CELLS = 9;

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
 * The stage's own seeded ordering of its candidate cells. Every stage
 * walks one of these and skips what is already claimed, rather than
 * inheriting a pruned list from the stage before — so a change to one
 * stage shifts the others only where a collision actually moves
 */
function shuffled(rng: AleaRNG, cells: number[]): number[] {
  const order = [...cells];

  for (let at = order.length - 1; at > 0; at -= 1) {
    const pick = Math.floor(rng.random() * (at + 1));

    [order[at], order[pick]] = [order[pick], order[at]];
  }
  return order;
}

/**
 * One rock outcrop, grown a cell at a time: start somewhere, and keep
 * annexing a random orthogonal neighbour until the size is reached or
 * the room runs out. Orthogonal growth keeps the blob solid, and the
 * shape falls out of the walk rather than out of a stamp
 */
function grownBlob(rng: AleaRNG, start: number, size: number, allowed: Set<number>): Set<number> {
  const blob = new Set([start]);

  while (blob.size < size) {
    const frontier: number[] = [];

    for (const cell of blob) {
      for (const step of [-1, 1, -CHUNK_CELLS, CHUNK_CELLS]) {
        const next = cell + step;

        // Row-major arithmetic wraps at the grid's edges, but the
        // allowed set never contains a wrapped cell
        if (!blob.has(next) && allowed.has(next)) {
          frontier.push(next);
        }
      }
    }
    if (frontier.length === 0) {
      break;
    }
    blob.add(frontier[Math.floor(rng.random() * frontier.length)]);
  }
  return blob;
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

  private spotCells: Set<number> | null = null;

  /**
   * The chunk's terrain spots: 1-3 grown patches of the other ground,
   * as the union of their cells. On land they are pools of water; in
   * a wetland they are banks of ground. The open seas have none —
   * their variation is the rocks and the shallows. Laid down before
   * anything else — the ground is what everything stands on
   */
  getSpotCells(): Set<number> {
    if (this.spotCells == null) {
      const cells = new Set<number>();

      if (isOpenSea(this.biome)) {
        this.spotCells = cells;
        return cells;
      }
      const rng = new AleaRNG(`${this.seed}water`);
      const count =
        MIN_WATER_SPOTS + Math.floor(rng.random() * (MAX_WATER_SPOTS - MIN_WATER_SPOTS + 1));
      // Confined inside the placement area's own ring, so the walk-in
      // ring by the wall keeps its own ground whatever shape a patch
      // grows into
      const allowed = new Set(centeredCells(PLACEMENT_AREA - 2));
      const order = shuffled(rng, [...allowed]);

      for (let i = 0; i < count; i++) {
        const start = order.find((cell) => allowed.has(cell));

        if (start == null) {
          break;
        }
        const size =
          MIN_BLOB_CELLS + Math.floor(rng.random() * (MAX_BLOB_CELLS - MIN_BLOB_CELLS + 1));
        const blob = grownBlob(rng, start, size, allowed);

        for (const cell of blob) {
          cells.add(cell);
        }
        // The patch and its ring leave room for the next, so two
        // patches never run together
        for (const cell of spread(blob)) {
          allowed.delete(cell);
        }
      }
      this.spotCells = cells;
    }
    return this.spotCells;
  }

  /**
   * The cells that are water where the ground around them is not:
   * the pools on a land chunk. A water biome answers with nothing —
   * its water is the default, not a spot
   */
  private wetCells(): Set<number> {
    return isWaterBiome(this.biome) ? new Set() : this.getSpotCells();
  }

  private rockCells: Set<number> | null = null;

  /**
   * The chunk's rock outcrops: organically grown blobs of solid wall,
   * 1-3 standing out of every sea and 0-2 breaking up the land.
   * Nothing may stand in one, nothing walks through one, and each
   * keeps a clear ring from the others and from the pools
   */
  getRockCells(): Set<number> {
    if (this.rockCells == null) {
      const cells = new Set<number>();
      const rng = new AleaRNG(`${this.seed}rocks`);
      const [minimum, maximum] = isOpenSea(this.biome) ? SEA_ROCKS : LAND_ROCKS;
      const count = minimum + Math.floor(rng.random() * (maximum - minimum + 1));
      // Confined inside the placement area's own ring, so the walk-in
      // ring by the wall stays clear whatever shape a blob takes
      const spots = this.getSpotCells();
      const allowed = new Set(centeredCells(PLACEMENT_AREA - 2).filter((cell) => !spots.has(cell)));
      const order = shuffled(rng, [...allowed]);

      for (let i = 0; i < count; i++) {
        const start = order.find((cell) => allowed.has(cell));

        if (start == null) {
          break;
        }
        const size =
          MIN_BLOB_CELLS + Math.floor(rng.random() * (MAX_BLOB_CELLS - MIN_BLOB_CELLS + 1));
        const blob = grownBlob(rng, start, size, allowed);

        for (const cell of blob) {
          cells.add(cell);
        }
        // The blob and its ring leave the pool of room for the next
        for (const cell of spread(blob)) {
          allowed.delete(cell);
        }
      }
      this.rockCells = cells;
    }
    return this.rockCells;
  }

  private shallowCells: Set<number> | null = null;

  /**
   * A water chunk's shallow cells, drawn with the ground tiles — in
   * the sea rips the lighter shelf the deep's own gradient is drawn
   * to meet. Every rock wears a skirt of them, since a wall's fringe
   * is painted fading into ground; the open seas mix in loose patches
   * of shelf besides. Purely a look: a shallow cell is swum exactly
   * like the deep around it. Land chunks answer with nothing
   */
  getShallowCells(): Set<number> {
    if (this.shallowCells == null) {
      const cells = new Set<number>();

      if (isWaterBiome(this.biome)) {
        const rocks = this.getRockCells();

        // The skirt: the ring around every rock, so the wall art has
        // the ground it was painted against
        for (const cell of spread(rocks)) {
          if (!rocks.has(cell)) {
            cells.add(cell);
          }
        }
      }
      if (isOpenSea(this.biome)) {
        const rng = new AleaRNG(`${this.seed}shallows`);
        const count = MIN_SHALLOWS + Math.floor(rng.random() * (MAX_SHALLOWS - MIN_SHALLOWS + 1));
        const rocks = this.getRockCells();

        // Patches may run together — merged shelves look like shelves
        const patches = shuffled(rng, centeredCells(PLACEMENT_AREA - 2)).slice(0, count);
        const shelf = patches.flatMap((patch) => [patch, ...neighborCells(patch)]);

        for (const cell of shelf) {
          if (!rocks.has(cell)) {
            cells.add(cell);
          }
        }
      }
      this.shallowCells = cells;
    }
    return this.shallowCells;
  }

  /**
   * The cells no fixture may stand on: solid rock and the ring around
   * it. Everything impassable keeps a clear ring from everything else
   * impassable, which is what makes a walled-off pocket impossible
   */
  private rockArea(): Set<number> {
    return spread(this.getRockCells());
  }

  private decorationCells: Map<number, Decoration> | null = null;

  /**
   * The chunk's 8-12 pieces of scenery, each on its own cell, keyed by
   * row-major cell index.
   *
   * Placed **after** the landmarks: scenery is dressing, and the
   * landmarks carry the gameplay promise, so they take their cells
   * first and the scenery fills what is left
   */
  getDecorationCells(): Map<number, Decoration> {
    if (this.decorationCells == null) {
      const kinds = getBiomeDecorations(this.biome);
      const cells = new Map<number, Decoration>();

      if (kinds.length > 0) {
        const rng = new AleaRNG(`${this.seed}decorations`);
        const count =
          MIN_DECORATIONS + Math.floor(rng.random() * (MAX_DECORATIONS - MIN_DECORATIONS + 1));
        // Nothing grows out of a pool, a rock's reach, or a
        // landmark's approach
        const water = this.wetCells();
        const rocks = this.rockArea();
        const landmarks = this.getLandmarkArea();
        const taken = new Set<number>();
        const order = shuffled(rng, centeredCells(PLACEMENT_AREA));

        for (let i = 0; i < count; i++) {
          // The draws land in pair order: the kind, then its cell
          const decoration = kinds[Math.floor(rng.random() * kinds.length)];
          const cell = order.find(
            (candidate) =>
              !taken.has(candidate) &&
              !water.has(candidate) &&
              !rocks.has(candidate) &&
              !landmarks.has(candidate),
          );

          if (cell == null) {
            break;
          }
          cells.set(cell, decoration);
          taken.add(cell);
          for (const neighbor of neighborCells(cell)) {
            taken.add(neighbor);
          }
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
   * The chunk's 8-12 landmarks (duplicates allowed, the singletons
   * aside), each on its own cell, keyed by row-major cell index.
   * Rolled from the chunk seed alone — no clock or snapshot involved
   * — so the same chunk yields the same landmarks on the same cells
   * forever.
   *
   * Placed first of the fixtures — the landmarks carry the gameplay
   * promise, so the scenery fits around them. Every landmark keeps
   * the ring of cells around it clear: no two of them touch, and
   * nothing else is placed there either. Only a genuinely full board
   * takes fewer than the roll asked
   */
  getLandmarkCells(): Map<number, Landmark> {
    if (this.landmarkCells == null) {
      const rng = new AleaRNG(`${this.seed}landmarks`);
      const count = MIN_LANDMARKS + Math.floor(rng.random() * (MAX_LANDMARKS - MIN_LANDMARKS + 1));
      const water = this.wetCells();
      // Nothing stands in a rock's reach, and the open seas roll from
      // a pool without the landmarks that need ground under them
      const rocks = this.rockArea();
      const base = isOpenSea(this.biome) ? SEA_LANDMARKS : LANDMARKS;
      const order = shuffled(rng, centeredCells(PLACEMENT_AREA));
      const cells = new Map<number, Landmark>();
      const taken = new Set<number>();
      const rolled = new Set<Landmark>();

      for (let i = 0; i < count; i++) {
        // The draws land in pair order: the landmark, then its cell.
        // A singleton already rolled leaves the pool for the rest of
        // the chunk: a second portal, gym or champion is never rolled
        const pool = base.filter((kind) => !(SINGLETON_LANDMARKS.has(kind) && rolled.has(kind)));
        const landmark = pool[Math.floor(rng.random() * pool.length)];
        // Everything that is a landmark now needs ground under it. The
        // one that did not was the phenomenon, which is no longer one:
        // something happening is rolled over the chunk by the hour
        const fits = (candidate: number): boolean =>
          !taken.has(candidate) && !rocks.has(candidate) && !water.has(candidate);
        const cell = order.find(fits);

        if (cell == null) {
          break;
        }
        cells.set(cell, landmark);
        rolled.add(landmark);

        // Its own approach is now spoken for, so the next landmark
        // goes somewhere with room of its own
        taken.add(cell);
        for (const neighbor of neighborCells(cell)) {
          taken.add(neighbor);
        }
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
