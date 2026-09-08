import AleaRNG from '../core/alea';
import { CELL_COUNT, CHUNK_CELLS, worldCell } from './grid';
import type Biome from '../data/ids/biome';
import { growsBerries, growsTrees, isOpenSea, isWaterBiome } from '../data/ids/biome';
import { type GroundRole, isShelfAt, roleAt } from './ground';
import type World from './world';
import type Decoration from '../data/overworld/decoration';
import {
  MAX_DECORATIONS,
  MIN_DECORATIONS,
  getBiomeDecorations,
} from '../data/overworld/decoration';
import Landmark, { LANDMARKS } from '../data/overworld/landmark';
import { TOWN_LANDMARKS, getTownLots, isTownAt, portalCellIn, townOverChunk } from './town';

export { CELL_COUNT, CHUNK_CELLS, cellInChunk, chunkOfCell, worldCell } from './grid';

/**
 * How much of the chunk anything may be placed in: all of it.
 *
 * It used to be the central 14x14, leaving a clear cell all the way
 * round for a player walking in from the chunk next door. Nobody walks
 * in any more, since the board is a window that follows the player
 * rather than the chunk they are in, and a clear rim on every chunk
 * drew a lattice of bare corridors across the world every sixteen
 * cells
 */
export const PLACEMENT_AREA = CHUNK_CELLS;

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

/**
 * How many landmarks a chunk of open country holds.
 *
 * Thin on purpose. The services moved into the towns, so what is left
 * out here is what a player actually goes out for, and a couple of
 * them to a chunk is the difference between country worth crossing
 * and a shopping list laid over the whole world
 */
const MIN_LANDMARKS = 2;
const MAX_LANDMARKS = 4;

/**
 * What the open country still holds: everything a town does not. The
 * two lists together are every landmark there is
 */
const WILD_LANDMARKS = LANDMARKS.filter((kind) => !new Set(TOWN_LANDMARKS).has(kind));

/**
 * The roll pool on the open seas: a berry bush cannot grow on water
 * and people have nowhere to stand, so neither bushes nor any of the
 * landmarks somebody stands at is rolled there.
 *
 * The duel is the exception. A trainer out here is a swimmer, a
 * sailor or somebody on a float, which `getBiomeTrainers` narrows the
 * country's list down to, and none of them needs ground
 */
const SEA_PEOPLE = new Set([
  Landmark.BerryPatch,
  Landmark.ApricornTree,
  Landmark.WanderingNpc,
  Landmark.TeamRocket,
  Landmark.GymLeader,
  Landmark.EliteFour,
  Landmark.Champion,
  Landmark.Market,
  Landmark.GymSeat,
  Landmark.AuctionBoard,
  Landmark.FrontierBrain,
]);

const BIOME_LANDMARKS = new Map<Biome, Landmark[]>();

/**
 * The pool a biome rolls its open country from: what cannot stand or
 * grow there is out. A barren or frozen chunk bears no berries and a
 * treeless one no apricorns, so those rolls go to something else
 * rather than putting a bush on the lava. What belongs to a town is
 * never in it, since a town lays its own lots
 */
function biomeLandmarks(biome: Biome): Landmark[] {
  const held = BIOME_LANDMARKS.get(biome);

  if (held != null) {
    return held;
  }
  const pool = WILD_LANDMARKS.filter((kind) => {
    if (isOpenSea(biome) && SEA_PEOPLE.has(kind)) {
      return false;
    }
    if (kind === Landmark.BerryPatch) {
      return growsBerries(biome);
    }
    if (kind === Landmark.ApricornTree) {
      return growsTrees(biome);
    }
    return true;
  });

  BIOME_LANDMARKS.set(biome, pool);
  return pool;
}

/**
 * The wild landmarks a chunk holds at most one of. A lair is a place
 * rather than a patrol, and two of the same one in sight of each
 * other is one raid offered twice
 */
const SINGLETON_LANDMARKS = new Set([Landmark.LegendaryLair, Landmark.ShadowLair]);

