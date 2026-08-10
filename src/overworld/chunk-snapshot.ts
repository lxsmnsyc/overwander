import AleaRNG from '../core/alea';
import { boostFamilyWeights, getSpawnPool, isLegendarySpecies, pickSpawn } from '../data/biome';
import type { SpawnRarityGroups } from '../data/biome';
import { SPECIES_DAY_WEIGHT_BOOST, getFeaturedFamily } from '../data/species';
import { getTimeOfDay } from '../data/ids/biome';
import type { Items } from '../data/ids/items';
import type { Species } from '../data/ids/species';
import Landmark from '../data/overworld/landmark';
import type Chunk from './chunk';
import { CELL_COUNT, CHUNK_CELLS, SPAWN_AREA, centeredCells } from './chunk';
import type { GrottoReward } from './landmarks';
import { resolveBerryPatch, resolveHiddenGrotto, resolveItemCache } from './landmarks';

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
/**
 * How many pokemon a window holds for an ordinary walker. A lure adds
 * LURE_SPAWN_BONUS more on top, which the window always rolls so that
 * every player of the chunk shares one set of rolls
 */
export const SPAWN_COUNT = 6;

export const SNAPSHOT_INTERVAL = 5 * 60 * 1000;

/**
 * Legendary raids run on their own, far slower clock: a raid stands
 * for a full hour, long enough for players to gather a party, while
 * the spawns around it turn over twelve times
 */
export const RAID_INTERVAL = 60 * 60 * 1000;

/**
 * How often a shadow raid reaches past the biome's rare species and
 * stages a legendary instead — one draw in eight, the same odds the
 * rarer spawn bands run on
 */
export const SHADOW_RAID_LEGENDARY_CHANCE = 1 / 8;

/**
 * The legendary a raid lobby is staging, and the 32-bit trait value
 * its nature and ability derive from
 */
