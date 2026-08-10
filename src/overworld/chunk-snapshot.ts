import { toZoneKey } from '../auth/local-time';
import AleaRNG from '../core/alea';
import { boostFamilyWeights, getSpawnPool, isLegendarySpecies, pickSpawn } from '../data/biome';
import type { SpawnRarityGroups } from '../data/biome';
import { SPECIES_DAY_WEIGHT_BOOST, getFeaturedFamily } from '../data/species';
import { getTimeOfDay } from '../data/ids/biome';
import type { ItemStack } from '../data/overworld/item-pool';
import type { Species } from '../data/ids/species';
import Landmark from '../data/overworld/landmark';
import type Npc from '../data/overworld/npc';
import { NPCS } from '../data/overworld/npc';
import type Chunk from './chunk';
import { CELL_COUNT, CHUNK_CELLS, SPAWN_AREA, centeredCells } from './chunk';
import type { GrottoReward } from './landmarks';
import { resolveBerryPatch, resolveHiddenGrotto, resolveItemCache, resolveNest } from './landmarks';

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
 * A nest runs slower than anything else in a chunk: one egg per
 * local day. Its window is the player's own calendar day, since the
 * snapshot's clock is already local — a nest refills at midnight
 * where the player is standing
 */
export const NEST_INTERVAL = 24 * 60 * 60 * 1000;

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
 * per time window. The window is **local** — the instant behind it
 * comes from the server, but it is read in the observer's own zone,
 * so a player walking at night meets what the night pool holds.
 *
 * The zone is part of the seed as well as the window, so a chunk is
 * not one world seen from several clocks but one per zone: what a
 * player in UTC+8 finds there says nothing about what a player in
 * UTC-5 will find, however the two line up their hours. The canonical
 * window still comes from the shared snapshot store rather than a
 * device's own reading; this class only derives deterministically
 * from whatever window and offset it is given
 */
export default class ChunkSnapshot {
  /**
   * Local milliseconds, floored to the last 5-minute boundary
   */
  readonly timestamp: number;

  /**
   * Seeded by chunk, zone and window, so every observer of the same
   * chunk in the same zone and window rolls the same sequence — and
   * no observer outside that zone rolls it at all
   */
  readonly rng: AleaRNG;

  /**
   * The chunk and zone together, which is what every seed and stored
   * key in this world is scoped by
   */
  readonly key: string;

