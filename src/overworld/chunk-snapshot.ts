import AleaRNG from '../core/alea';
import { getSpawnPool, pickSpawn } from '../data/biome';
import { getTimeOfDay } from '../data/ids/biome';
import type { Species } from '../data/ids/species';
import type Chunk from './chunk';
import { CELL_COUNT, CHUNK_CELLS, SPAWN_AREA, centeredCells } from './chunk';

/**
 * One spawn roll: the species, the 32-bit individual value that
 * drives its IVs, and the 32-bit trait value whose four 8-bit
 * slices drive its level, gender, ability and nature
 */
export type Spawn = [species: Species, individualValue: number, traitValue: number];

/**
 * Snapshots quantize the day into 5-minute windows, so every
 * observer of a chunk within the same window shares one timestamp
 */
export const SNAPSHOT_INTERVAL = 5 * 60 * 1000;

/**
 * A chunk observed at a point in time: the timestamp snaps back to
 * the last 5-minute boundary, giving each chunk a stable identity
 * per time window. The canonical timestamp comes from the shared
 * snapshot store (fixed once server-side per window), never from a
 * player's local clock — this class only derives deterministically
 * from whatever window it is given
 */
export default class ChunkSnapshot {
  /**
   * Milliseconds, floored to the last 5-minute boundary
   */
  readonly timestamp: number;

  /**
   * Seeded by chunk and window, so every observer of the same chunk
   * in the same window rolls the same sequence
   */
  readonly rng: AleaRNG;

  constructor(
    public readonly chunk: Chunk,
    timestamp: number,
  ) {
    this.timestamp = Math.floor(timestamp / SNAPSHOT_INTERVAL) * SNAPSHOT_INTERVAL;
    this.rng = new AleaRNG(`${chunk.seed}${this.timestamp}`);
  }

  private spawns: Spawn[] | null = null;

  /**
   * Cell occupancy, row-major; filled when the spawns roll
   */
  private readonly cells: (Spawn | null)[] = new Array<Spawn | null>(CELL_COUNT).fill(null);

  /**
   * Roll the snapshot's spawns from the biome's spawn pool for this
   * window's time of day, honoring the rarity bands and weights, and
   * place each on its own free cell within the central 12x12 — the
   * chunk's landmark cells are pre-occupied and never receive
   * spawns, and the outer ring stays clear so a player entering
   * from an edge meets nothing immediately. The first call fixes the
   * result for the snapshot's lifetime; later calls return the same
   * spawns regardless of count
   */
  getSpawns(count: number): Spawn[] {
    if (this.spawns == null) {
      const pool = getSpawnPool(this.chunk.biome, getTimeOfDay(this.timestamp));
      const spawns: Spawn[] = [];
      const occupied = this.chunk.getLandmarkCells();
      const free = centeredCells(SPAWN_AREA).filter((cell) => !occupied.has(cell));

      for (let i = 0; i < count && free.length > 0; i++) {
        const species = pickSpawn(pool, () => this.rng.random());

        if (species == null) {
          break;
        }

        // The draws land in tuple order: individual value, then the
        // trait value, then the cell placement
        const spawn: Spawn = [species, this.rng.int32(), this.rng.int32()];
        const [cell] = free.splice(Math.floor(this.rng.random() * free.length), 1);

        this.cells[cell] = spawn;
        spawns.push(spawn);
      }
      this.spawns = spawns;
    }
    return this.spawns;
  }

  /**
   * The spawn occupying the given cell, if any; cells are empty
   * until the spawns roll
   */
  getSpawnAt(cellX: number, cellY: number): Spawn | null {
    return this.cells[cellY * CHUNK_CELLS + cellX] ?? null;
  }
}