export interface RaidRoll {
  species: Species;
  traitValue: number;
}

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
   * The window's spawn pool with the species day applied: the day's
   * featured family carries four times its usual weight, so its
   * members crowd the rolls wherever they live
   */
  private getPool(): SpawnRarityGroups {
    const pool = getSpawnPool(this.chunk.biome, getTimeOfDay(this.timestamp));
    const featured = getFeaturedFamily(this.timestamp);

    return featured == null ? pool : boostFamilyWeights(pool, featured, SPECIES_DAY_WEIGHT_BOOST);
  }

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
      const pool = this.getPool();
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

  /**
   * The rolled spawns keyed by the cell they landed on, in roll
   * order — the same order getSpawns returns, so a caller can pair a
   * cell with the published spawn of that index. Empty until the
   * spawns roll
   */
  getSpawnCells(): Map<number, Spawn> {
    const placed = new Map<number, Spawn>();

    for (const spawn of this.spawns ?? []) {
      const cell = this.cells.indexOf(spawn);

      if (cell >= 0) {
        placed.set(cell, spawn);
      }
    }
    return placed;
  }

  private itemCaches: Map<number, Items> | null = null;

  /**
   * The window's item-cache rewards, keyed by the landmark cell.
   * Each ItemCache landmark rolls its reward from the chunk seed
   * and the window, so a cache is only acquirable while the window
   * lives — once expired, the next window regenerates a new reward
   */
  getItemCaches(): Map<number, Items> {
    if (this.itemCaches == null) {
      const caches = new Map<number, Items>();

      for (const [cell, landmark] of this.chunk.getLandmarkCells()) {
        if (landmark === Landmark.ItemCache) {
          const rng = new AleaRNG(`${this.chunk.seed}${this.timestamp}cache${cell}`);
          const item = resolveItemCache(() => rng.random());

          if (item != null) {
            caches.set(cell, item);
          }
        }
      }
      this.itemCaches = caches;
    }
    return this.itemCaches;
  }

  private berryPatches: Map<number, Items> | null = null;

  /**
   * The window's ripe berries, keyed by the landmark cell. A patch
   * fruits on the same 5-minute clock as an item cache: picked or
   * not, the next window grows something new
   */
  getBerryPatches(): Map<number, Items> {
    if (this.berryPatches == null) {
      const patches = new Map<number, Items>();

      for (const [cell, landmark] of this.chunk.getLandmarkCells()) {
        if (landmark === Landmark.BerryPatch) {
          const rng = new AleaRNG(`${this.chunk.seed}${this.timestamp}berry${cell}`);
          const berry = resolveBerryPatch(() => rng.random());

          if (berry != null) {
            patches.set(cell, berry);
          }
        }
      }
      this.berryPatches = patches;
    }
    return this.berryPatches;
  }

  /**
   * The hour-long window the chunk's raids belong to. Raids outlive
   * the 5-minute spawn window, so every snapshot taken within the
   * same hour stages the same legendary
   */
  get raidTimestamp(): number {
    return Math.floor(this.timestamp / RAID_INTERVAL) * RAID_INTERVAL;
  }

  private raids: Map<number, RaidRoll> | null = null;

  /**
   * The hour's legendary raids, keyed by the landmark cell. The
   * legendary is drawn from the biome's special tier for the raid
   * hour's time of day, so a chunk only stages what belongs there —
   * mythicals never appear, and a biome whose special tier holds no
   * legendary stages no raid at all
   */
  getLegendaryRaids(): Map<number, RaidRoll> {
    if (this.raids == null) {
      const raids = new Map<number, RaidRoll>();
      const pool = getSpawnPool(this.chunk.biome, getTimeOfDay(this.raidTimestamp));
      const legendaries = pool.special.filter((entry) => isLegendarySpecies(entry.species));

      if (legendaries.length > 0) {
        for (const [cell, landmark] of this.chunk.getLandmarkCells()) {
          if (landmark === Landmark.LegendaryRaid) {
            const rng = new AleaRNG(`${this.chunk.seed}${this.raidTimestamp}raid${cell}`);
            // The draws land in order: the legendary, then the trait
            // value its nature and ability derive from
            const entry = legendaries[Math.floor(rng.random() * legendaries.length)];

            raids.set(cell, { species: entry.species, traitValue: rng.int32() });
          }
        }
      }
      this.raids = raids;
    }
    return this.raids;
  }

  private shadowRaids: Map<number, RaidRoll> | null = null;

  /**
   * The hour's shadow raids, keyed by the landmark cell. A shadow
   * raid usually stages one of the biome's rare species, but one
   * draw in eight reaches the legendary pool instead — the same odds
   * the rarer bands use everywhere else. A cell with nothing to
   * stage in either pool holds no raid this hour
   */
  getShadowRaids(): Map<number, RaidRoll> {
    if (this.shadowRaids == null) {
      const raids = new Map<number, RaidRoll>();
      const pool = getSpawnPool(this.chunk.biome, getTimeOfDay(this.raidTimestamp));
      const legendaries = pool.special.filter((entry) => isLegendarySpecies(entry.species));

      for (const [cell, landmark] of this.chunk.getLandmarkCells()) {
        if (landmark !== Landmark.ShadowRaid) {
          continue;
        }

        const rng = new AleaRNG(`${this.chunk.seed}${this.raidTimestamp}shadow${cell}`);
        // The draws land in order: the pool, the species within it,
        // then the trait value its nature and ability derive from
        const legendary = rng.random() < SHADOW_RAID_LEGENDARY_CHANCE;
        const entries = legendary && legendaries.length > 0 ? legendaries : pool.rare;

        if (entries.length === 0) {
          continue;
        }

        const entry = entries[Math.floor(rng.random() * entries.length)];

        raids.set(cell, { species: entry.species, traitValue: rng.int32() });
      }
      this.shadowRaids = raids;
    }
    return this.shadowRaids;
  }

  private hiddenGrottos: Map<number, GrottoReward> | null = null;

  /**
   * The window's hidden-grotto rewards, keyed by the landmark cell.
   * Each HiddenGrotto landmark rolls its reward from the chunk seed
   * and the window — the pokemon branch draws from the biome's pool
   * for this window's time of day — so a grotto only yields while
   * the window lives; the next window regenerates a new reward
   */
  getHiddenGrottos(): Map<number, GrottoReward> {
    if (this.hiddenGrottos == null) {
      const grottos = new Map<number, GrottoReward>();
      const time = getTimeOfDay(this.timestamp);

      for (const [cell, landmark] of this.chunk.getLandmarkCells()) {
        if (landmark === Landmark.HiddenGrotto) {
          const rng = new AleaRNG(`${this.chunk.seed}${this.timestamp}grotto${cell}`);
          const reward = resolveHiddenGrotto(
            this.chunk.biome,
            time,
            () => rng.random(),
            getFeaturedFamily(this.timestamp),
          );

          if (reward != null) {
            grottos.set(cell, reward);
          }
        }
      }
      this.hiddenGrottos = grottos;
    }
    return this.hiddenGrottos;
  }
}