  constructor(
    public readonly chunk: Chunk,
    timestamp: number,
    /**
     * Minutes east of UTC; zero is the world as UTC sees it
     */
    public readonly offset = 0,
  ) {
    this.timestamp = Math.floor(timestamp / SNAPSHOT_INTERVAL) * SNAPSHOT_INTERVAL;
    this.key = `${chunk.seed}${toZoneKey(offset)}`;
    this.rng = new AleaRNG(`${this.key}${this.timestamp}`);
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
      // A landmark and the ring around it are both out: the ring is
      // the room a player has to walk up to one, and a pokemon
      // standing in it would be met on the way rather than chosen
      const occupied = this.chunk.getLandmarkArea();
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

  private itemCaches: Map<number, ItemStack[]> | null = null;

  /**
   * The window's item-cache stashes, keyed by the landmark cell. Each
   * ItemCache landmark rolls what it is holding from the chunk seed
   * and the window, so a cache is only acquirable while the window
   * lives — once expired, the next window buries something else.
   *
   * A stash is up to three kinds of up to three pieces; a cell that
   * rolled nothing is left out entirely
   */
  getItemCaches(): Map<number, ItemStack[]> {
    if (this.itemCaches == null) {
      const caches = new Map<number, ItemStack[]>();

      for (const [cell, landmark] of this.chunk.getLandmarkCells()) {
        if (landmark === Landmark.ItemCache) {
          const rng = new AleaRNG(`${this.key}${this.timestamp}cache${cell}`);
          const stash = resolveItemCache(() => rng.random());

          if (stash.length > 0) {
            caches.set(cell, stash);
          }
        }
      }
      this.itemCaches = caches;
    }
    return this.itemCaches;
  }

  private berryPatches: Map<number, ItemStack> | null = null;

  /**
   * The window's ripe berries, keyed by the landmark cell: the kind
   * each patch grew and how much of it is on the bush. A patch fruits
   * on the same 5-minute clock as an item cache: picked or not, the
   * next window grows something new
   */
  getBerryPatches(): Map<number, ItemStack> {
    if (this.berryPatches == null) {
      const patches = new Map<number, ItemStack>();

      for (const [cell, landmark] of this.chunk.getLandmarkCells()) {
        if (landmark === Landmark.BerryPatch) {
          const rng = new AleaRNG(`${this.key}${this.timestamp}berry${cell}`);
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
            const rng = new AleaRNG(`${this.key}${this.raidTimestamp}raid${cell}`);
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

        const rng = new AleaRNG(`${this.key}${this.raidTimestamp}shadow${cell}`);
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

  private rocketStops: Map<number, Spawn[]> | null = null;

  /**
   * The hour's Team Rocket stops, keyed by the landmark cell: the
   * three pokemon the grunt standing there fights with, drawn one
   * from each of the biome's base, uncommon and rare bands for the
   * raid hour's time of day.
   *
   * A band the biome leaves empty at this hour falls back to the
   * nearest one that has anything — a grunt three pokemon short is no
   * grunt at all, and somewhere thin should still be patrolled. Only
   * a pool with nothing awake in it stages nobody.
   *
   * Each draw carries its own individual and trait values, so the
   * grunt's team is as varied as any wild pokemon; what it does not
   * carry is a level, which the fight fixes for all three
   */
  getRocketStops(): Map<number, Spawn[]> {
    if (this.rocketStops == null) {
      const stops = new Map<number, Spawn[]>();
      const pool = getSpawnPool(this.chunk.biome, getTimeOfDay(this.raidTimestamp));
      const bands = [pool.base, pool.uncommon, pool.rare];
      // Weakest first, so the party reads the way it is fought; a
      // thin band borrows from the commonest one that is not empty
      const stocked = bands.find((band) => band.length > 0);

      if (stocked != null) {
        const fielded = bands.map((band) => (band.length > 0 ? band : stocked));

        for (const [cell, landmark] of this.chunk.getLandmarkCells()) {
          if (landmark !== Landmark.TeamRocketStop) {
            continue;
          }

          const rng = new AleaRNG(`${this.key}${this.raidTimestamp}rocket${cell}`);

          stops.set(
            cell,
            fielded.map((band): Spawn => {
              const entry = band[Math.floor(rng.random() * band.length)];

              return [entry.species, rng.int32(), rng.int32()];
            }),
          );
        }
      }
      this.rocketStops = stops;
    }
    return this.rocketStops;
  }

  /**
   * The day-long window the chunk's nests belong to. A nest outlives
   * every other landmark in the chunk: the spawns around it turn over
   * two hundred and eighty-eight times before it holds a new egg
   */
  get nestTimestamp(): number {
    return Math.floor(this.timestamp / NEST_INTERVAL) * NEST_INTERVAL;
  }

  private nests: Map<number, Species> | null = null;

  /**
   * The day's nests, keyed by the landmark cell: the species whose
   * egg is lying in each. It is drawn from the biome's ordinary bands
   * for the nest day's time of day and reduced to the first stage of
   * its line — a nest holds what hatches, not what it grows into —
   * and the special tier is left out, so no nest ever holds a
   * legendary
   */
  getNests(): Map<number, Species> {
    if (this.nests == null) {
      const nests = new Map<number, Species>();
      const time = getTimeOfDay(this.nestTimestamp);

      for (const [cell, landmark] of this.chunk.getLandmarkCells()) {
        if (landmark !== Landmark.Nest) {
          continue;
        }

        const rng = new AleaRNG(`${this.key}${this.nestTimestamp}nest${cell}`);
        const species = resolveNest(
          this.chunk.biome,
          time,
          () => rng.random(),
          getFeaturedFamily(this.nestTimestamp),
        );

        if (species != null) {
          nests.set(cell, species);
        }
      }
      this.nests = nests;
    }
    return this.nests;
  }

  private wanderers: Map<number, Npc> | null = null;

  /**
   * Who is standing at each wandering-NPC cell this hour. The cell is
   * the chunk's own, fixed forever like every landmark, but the
   * person on it is drawn afresh each raid hour — so a player who
   * needs a breeder waits for one, or goes looking somewhere else
   */
  getWanderingNpcs(): Map<number, Npc> {
    if (this.wanderers == null) {
      const wanderers = new Map<number, Npc>();

      for (const [cell, landmark] of this.chunk.getLandmarkCells()) {
        if (landmark !== Landmark.WanderingNpc) {
          continue;
        }

        const rng = new AleaRNG(`${this.key}${this.raidTimestamp}npc${cell}`);

        wanderers.set(cell, NPCS[Math.floor(rng.random() * NPCS.length)]);
      }
      this.wanderers = wanderers;
    }
    return this.wanderers;
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
          const rng = new AleaRNG(`${this.key}${this.timestamp}grotto${cell}`);
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
