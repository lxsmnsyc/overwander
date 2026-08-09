import AleaRNG from '../core/alea';
import { getSpawnPool, pickSpawn } from '../data/biome';
import { getTimeOfDay } from '../data/ids/biome';
import type { Species } from '../data/ids/species';
import type Chunk from './chunk';

/**
 * One spawn roll: the species, the 32-bit seed that drives its
 * instance generation, and its level
 */
export type Spawn = [species: Species, seed: number, level: number];

const MIN_SPAWN_LEVEL = 5;
const MAX_SPAWN_LEVEL = 100;

/**
 * Snapshots quantize the day into 5-minute windows, so every
 * observer of a chunk within the same window shares one timestamp
 */
const SNAPSHOT_INTERVAL = 5 * 60 * 1000;

/**
 * A chunk observed at a point in time: the timestamp snaps back to
 * the last 5-minute boundary, giving each chunk a stable identity
 * per time window
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
   * Roll the snapshot's spawns from the biome's spawn pool for this
   * window's time of day, honoring the rarity bands and weights.
   * The first call fixes the result for the snapshot's lifetime;
   * later calls return the same spawns regardless of count
   */
  getSpawns(count: number): Spawn[] {
    if (this.spawns == null) {
      const pool = getSpawnPool(this.chunk.biome, getTimeOfDay(this.timestamp));
      const spawns: Spawn[] = [];

      for (let i = 0; i < count; i++) {
        const species = pickSpawn(pool, () => this.rng.random());

        if (species == null) {
          break;
        }

        const level =
          MIN_SPAWN_LEVEL + Math.floor(this.rng.random() * (MAX_SPAWN_LEVEL - MIN_SPAWN_LEVEL + 1));

        spawns.push([species, this.rng.int32(), level]);
      }
      this.spawns = spawns;
    }
    return this.spawns;
  }
}