/**
 * The cells touching one, diagonals included, clipped to the chunk.
 * A landmark keeps this ring clear of everything else, so there is
 * always somewhere to stand beside it.
 *
 * Clipped, so a fixture on a chunk's edge only holds its own chunk's
 * side of the ring clear: two of them either side of a boundary may
 * end up touching, which is the price of a chunk that is a unit of
 * bookkeeping rather than of walking
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
    /** The fields the ground under it is read out of */
    public readonly world: World,
  ) {}

  private readonly roles: (GroundRole | undefined)[] = new Array<GroundRole | undefined>(
    CELL_COUNT,
  );

  /**
   * What a player finds underfoot on one of the chunk's cells, read
   * out of the world's own fields rather than grown here.
   *
   * A chunk knows nothing about where a lake or a ridge begins, which
   * is the point: the same field answers for the cell on the far side
   * of the boundary, so two chunks agree on a shore without being
   * told. Read one cell at a time and kept, since placing the
   * landmarks asks about a few dozen of the 256 and nothing else
   */
  getCellRole(cell: number): GroundRole {
    const known = this.roles[cell];

    if (known != null) {
      return known;
    }

    const role = roleAt(
      this.world,
      worldCell(this.x, cell % CHUNK_CELLS),
      worldCell(this.y, Math.floor(cell / CHUNK_CELLS)),
    );

    this.roles[cell] = role;
    return role;
  }

  /** Every cell whose role is this one */
  private cellsWhere(wanted: GroundRole): Set<number> {
    const cells = new Set<number>();

    for (let cell = 0; cell < CELL_COUNT; cell++) {
      if (this.getCellRole(cell) === wanted) {
        cells.add(cell);
      }
    }
    return cells;
  }

  private cellBiomes: Uint8Array | null = null;

  /**
   * The country every cell belongs to, by row-major index. A chunk
   * holds as many as the borders running through it leave it with,
   * and `biome` is only the one in the middle
   */
  getCellBiomes(): Uint8Array {
    if (this.cellBiomes == null) {
      const biomes = new Uint8Array(CELL_COUNT);

      for (let cell = 0; cell < CELL_COUNT; cell++) {
        biomes[cell] = this.world.getCellBiome(
          worldCell(this.x, cell % CHUNK_CELLS),
          worldCell(this.y, Math.floor(cell / CHUNK_CELLS)),
        );
      }
      this.cellBiomes = biomes;
    }
    return this.cellBiomes;
  }

  private waterCells: Set<number> | null = null;

  /** Every cell of the chunk that is swum rather than walked */
  getWaterCells(): Set<number> {
    this.waterCells ??= this.cellsWhere('water');
    return this.waterCells;
  }

  private spotCells: Set<number> | null = null;

  /**
   * The cells that are the other ground: pools and rivers on a land
   * chunk, banks in a wetland. What counts as a spot depends on the
   * country the chunk is mostly in, since a spot is what the ground
   * around it is not
   */
  getSpotCells(): Set<number> {
    this.spotCells ??= this.cellsWhere(isWaterBiome(this.biome) ? 'ground' : 'water');
    return this.spotCells;
  }

  private rockCells: Set<number> | null = null;

  /**
   * The chunk's rock: where the world's stone field comes through the
   * surface. Nothing may stand in one and nothing walks through one
   */
  getRockCells(): Set<number> {
    this.rockCells ??= this.cellsWhere('wall');
    return this.rockCells;
  }

  private shallowCells: Set<number> | null = null;

  /**
   * The water drawn with the lighter shelf tiles: the ring at the
   * foot of every outcrop, and the water the rock is about to come
   * through. Purely a look, and only in the seas and the wetlands
   */
  getShallowCells(): Set<number> {
    if (this.shallowCells == null) {
      const cells = new Set<number>();

      for (const cell of this.getWaterCells()) {
        if (
          isShelfAt(
            this.world,
            worldCell(this.x, cell % CHUNK_CELLS),
            worldCell(this.y, Math.floor(cell / CHUNK_CELLS)),
          )
        ) {
          cells.add(cell);
        }
      }
      this.shallowCells = cells;
    }
    return this.shallowCells;
  }

  /**
   * Whether a fixture may stand on this cell: anything but rock, and
   * nothing with rock in reach, so nothing is ever placed against a
   * wall.
   *
   * The ring is read out of the world rather than out of the chunk. A
   * cell on the chunk's own edge has half its neighbours in the chunk
   * next door, and one placed against a ridge that begins over there
   * is walled in just the same
   */
  /** Whether this cell has been built on: a town lays out its own */
  isTownCell(cell: number): boolean {
    return isTownAt(
      this.world,
      worldCell(this.x, cell % CHUNK_CELLS),
      worldCell(this.y, Math.floor(cell / CHUNK_CELLS)),
    );
  }

  private readonly clear: (boolean | undefined)[] = new Array<boolean | undefined>(CELL_COUNT);

  private isClear(cell: number): boolean {
    const known = this.clear[cell];

    if (known != null) {
      return known;
    }

    const column = cell % CHUNK_CELLS;
    const row = Math.floor(cell / CHUNK_CELLS);
    const x = worldCell(this.x, column);
    const y = worldCell(this.y, row);
    let clear = this.getCellRole(cell) !== 'wall';

    for (let dy = -1; clear && dy <= 1; dy++) {
      for (let dx = -1; clear && dx <= 1; dx++) {
        if (dx === 0 && dy === 0) {
          continue;
        }

        const near = column + dx;
        const down = row + dy;
        // The chunk's own cells are kept as they are read; only the
        // ring that falls in the chunk next door costs a fresh look
        const role =
          near >= 0 && down >= 0 && near < CHUNK_CELLS && down < CHUNK_CELLS
            ? this.getCellRole(down * CHUNK_CELLS + near)
            : roleAt(this.world, x + dx, y + dy);

        clear = role !== 'wall';
      }
    }
    this.clear[cell] = clear;
    return clear;
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
        const landmarks = this.getLandmarkArea();
        const taken = new Set<number>();
        const order = shuffled(rng, centeredCells(PLACEMENT_AREA));

        for (let i = 0; i < count; i++) {
          // The draws land in pair order: the kind, then its cell
          const decoration = kinds[Math.floor(rng.random() * kinds.length)];
          // Scenery keeps to dry ground: nothing here grows out of the
          // water, so a chunk under a lake simply has less of it
          const cell = order.find(
            (candidate) =>
              !taken.has(candidate) &&
              !landmarks.has(candidate) &&
              this.getCellRole(candidate) === 'ground' &&
              this.isClear(candidate) &&
              // Nothing grows in the street: a town is swept, and its
              // scenery is the buildings on it
              !this.isTownCell(candidate),
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
   * The chunk's 5-8 landmarks (duplicates allowed, the singletons
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
      // Nothing stands in a rock's reach, and each biome rolls from a
      // pool without the landmarks that cannot be there
      const base = biomeLandmarks(this.biome);
      const order = shuffled(rng, centeredCells(PLACEMENT_AREA));
      const cells = new Map<number, Landmark>();
      const taken = new Set<number>();
      const rolled = new Set<Landmark>();
      // Whatever of the town falls in this chunk, laid before anything
      // is rolled: a town is planned and the country around it is not,
      // so the country fits round the town rather than the other way
      const town = townOverChunk(this.world, this.x, this.y);
      // The region's portal, wherever it fell: the middle of the plaza
      // in a town, and out in the country where the region has none
      const gate = portalCellIn(this.world, this.x, this.y);

      if (gate != null) {
        cells.set(gate, Landmark.Portal);
        taken.add(gate);
        for (const neighbor of neighborCells(gate)) {
          taken.add(neighbor);
        }
      }
      if (town != null) {
        for (const lot of getTownLots(this.world, town)) {
          const cellX = lot.x - worldCell(this.x, 0);
          const cellY = lot.y - worldCell(this.y, 0);

          if (cellX < 0 || cellY < 0 || cellX >= CHUNK_CELLS || cellY >= CHUNK_CELLS) {
            continue;
          }

          const cell = cellY * CHUNK_CELLS + cellX;

          cells.set(cell, lot.landmark);
          taken.add(cell);
          for (const neighbor of neighborCells(cell)) {
            taken.add(neighbor);
          }
        }
      }

      for (let i = 0; i < count; i++) {
        // The draws land in pair order: the landmark, then its cell.
        // A singleton already rolled leaves the pool for the rest of
        // the chunk: a second portal, gym or champion is never rolled
        const pool = base.filter((kind) => !(SINGLETON_LANDMARKS.has(kind) && rolled.has(kind)));
        const landmark = pool[Math.floor(rng.random() * pool.length)];
        // Everything that is a landmark now needs ground under it. The
        // one that did not was the phenomenon, which is no longer one:
        // something happening is rolled over the chunk by the hour
        // Nothing of the country is rolled onto a town's own ground:
        // what stands in a town is the town's to say
        const free = (candidate: number): boolean =>
          !taken.has(candidate) && this.isClear(candidate) && !this.isTownCell(candidate);
        // Dry ground first and the water only where there is none: a
        // landmark stands beside the pool rather than in it, and a
        // chunk one lake covers is stood on all the same rather than
        // left with nothing on it
        const cell =
          order.find((candidate) => free(candidate) && this.getCellRole(candidate) === 'ground') ??
          order.find(free);

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
