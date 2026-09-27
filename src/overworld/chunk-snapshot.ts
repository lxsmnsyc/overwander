import { toZoneKey } from '../auth/local-time';
import AleaRNG from '../core/alea';
import {
  boostFamilyWeights,
  boostTypeWeights,
  getBiomeRoster,
  getSpawnPool,
  getTownPool,
  hasSpawnPool,
  pickSpawn,
  spawnBand,
  spawnRanks,
} from '../data/biome';
import type { SpawnRarityGroups } from '../data/biome';
import {
  SPECIES_DAY_WEIGHT_BOOST,
  TRUE_SHADOW_WEIGHT,
  getFeaturedFamily,
  getSeasonalCoat,
  getShoreForm,
  getWingPattern,
  listTrueShadows,
} from '../data/species';
import { SpawnSurface, TimeOfDay, getSeason, getTimeOfDay } from '../data/ids/biome';
import type Biome from '../data/ids/biome';
import type { Items } from '../data/ids/items';
import type { ItemStack } from '../data/overworld/item-pool';
import type { Species } from '../data/ids/species';
import { rollFossilOffer } from '../data/overworld/fossil';
import Landmark from '../data/overworld/landmark';
import type Lairs from '../data/overworld/lair';
import { getBiomeLairs, getLairResidents, pickLairSpecies } from '../data/overworld/lair';
import Npc, { EXECUTIVE_CHARSETS, type Executive, NPCS, npcSheets } from '../data/overworld/npc';
import {
  SYNDICATE_BOSS_CHARSETS,
  SYNDICATE_EXECUTIVES,
  SYNDICATE_GRUNT_CHARSETS,
  type Syndicate,
  getSyndicate,
} from '../data/overworld/syndicate';
import {
  BIOME_ELITE_MEMBERS,
  BIOME_GYM_LEADERS,
  CHAMPIONS,
  CHAMPION_CHARSETS,
  CHAMPION_PARTIES,
  type Champion,
  ELITE_MEMBER_CHARSETS,
  ELITE_MEMBER_SIGNATURES,
  EXPERT_PARTY_SIZE,
  type EliteMember,
  FRONTIER_BRAINS,
  FRONTIER_BRAIN_CHARSETS,
  FRONTIER_BRAIN_RULES,
  FRONTIER_TEAM_SIZE,
  type FrontierBrain,
  FrontierRule,
  GYM_LEADER_CHARSETS,
  GYM_LEADER_SIGNATURES,
  type GymLeader,
  LEGENDS,
  LEGEND_CHARSETS,
  LEGEND_PARTIES,
  type Legend,
  getFrontierParty as frontierParty,
  getEliteMemberRoster,
  getGymLeaderRoster,
  getRentalPool,
} from '../data/overworld/experts';
import {
  ACE_PARTY_SIZE,
  TRAINER_CHARSETS,
  TYPE_TRAINER_PARTY_MAX,
  TYPE_TRAINER_PARTY_MIN,
  type TrainerClass,
  getBiomeTrainers,
  getTrainerPool,
  isAceTrainer,
} from '../data/overworld/trainers';
import Phenomenon, { BIOME_PHENOMENA } from '../data/overworld/phenomenon';
import {
  VENDOR_KINDS,
  type VendorKind,
  rollChefStock,
  rollVendorStock,
} from '../data/overworld/vendor';
import Weather, {
  WEATHER_SPAWN_BOOST,
  favorsEverything,
  spawnFavoredTypes,
} from '../data/overworld/weather';
import getWorld from './current';
import type Chunk from './chunk';
import { canStageBoss } from './raid';
import { CELL_COUNT, CHUNK_CELLS, PLACEMENT_AREA, centeredCells } from './chunk';
import { Depth } from './depth';
import type { PhenomenonReward } from './landmarks';
import {
  resolveApricornColour,
  resolveApricornTree,
  resolveBerryPatch,
  resolveItemCache,
  resolveNest,
  resolvePhenomenon,
} from './landmarks';

/**
 * An expert's six: five rolled from their kind's band with
 * replacement, then the one pokemon they are remembered for. The
 * signature is last, so a challenger meets the rolled five before
 * the one they came for.
 *
 * With replacement because a band runs thin: Agatha's ghosts are two
 * species, and a doubled Gengar is what an elite's party looks like
 * anyway
 */
function expertParty(pool: Species[], signature: Species, seed: string): Spawn[] {
  const rng = new AleaRNG(seed);
  const party: Spawn[] = [];

  for (let at = 0; at < EXPERT_PARTY_SIZE - 1; at += 1) {
    const species = pool[Math.floor(rng.random() * pool.length)];

    party.push([species, rng.int32(), rng.int32()]);
  }
  party.push([signature, rng.int32(), rng.int32()]);
  return party;
}

/**
 * A party out of the crate: the species are drawn as well as the
 * values, which is what makes a rented three a rented three. With
 * replacement, since the crate is what it is and two of a kind is a
 * hand the house can deal
 */
function rentedParty(pool: Species[], size: number, seed: string): Spawn[] {
  const rng = new AleaRNG(seed);

  const party: Spawn[] = [];

  for (let at = 0; at < size; at += 1) {
    party.push([pool[Math.floor(rng.random() * pool.length)], rng.int32(), rng.int32()]);
  }
  return party;
}

/**
 * A named party rolled out: the species are the trainer's own, so
 * only the individual and trait values are drawn
 */
function signatureParty(species: Species[], seed: string): Spawn[] {
  const rng = new AleaRNG(seed);

  const party: Spawn[] = [];

  for (const one of species) {
    party.push([one, rng.int32(), rng.int32()]);
  }
  return party;
}

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
export const SPAWN_COUNT = 8;

/**
 * How often a Team Rocket stop is Giovanni himself rather than a
 * grunt: the rare band's own odds, so a walk remembers meeting him
 */
export const GIOVANNI_CHANCE = 1 / 64;

/**
 * How many a Team Rocket stop fields, whoever is standing there: a
 * full six against the player's six. What changes with the rank is
 * what the six are drawn from and what level they fight at
 */
export const ROCKET_PARTY_SIZE = 6;

/**
 * Who is standing at a Team Rocket cell this window. Rolled once per
 * cell from one draw, so the three are disjoint: the boss, then his
 * executives, then the rank and file who hold everything else
 */
const enum RocketRank {
  Grunt = 0,
  Executive = 1,
  Boss = 2,
}

export { RocketRank };

/** One window in eight puts an executive on the cell */
export const EXECUTIVE_CHANCE = 1 / 8;

/**
 * How often the seat at the top of a league holds a legend instead of
 * its champion: the same one window in sixty-four Giovanni turns up
 * on. Under a sky that favours everything it is every window, since
 * those four are the rarest weather in the game and a walk that finds
 * one should find what it is worth
 */
export const LEGEND_CHANCE = 1 / 64;

/** How many surfaces a pool key has to hold apart: land, water and ice */
const SURFACES = 3;

export const SNAPSHOT_INTERVAL = 5 * 60 * 1000;

/**
 * Nothing in a chunk turns over on one clock: a window is as long as
 * what it holds is worth. Every interval below is a multiple of
 * `SNAPSHOT_INTERVAL`, so a landmark never turns over halfway through
 * the window a player is standing in
 */

/**
 * What the ground gives up: item stashes and berry patches. Three
 * spawn windows rather than one, so a lap of a chunk is worth walking
 * and a lap of the same landmark is not
 */
export const LANDMARK_INTERVAL = 15 * 60 * 1000;

/**
 * Legendary and shadow raids. A raid stands for three hours: long
 * enough that a party can be gathered around one, rare enough that
 * the one standing in a chunk is worth travelling to
 */
export const RAID_INTERVAL = 3 * 60 * 60 * 1000;

/**
 * How long the same person stays at a wandering-NPC cell — a Team
 * Rocket grunt among them. One raid window: long enough that who is
 * standing there means something, short enough that hunting the one
 * a player needs is an afternoon rather than a day
 */
export const NPC_INTERVAL = 3 * 60 * 60 * 1000;

/**
 * A nest runs slower than anything else in a chunk: one egg every
 * twelve hours, which is one in the morning and one in the evening
 * for a player who walks the same ground twice a day. The window is
 * local, since the snapshot's clock already is
 */
export const NEST_INTERVAL = 12 * 60 * 60 * 1000;

/**
 * How long the same thing goes on at a phenomenon cell. An hour: long
 * enough that a player who saw dust rising can walk to it, short
 * enough that the cell is worth passing again on the way back — and
 * twelve spawn windows, so what is happening there outlives the
 * pokemon standing around it several times over
 */
export const PHENOMENON_INTERVAL = 60 * 60 * 1000;

/**
 * How long the sky holds. One hour, the same as a phenomenon: long
 * enough that a player who saw rain from the next chunk can walk into
 * it, short enough that the sky is worth looking at again
 */
export const WEATHER_INTERVAL = 60 * 60 * 1000;

/**
 * Which hour of sky a local timestamp falls in. Every reader of the
 * weather goes through here, so a map and the board cannot count the
 * hour two different ways
 */
export function weatherWindowOf(local: number): number {
  return Math.floor(local / WEATHER_INTERVAL);
}

/**
 * How many things may be going on in one chunk at once.
 *
 * Zero is deliberately in range: a chunk with nothing happening is
 * what makes one with a grotto in it worth noticing, and it is the
 * variance the old landmark roll had for free by not always rolling a
 * phenomenon cell
 */
export const MIN_PHENOMENA = 0;
export const MAX_PHENOMENA = 2;

/**
 * How often a shadow raid reaches past the biome's rare species and
 * stages a legendary instead — one draw in eight, the same odds the
 * rarer spawn bands run on
 */
export const SHADOW_RAID_LEGENDARY_CHANCE = 1 / 8;

/**
 * What a lair landmark is staging: the lair, who is at home in it, and
 * the trait value their nature and ability derive from. The lair is
 * null only for a shadow lair holding one of the biome's rare species,
 * which has no named place behind it
 */
export interface RaidRoll {
  lair: Lairs | null;
  species: Species;
  traitValue: number;
}

/**
 * A chunk observed at a point in time. The timestamp snaps back to the
 * last 5-minute boundary, and the window is **local**: the instant
 * comes from the server but is read in the observer's zone, so a
 * player walking at night meets the night pool.
 *
 * The zone seeds the chunk too, so it is one world per zone rather
 * than one world on several clocks. This class only derives from the
 * window and offset it is given; the canonical window comes from the
 * shared snapshot store
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

  /**
   * Which layer of the world this window is of. It rides beside the
   * zone wherever a call is made against a chunk, for the same reason
   * the zone does: the server has to derive the same chunk the client
   * was looking at, and the layer is half of saying which one that is
   */
  get depth(): Depth {
    return this.chunk.world.depth;
  }

  /**
   * What the ground of this chunk is keyed by. The zone is in it, the
   * same as the spawns: a stash is found in the player's own hour, so
   * two zones on one chunk see different ground as they see different
   * pokemon
   */
  get groundKey(): string {
    return this.key;
  }

  /** The ground's window of that length, on the zone's own clock */
  private groundWindow(interval: number): number {
    return Math.floor(this.timestamp / interval) * interval;
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
  /**
   * The sky this chunk is standing under, read off the shared world
   * rather than passed in.
   *
   * It has to be the same answer everywhere, since the pool it shapes
   * is derived on both sides and never exchanged, and the world is
   * the one thing both sides already agree on
   */
  get weather(): Weather {
    this.sky ??= getWorld().getWeather(this.chunk.x, this.chunk.y, this.weatherWindow);
    return this.sky;
  }

  private sky: Weather | null = null;

  /**
   * The sky the window's people were staged under.
   *
   * Weather turns over every hour and the people every three, so the
   * sky moves under a stop that does not. Anything about who is
   * standing at a cell reads this rather than `weather`: a stop
   * staged in one hour has to resolve as the same person in the next,
   * including on a server rebuilding the window from its timestamp
   */
  get npcWeather(): Weather {
    this.npcSky ??= getWorld().getWeather(
      this.chunk.x,
      this.chunk.y,
      weatherWindowOf(this.npcTimestamp),
    );
    return this.npcSky;
  }

  private npcSky: Weather | null = null;

  /**
   * The sky the window's raids were staged under, read at the raid
   * window rather than at the hour, for the same reason `npcWeather`
   * is: a raid staged under a dark day has to still be that raid an
   * hour later, including on a server rebuilding it from its timestamp
   */
  get raidWeather(): Weather {
    this.raidSky ??= getWorld().getWeather(
      this.chunk.x,
      this.chunk.y,
      Math.floor(this.raidTimestamp / WEATHER_INTERVAL),
    );
    return this.raidSky;
  }

  private raidSky: Weather | null = null;

  /**
   * What the window may roll, crowded by the two things that crowd it:
   * the featured family for the day, and the sky for the hour
   */
  private readonly pools = new Map<number, SpawnRarityGroups>();

  /**
   * The country a cell belongs to. A border runs through a chunk
   * wherever the climate puts it, so everything a player meets at a
   * cell reads this rather than `chunk.biome`, which is only the one
   * in the middle
   */
  biomeAt(cell: number): Biome {
    return this.chunk.getCellBiomes()[cell];
  }

  /** What a spawn on this cell may roll, crowded the same way */
  getCellPool(cell: number): SpawnRarityGroups {
    const biome = this.biomeAt(cell);
    const surface = this.drawnSurface(cell);
    // A chunk holds as many countries as its borders leave it with,
    // so the pools are kept per country and surface rather than one
    const key = biome * SURFACES + surface;
    let pool = this.pools.get(key);

    if (pool == null) {
      pool = this.crowd(
        this.darkened(
          getSpawnPool(biome, getTimeOfDay(this.timestamp), this.depth === Depth.Cave, surface),
        ),
      );
      this.pools.set(key, pool);
    }
    return pool;
  }

  /** The cell's surface, with ice that has no pool of its own walked like the land around it */
  private drawnSurface(cell: number): SpawnSurface {
    const surface = this.chunk.getCellSurface(cell);

    return surface === SpawnSurface.Ice && !hasSpawnPool(this.biomeAt(cell), SpawnSurface.Ice)
      ? SpawnSurface.Land
      : surface;
  }

  /** What a town's streets may roll this window, crowded the same way */
  private getStreetPool(): SpawnRarityGroups {
    return this.crowd(getTownPool(getTimeOfDay(this.timestamp)));
  }

  /**
   * The true shadows, which a dark day is the only way to meet. They
   * stand in the special band beside the legendaries, and under every
   * other sky they are not in the pool at all
   */
  private darkened(pool: SpawnRarityGroups): SpawnRarityGroups {
    if (this.weather !== Weather.DarkDay) {
      return pool;
    }
    const special = [...spawnBand(pool, 'special')];

    for (const species of listTrueShadows()) {
      special.push({ species, weight: TRUE_SHADOW_WEIGHT });
    }

    return { ...pool, special };
  }

  private crowd(pool: SpawnRarityGroups): SpawnRarityGroups {
    const featured = getFeaturedFamily(this.timestamp);
    const dayed =
      featured == null ? pool : boostFamilyWeights(pool, featured, SPECIES_DAY_WEIGHT_BOOST);

    return boostTypeWeights(dayed, spawnFavoredTypes(this.weather), WEATHER_SPAWN_BOOST);
  }

  /**
   * Roll the window's spawns for this time of day and place each on a
   * free cell: a town's streets from the town pool, the country around
   * them from the biome's.
   *
   * They are placed **last**, on whatever cell the chunk's own
   * furniture is not standing on. Spacing is the fixtures' rule and
   * not theirs: a pokemon keeps no ring of its own and takes none from
   * a landmark, since it is walked through rather than round and is
   * gone again in a few minutes. The first call fixes the result for
   * the snapshot's lifetime
   */
  getSpawns(count: number): Spawn[] {
    if (this.spawns == null) {
      const spawns: Spawn[] = [];
      // Nothing spawns inside solid rock, on a cliff's edge or in lava
      const occupied = new Set([
        ...this.chunk.getDecorationCells().keys(),
        ...this.chunk.getLandmarkCells().keys(),
        ...this.chunk.getRockCells(),
        ...this.chunk.getFaceCells(),
        ...this.chunk.getLavaCells(),
        // Whatever is going on this hour holds its ground too. The
        // hour is the slower clock, so it takes its cells first and
        // the pokemon fit around it; sharing one would put a spawn on
        // top of a dust cloud, and the spawn would answer the press
        ...this.getPhenomena().keys(),
      ]);
      const streets: number[] = [];
      const free: number[] = [];

      for (const cell of centeredCells(PLACEMENT_AREA)) {
        if (!occupied.has(cell)) {
          (this.chunk.isTownCell(cell) ? streets : free).push(cell);
        }
      }
      // Each roll takes the streets' share of the window in turn, so any
      // prefix of it a lure reveals keeps that share. A chunk no town
      // touches has no share and rolls exactly as the country always has
      const share = streets.length / Math.max(1, streets.length + free.length);
      let streetPool: SpawnRarityGroups | null = null;

      for (let i = 0; i < count && free.length + streets.length > 0; i++) {
        if (streets.length > 0 && Math.floor((i + 1) * share) > Math.floor(i * share)) {
          streetPool ??= this.getStreetPool();

          const found = pickSpawn(streetPool, () => this.rng.random());

          if (found == null) {
            continue;
          }

          const spawn: Spawn = [found, this.rng.int32(), this.rng.int32()];
          const [cell] = streets.splice(Math.floor(this.rng.random() * streets.length), 1);

          this.cells[cell] = spawn;
          spawns.push(spawn);
          continue;
        }
        if (free.length === 0) {
          continue;
        }

        // The cell is drawn first and its surface picks the pool, so a
        // pond rolls what swims and a sea's island what walks
        const [cell] = free.splice(Math.floor(this.rng.random() * free.length), 1);
        const rolled = pickSpawn(this.getCellPool(cell), () => this.rng.random());

        // Nothing lives on this surface here: the window is one lighter
        if (rolled == null) {
          continue;
        }

        // Which shell a Shellos wears is the world's own longitude,
        // so the two seas fall either side of the meridian rather
        // than either side of a pool. Which coat a Deerling wears is
        // the month, so it turns for everybody at once
        // Which shell a Shellos wears is the world's own longitude,
        // which coat a Deerling wears is the month, and which wings a
        // Vivillon wears is the country it came out in
        const shore = getShoreForm(rolled, this.chunk.x);
        const winged = getWingPattern(shore, this.chunk.biome);
        const species = getSeasonalCoat(winged, getSeason(this.timestamp));

        // The draws land in tuple order: individual value, then the
        // trait value
        const spawn: Spawn = [species, this.rng.int32(), this.rng.int32()];

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

  /**
   * The quarter-hour window the chunk's ground belongs to: what a
   * stash holds and what a patch grew. It outlives three spawn
   * windows, so a landmark picked clean stays picked clean while the
   * pokemon around it turn over
   */
  get landmarkTimestamp(): number {
    return this.groundWindow(LANDMARK_INTERVAL);
  }

  /**
   * Which hour of sky this chunk is standing under, counted rather
   * than stamped: the weather field is read at a point that walks with
   * the window, so what it wants is the number of windows rather than
   * the instant one began
   */
  get weatherWindow(): number {
    return weatherWindowOf(this.timestamp);
  }

  private itemCaches: Map<number, ItemStack[]> | null = null;

  /**
   * The window's item-cache stashes, keyed by the landmark cell. Each
   * ItemCache landmark rolls what it is holding from the chunk seed
   * and the landmark window, so a cache is only acquirable while that
   * window lives — once expired, the next one buries something else.
   *
   * A stash is up to three kinds of up to three pieces; a cell that
   * rolled nothing is left out entirely
   */
  getItemCaches(): Map<number, ItemStack[]> {
    if (this.itemCaches == null) {
      const caches = new Map<number, ItemStack[]>();

      for (const [cell, landmark] of this.chunk.getLandmarkCells()) {
        if (landmark === Landmark.ItemCache) {
          const rng = new AleaRNG(`${this.groundKey}${this.landmarkTimestamp}cache${cell}`);
          const stash = resolveItemCache(this.biomeAt(cell), () => rng.random());

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
   * on the same quarter-hour clock as an item cache: picked or not,
   * the next window grows something new
   */
  getBerryPatches(): Map<number, ItemStack> {
    if (this.berryPatches == null) {
      const patches = new Map<number, ItemStack>();

      for (const [cell, landmark] of this.chunk.getLandmarkCells()) {
        if (landmark === Landmark.BerryPatch) {
          const rng = new AleaRNG(`${this.groundKey}${this.landmarkTimestamp}berry${cell}`);
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
   * Which apricorn the tree at this cell bears, or null where the cell
   * holds no tree. A fixture of the chunk rather than the window's:
   * the tree is drawn in its own colour, and one that turned over
   * every quarter-hour would be a different tree each time
   */
  getApricornTree(cell: number): Items | null {
    if (this.chunk.getLandmarkCells().get(cell) !== Landmark.ApricornTree) {
      return null;
    }

    const rng = new AleaRNG(`${this.chunk.seed}apricorn${cell}`);

    return resolveApricornColour(() => rng.random());
  }

  private apricornTrees: Map<number, ItemStack> | null = null;

  /**
   * The window's ripe apricorns, keyed by the landmark cell: the
   * colour the tree bears and how many of them are on it. The crop
   * turns over on the same clock a berry patch fruits on
   */
  getApricornTrees(): Map<number, ItemStack> {
    if (this.apricornTrees == null) {
      const trees = new Map<number, ItemStack>();

      for (const [cell, landmark] of this.chunk.getLandmarkCells()) {
        if (landmark !== Landmark.ApricornTree) {
          continue;
        }

        const colour = new AleaRNG(`${this.chunk.seed}apricorn${cell}`);
        const crop = new AleaRNG(`${this.groundKey}${this.landmarkTimestamp}apricorn${cell}`);

        trees.set(
          cell,
          resolveApricornTree(
            () => colour.random(),
            () => crop.random(),
          ),
        );
      }
      this.apricornTrees = trees;
    }
    return this.apricornTrees;
  }

  /**
   * The three-hour window the chunk's raids belong to. A raid far
   * outlives the spawn window, so every snapshot taken within the
   * same stretch stages the same legendary and a party has time to
   * gather around it
   */
  get raidTimestamp(): number {
    return Math.floor(this.timestamp / RAID_INTERVAL) * RAID_INTERVAL;
  }

  private raids: Map<number, RaidRoll> | null = null;

  /**
   * The window's legendary lairs, keyed by the landmark cell.
   *
   * The draw is over the **lairs the biome can host**, not over the
   * legendaries in its spawn pool: a lair is a place, and the place
   * decides who is at home in it. A biome with no lair to its name
   * stages none — which is most of them, since a legendary the whole
   * world could walk to is not a legendary
   */
  getLegendaryLairs(): Map<number, RaidRoll> {
    if (this.raids == null) {
      const raids = new Map<number, RaidRoll>();
      const lairs = this.stageableLairs();

      if (lairs.length > 0) {
        for (const [cell, landmark] of this.chunk.getLandmarkCells()) {
          if (landmark === Landmark.LegendaryLair) {
            const rng = new AleaRNG(`${this.key}${this.raidTimestamp}raid${cell}`);
            // The draws land in order: the lair, then the trait value
            // its resident's nature and ability derive from
            const lair = lairs[Math.floor(rng.random() * lairs.length)];

            raids.set(cell, {
              lair,
              species: pickLairSpecies(lair, canStageBoss, rng.int32()),
              traitValue: rng.int32(),
            });
          }
        }
      }
      this.raids = raids;
    }
    return this.raids;
  }

  /** The biome's lairs with at least one resident a raid can stage */
  private stageableLairs(): Lairs[] {
    const lairs: Lairs[] = [];

    for (const lair of getBiomeLairs(this.chunk.biome)) {
      for (const resident of getLairResidents(lair)) {
        if (canStageBoss(resident)) {
          lairs.push(lair);
          break;
        }
      }
    }
    return lairs;
  }

  private shadowRaids: Map<number, RaidRoll> | null = null;

  /**
   * The window's shadow lairs, keyed by the landmark cell.
   *
   * A shadow lair usually holds one of the biome's rare species,
   * standing in no place in particular; one draw in eight takes over
   * one of the biome's own lairs instead — the same odds the rarer
   * bands run on everywhere else. Which of the two it is decides what
   * the raid is called, and the roll is the same either way. A cell
   * with nothing to stage on either side holds no raid this window
   */
  getShadowLairs(): Map<number, RaidRoll> {
    if (this.shadowRaids == null) {
      const raids = new Map<number, RaidRoll>();
      const pool = getBiomeRoster(this.chunk.biome, getTimeOfDay(this.raidTimestamp));
      const lairs = this.stageableLairs();
      const ranked = spawnRanks(pool)[2];
      const rare: typeof ranked = [];

      for (const entry of ranked) {
        // A species with nothing left to cast once the boss bans are
        // applied is no boss: it is left out of the draw rather than
        // staged with an empty move list
        if (canStageBoss(entry.species)) {
          rare.push(entry);
        }
      }

      // Under a dark day every shadow lair holds a true shadow instead,
      // so the sky is the one way to meet one and finding the sky is
      // enough: nothing else has to be drawn for. Held to the same boss
      // rule as every other draw, and with none left to stage the lair
      // falls back to an ordinary shadow raid rather than holding nothing
      const shadows: Species[] = [];

      if (this.raidWeather === Weather.DarkDay) {
        for (const species of listTrueShadows()) {
          if (canStageBoss(species)) {
            shadows.push(species);
          }
        }
      }

      for (const [cell, landmark] of this.chunk.getLandmarkCells()) {
        if (landmark !== Landmark.ShadowLair) {
          continue;
        }

        const rng = new AleaRNG(`${this.key}${this.raidTimestamp}shadow${cell}`);

        if (shadows.length > 0) {
          raids.set(cell, {
            lair: null,
            species: shadows[Math.floor(rng.random() * shadows.length)],
            traitValue: rng.int32(),
          });
          continue;
        }
        // The draws land in order: which side of the fork, the thing
        // within it, then the trait value its nature and ability
        // derive from
        const taken = rng.random() < SHADOW_RAID_LEGENDARY_CHANCE && lairs.length > 0;

        if (taken) {
          const lair = lairs[Math.floor(rng.random() * lairs.length)];

          raids.set(cell, {
            lair,
            species: pickLairSpecies(lair, canStageBoss, rng.int32()),
            traitValue: rng.int32(),
          });
          continue;
        }
        if (rare.length === 0) {
          continue;
        }

        const entry = rare[Math.floor(rng.random() * rare.length)];

        raids.set(cell, { lair: null, species: entry.species, traitValue: rng.int32() });
      }
      this.shadowRaids = raids;
    }
    return this.shadowRaids;
  }

  /**
   * The half-day window the chunk's nests belong to. A nest outlives
   * every other landmark in the chunk: the spawns around it turn over
   * a hundred and forty-four times before it holds a new egg
   */
  get nestTimestamp(): number {
    return this.groundWindow(NEST_INTERVAL);
  }

  private nests: Map<number, Species> | null = null;

  /**
   * The window's nests, keyed by the landmark cell: the species whose
   * egg is lying in each. It is drawn from the biome's ordinary bands
   * for the nest window's time of day and reduced to the first stage of
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

        const rng = new AleaRNG(`${this.groundKey}${this.nestTimestamp}nest${cell}`);
        const species = resolveNest(
          this.biomeAt(cell),
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

  /**
   * The window a wandering NPC's rounds belong to. Whoever is
   * standing at the cell stays there for 3 hours, a raid's own
   * window, and shorter than a nest
   */
  get npcTimestamp(): number {
    return Math.floor(this.timestamp / NPC_INTERVAL) * NPC_INTERVAL;
  }

  /**
   * The claim marker one visit to a wandering NPC writes: per tag,
   * cell and window, with the player as the row's other half. Derived
   * here so the server that takes the visit and the client that asks
   * whether it was taken spell it the same way
   */
  visitMarker(tag: string, cell: number): string {
    return `${this.key}@${this.npcTimestamp}$${tag}${cell}`;
  }

  /**
   * The claim marker one player's egg from one nest writes, per nest
   * window. Derived here for the same reason as `visitMarker`: the peek,
   * the claim and the board's ring all have to spell it the same way
   */
  nestMarker(cell: number): string {
    return `${this.groundKey}@${this.nestTimestamp}$nest${cell}`;
  }

  private wanderers: Map<number, Npc> | null = null;

  /**
   * Who is standing at each wandering-NPC cell this window. The cell
   * is the chunk's own, fixed forever like every landmark, but the
   * person on it is drawn afresh every 3 hours — so a player who
   * needs a breeder waits for one, or goes looking somewhere else.
   * The people who fight are not among the draws: Team Rocket and the
   * duelling trainer stand at landmarks of their own
   */
  getWanderingNpcs(): Map<number, Npc> {
    if (this.wanderers == null) {
      const wanderers = new Map<number, Npc>();

      for (const [cell, landmark] of this.chunk.getLandmarkCells()) {
        if (landmark !== Landmark.WanderingNpc) {
          continue;
        }

        const rng = new AleaRNG(`${this.key}${this.npcTimestamp}npc${cell}`);

        wanderers.set(cell, NPCS[Math.floor(rng.random() * NPCS.length)]);
      }
      this.wanderers = wanderers;
    }
    return this.wanderers;
  }

  /**
   * Who is standing at this cell, wherever they came from: the
   * window's wanderer, or one of the two whose place is fixed rather
   * than rolled, the vendor at his stall and Nurse Joy at her
   * counter. Everything that asks "is this person really there" asks
   * this, so the server's refusal and the board's offer agree
   */
  getStandingNpc(cell: number): Npc | null {
    const landmark = this.chunk.getLandmarkCells().get(cell);

    if (landmark === Landmark.Market) {
      return Npc.Vendor;
    }
    if (landmark === Landmark.PokemonCenter) {
      return Npc.NurseJoy;
    }
    return this.getWanderingNpcs().get(cell) ?? null;
  }

  private coats: Map<number, string> | null = null;

  /**
   * The style everyone standing at a people landmark turned up in, by
   * cell: one roll over their own wardrobe, so a figure both packs
   * drew wears either. The coat is the window's the way the person
   * is, and every observer of the window sees the same one. A Team
   * Rocket stop that rolled the boss wears Giovanni
   */
  getWandererCoats(): Map<number, string> {
    if (this.coats == null) {
      const coats = new Map<number, string>();
      const dress = (cell: number, wardrobe: string[]): void => {
        const rng = new AleaRNG(`${this.key}${this.npcTimestamp}coat${cell}`);

        coats.set(cell, wardrobe[Math.floor(rng.random() * wardrobe.length)]);
      };

      for (const [cell, npc] of this.getWanderingNpcs()) {
        dress(cell, npcSheets(npc));
      }
      for (const [cell, landmark] of this.chunk.getLandmarkCells()) {
        if (landmark === Landmark.Trainer) {
          const trainer = this.getTrainerClass(cell);

          dress(cell, trainer == null ? npcSheets(Npc.Trainer) : TRAINER_CHARSETS[trainer]);
        } else if (landmark === Landmark.TeamRocket) {
          const syndicate = this.getSyndicate();
          const executive = this.getRocketExecutive(cell);

          if (this.isRocketBoss(cell)) {
            dress(cell, SYNDICATE_BOSS_CHARSETS[syndicate]);
          } else if (executive == null) {
            dress(cell, SYNDICATE_GRUNT_CHARSETS[syndicate]);
          } else {
            dress(cell, EXECUTIVE_CHARSETS[executive]);
          }
        } else if (landmark === Landmark.GymLeader) {
          const leader = this.getGymLeader(cell);

          if (leader != null) {
            dress(cell, GYM_LEADER_CHARSETS[leader]);
          }
        } else if (landmark === Landmark.EliteFour) {
          const member = this.getEliteMember(cell);

          if (member != null) {
            dress(cell, ELITE_MEMBER_CHARSETS[member]);
          }
        } else if (landmark === Landmark.Champion) {
          const legend = this.getLegend(cell);
          const champion = legend == null ? this.getChampion(cell) : null;

          if (legend != null) {
            dress(cell, LEGEND_CHARSETS[legend]);
          } else if (champion != null) {
            dress(cell, CHAMPION_CHARSETS[champion]);
          }
        } else if (landmark === Landmark.FrontierBrain) {
          const brain = this.getFrontierBrain(cell);

          if (brain != null) {
            dress(cell, FRONTIER_BRAIN_CHARSETS[brain]);
          }
        } else if (landmark === Landmark.Market) {
          dress(cell, npcSheets(Npc.Vendor));
        } else if (landmark === Landmark.PokemonCenter) {
          dress(cell, npcSheets(Npc.NurseJoy));
        }
      }
      this.coats = coats;
    }
    return this.coats;
  }

  /**
   * Who is barring this Team Rocket cell this window, or null where
   * the cell is not one. One draw settles all three ranks, so they
   * cannot overlap: the boss at one in sixty-four, an executive at
   * one in eight, and a grunt the rest of the time
   */
  getRocketRank(cell: number): RocketRank | null {
    if (this.chunk.getLandmarkCells().get(cell) !== Landmark.TeamRocket) {
      return null;
    }

    const rolled = new AleaRNG(`${this.key}${this.npcTimestamp}boss${cell}`).random();

    if (rolled < GIOVANNI_CHANCE) {
      return RocketRank.Boss;
    }
    return rolled < GIOVANNI_CHANCE + EXECUTIVE_CHANCE ? RocketRank.Executive : RocketRank.Grunt;
  }

  /**
   * Which organisation keeps the crime landmark in this chunk. A
   * fixture of the biome rather than a roll: the coast is Team
   * Aqua's every window, and the volcanoes are Team Magma's
   */
  getSyndicate(): Syndicate {
    return getSyndicate(this.chunk.biome);
  }

  /**
   * Which of that team's executives it is, once the rank says one is
   * standing there. Rolled apart from the rank, so a team with two
   * of them is no likelier to field one than a team with four
   */
  getRocketExecutive(cell: number): Executive | null {
    if (this.getRocketRank(cell) !== RocketRank.Executive) {
      return null;
    }

    const rng = new AleaRNG(`${this.key}${this.npcTimestamp}executive${cell}`);
    const roster = SYNDICATE_EXECUTIVES[this.getSyndicate()];

    return roster[Math.floor(rng.random() * roster.length)] ?? null;
  }

  /** Whether this Team Rocket stop rolled the boss himself */
  isRocketBoss(cell: number): boolean {
    return this.getRocketRank(cell) === RocketRank.Boss;
  }

  /**
   * The biome's bands a fighting stop draws from, weakest first. A
   * biome asleep at this hour still patrols: the window's own pool
   * first, then the other periods in a fixed order, so a fight drawn
   * on night tundra fields the tundra's daytime residents instead of
   * standing there unfightable. A thin band borrows from the
   * commonest one that is not empty; null when the pool has nothing
   * at all
   */
  private readonly bands = new Map<Biome, SpawnRarityGroups['base'][] | null>();

  private fightBands(biome: Biome): SpawnRarityGroups['base'][] | null {
    const held = this.bands.get(biome);

    if (held !== undefined) {
      return held;
    }

    const found = this.readFightBands(biome);

    this.bands.set(biome, found);
    return found;
  }

  private readFightBands(biome: Biome): SpawnRarityGroups['base'][] | null {
    const times = [
      getTimeOfDay(this.npcTimestamp),
      TimeOfDay.Morning,
      TimeOfDay.Day,
      TimeOfDay.Evening,
      TimeOfDay.Night,
    ];

    for (const time of times) {
      const pool = getBiomeRoster(biome, time);
      const bands = spawnRanks(pool);
      let stocked: SpawnRarityGroups['base'] | undefined;

      for (const band of bands) {
        if (band.length > 0) {
          stocked = band;
          break;
        }
      }
      if (stocked != null) {
        const filled: SpawnRarityGroups['base'][] = [];

        for (const band of bands) {
          filled.push(band.length > 0 ? band : stocked);
        }
        return filled;
      }
    }
    return null;
  }

  private rocketStops: Map<number, Spawn[]> | null = null;

  /**
   * The window's Team Rocket stops, keyed by their landmark cell.
   * Everybody fields six, weakest first, and the rank says out of
   * what: a grunt takes one commoner, two of the uncommon band and
   * three of the rare, an executive takes six of the rare band, and
   * Giovanni takes five of it and the legendary of a lair this biome
   * hosts, or a sixth rare where it hosts none. Each draw carries its
   * own rolls but no level, which the fight fixes for the party
   */
  getRocketStops(): Map<number, Spawn[]> {
    if (this.rocketStops == null) {
      const stops = new Map<number, Spawn[]>();

      for (const [cell, landmark] of this.chunk.getLandmarkCells()) {
        if (landmark !== Landmark.TeamRocket) {
          continue;
        }

        const fielded = this.fightBands(this.biomeAt(cell));

        if (fielded != null) {
          const rng = new AleaRNG(`${this.key}${this.npcTimestamp}rocket${cell}`);
          const draw = (band: SpawnRarityGroups['base']): Spawn => {
            const entry = band[Math.floor(rng.random() * band.length)];

            return [entry.species, rng.int32(), rng.int32()];
          };
          const drawMany = (band: SpawnRarityGroups['base'], size: number): Spawn[] => {
            const party: Spawn[] = [];

            for (let at = 0; at < size; at += 1) {
              party.push(draw(band));
            }
            return party;
          };

          const [commons, uncommons, rares] = fielded;
          const rank = this.getRocketRank(cell);

          if (rank === RocketRank.Boss) {
            // The ground they are standing on, and nowhere else: a
            // lair is a place, so a biome that hosts none has no
            // legendary to have been taken from it and the boss
            // fields a sixth rare
            const homes = getBiomeLairs(this.biomeAt(cell));
            const party = drawMany(rares, ROCKET_PARTY_SIZE - 1);

            if (homes.length > 0) {
              const lair = homes[Math.floor(rng.random() * homes.length)];

              party.push([
                pickLairSpecies(lair, () => true, rng.int32()),
                rng.int32(),
                rng.int32(),
              ]);
            } else {
              party.push(draw(rares));
            }
            stops.set(cell, party);
          } else if (rank === RocketRank.Executive) {
            stops.set(cell, drawMany(rares, ROCKET_PARTY_SIZE));
          } else {
            // Weakest first, and two out of each of the biome's three
            // bands: a grunt is the one rank that reaches the whole
            // pool rather than the top of it, which is what makes the
            // commonest fight in the world the only way to meet some
            // of what lives there
            stops.set(cell, [
              draw(commons),
              draw(commons),
              draw(uncommons),
              draw(uncommons),
              draw(rares),
              draw(rares),
            ]);
          }
        }
      }
      this.rocketStops = stops;
    }
    return this.rocketStops;
  }

  /**
   * Who is duelling at this cell this window, or null where the cell
   * holds no duelling landmark. The class turns over with the window
   * the way a grunt's party does, and it is drawn from what this
   * country puts on the road: a Swimmer stands on the water and a
   * Hiker on hard ground, with the Ace anywhere there is ground. Out
   * on the open sea it is the seafarers among them and nobody else
   */
  getTrainerClass(cell: number): TrainerClass | null {
    if (this.chunk.getLandmarkCells().get(cell) !== Landmark.Trainer) {
      return null;
    }

    const standing = getBiomeTrainers(this.biomeAt(cell));
    const rng = new AleaRNG(`${this.key}${this.npcTimestamp}duellist${cell}`);

    return standing[Math.floor(rng.random() * standing.length)] ?? null;
  }

  private trainerStops: Map<number, Spawn[]> | null = null;

  /**
   * The window's duelling trainers, keyed by their landmark cell. The
   * class decides the party: an Ace fields 5 of anything fully grown,
   * a type expert 3 to 5 of their own type. Neither is the biome's
   * business — a trainer walked here — and neither is a shadow
   */
  getTrainerStops(): Map<number, Spawn[]> {
    if (this.trainerStops == null) {
      const stops = new Map<number, Spawn[]>();

      for (const [cell, landmark] of this.chunk.getLandmarkCells()) {
        if (landmark !== Landmark.Trainer) {
          continue;
        }

        const trainer = this.getTrainerClass(cell);

        if (trainer == null) {
          continue;
        }

        const pool = getTrainerPool(trainer);

        if (pool.length === 0) {
          continue;
        }

        const rng = new AleaRNG(`${this.key}${this.npcTimestamp}duel${cell}`);
        const size = isAceTrainer(trainer)
          ? ACE_PARTY_SIZE
          : TYPE_TRAINER_PARTY_MIN +
            Math.floor(rng.random() * (TYPE_TRAINER_PARTY_MAX - TYPE_TRAINER_PARTY_MIN + 1));

        // Drawn with replacement, as an expert's party is: a Kanto
        // type runs as thin as one fully-grown species, and a
        // Channeler with three Gengar is exactly right
        const party: Spawn[] = [];

        for (let at = 0; at < size; at += 1) {
          const species = pool[Math.floor(rng.random() * pool.length)];

          party.push([species, rng.int32(), rng.int32()]);
        }
        stops.set(cell, party);
      }
      this.trainerStops = stops;
    }
    return this.trainerStops;
  }

  /**
   * Which gym leader keeps the gym at this cell, or null when the
   * cell holds no gym. The biome names the candidates — every gym in
   * fire country is a fire gym, so a player hunting one badge knows
   * which country to walk — and the chunk's own fixture roll picks
   * among the leaders who share it, the same one every visit
   */
  getGymLeader(cell: number): GymLeader | null {
    if (this.chunk.getLandmarkCells().get(cell) !== Landmark.GymLeader) {
      return null;
    }

    const seated = BIOME_GYM_LEADERS[this.chunk.biome];
    const rng = new AleaRNG(`${this.chunk.seed}leader${cell}`);

    return seated[Math.floor(rng.random() * seated.length)] ?? null;
  }

  /**
   * Which of the Elite Four holds this cell, or null. The biome
   * names the candidates the way it does for the gyms, and the
   * fixture roll seats one of them for good
   */
  getEliteMember(cell: number): EliteMember | null {
    if (this.chunk.getLandmarkCells().get(cell) !== Landmark.EliteFour) {
      return null;
    }

    const seated = BIOME_ELITE_MEMBERS[this.chunk.biome];
    const rng = new AleaRNG(`${this.chunk.seed}elite${cell}`);

    return seated[Math.floor(rng.random() * seated.length)] ?? null;
  }

  private gymStops: Map<number, Spawn[]> | null = null;

  /**
   * The window's gym parties, keyed by their landmark cell: five of
   * the resident leader's own type re-drawn each window, and their
   * signature standing last however the five roll. Blue's gym has no
   * type and draws its five from the whole band
   */
  getGymStops(): Map<number, Spawn[]> {
    if (this.gymStops == null) {
      const stops = new Map<number, Spawn[]>();

      for (const [cell, landmark] of this.chunk.getLandmarkCells()) {
        if (landmark !== Landmark.GymLeader) {
          continue;
        }

        const leader = this.getGymLeader(cell);

        if (leader == null) {
          continue;
        }

        const pool = getGymLeaderRoster(leader);

        if (pool.length > 0) {
          stops.set(
            cell,
            expertParty(
              pool,
              GYM_LEADER_SIGNATURES[leader],
              `${this.key}${this.npcTimestamp}gym${cell}`,
            ),
          );
        }
      }
      this.gymStops = stops;
    }
    return this.gymStops;
  }

  private eliteStops: Map<number, Spawn[]> | null = null;

  /**
   * The window's Elite Four parties, keyed by their landmark cell:
   * five of the resident member's own kind, and their signature last
   */
  getEliteStops(): Map<number, Spawn[]> {
    if (this.eliteStops == null) {
      const stops = new Map<number, Spawn[]>();

      for (const [cell, landmark] of this.chunk.getLandmarkCells()) {
        if (landmark !== Landmark.EliteFour) {
          continue;
        }

        const member = this.getEliteMember(cell);

        if (member == null) {
          continue;
        }

        const pool = getEliteMemberRoster(member);

        if (pool.length > 0) {
          stops.set(
            cell,
            expertParty(
              pool,
              ELITE_MEMBER_SIGNATURES[member],
              `${this.key}${this.npcTimestamp}elite${cell}`,
            ),
          );
        }
      }
      this.eliteStops = stops;
    }
    return this.eliteStops;
  }

  /**
   * Which champion holds the seat at this cell, or null when the cell
   * holds none. A league rather than a country decides who a champion
   * is, so unlike the gyms this is a plain fixture roll over the
   * champions there are, fixed for the cell the way a gym's leader is
   */
  getChampion(cell: number): Champion | null {
    if (this.chunk.getLandmarkCells().get(cell) !== Landmark.Champion) {
      return null;
    }

    const rng = new AleaRNG(`${this.chunk.seed}champion${cell}`);

    return CHAMPIONS[Math.floor(rng.random() * CHAMPIONS.length)] ?? null;
  }

  /**
   * Which Brain keeps the facility at this cell, or null when the
   * cell holds none. A facility is a building rather than a country,
   * so which house stands here is a plain fixture roll, fixed for the
   * cell the way a gym's leader is
   */
  getFrontierBrain(cell: number): FrontierBrain | null {
    if (this.chunk.getLandmarkCells().get(cell) !== Landmark.FrontierBrain) {
      return null;
    }

    const rng = new AleaRNG(`${this.chunk.seed}frontier${cell}`);

    return FRONTIER_BRAINS[Math.floor(rng.random() * FRONTIER_BRAINS.length)] ?? null;
  }

  private readonly frontierStops = new Map<string, Spawn[]>();

  /**
   * What the facility at this cell fields, or null where the cell
   * keeps none.
   *
   * `gold` is whether the challenger already holds this house's
   * silver symbol, which is what brings the Brain's second three out;
   * it is the caller's question, since a chunk is the same for
   * everybody and a badge case is not
   */
  getFrontierStop(cell: number, gold = false): Spawn[] | null {
    const brain = this.getFrontierBrain(cell);

    if (brain == null) {
      return null;
    }

    const key = `${cell}:${gold ? 'gold' : 'silver'}`;
    const held = this.frontierStops.get(key);

    if (held != null) {
      return held;
    }

    const seed = `${this.key}${this.npcTimestamp}frontier${key}`;
    const named = frontierParty(brain, gold);
    // The Dome names nobody in advance: its three are drawn against
    // the challenger's once those are frozen, which is a question a
    // chunk cannot answer
    if (
      FRONTIER_BRAIN_RULES[brain] === FrontierRule.Countered ||
      FRONTIER_BRAIN_RULES[brain] === FrontierRule.Singled
    ) {
      this.frontierStops.set(key, []);
      return [];
    }

    // A house with no party of its own rents like everybody else:
    // the Factory's keeper draws three out of the crate
    const party =
      named.length > 0
        ? signatureParty(named, seed)
        : rentedParty(getRentalPool(), FRONTIER_TEAM_SIZE, seed);

    this.frontierStops.set(key, party);
    return party;
  }

  /**
   * Which legend has taken the seat at this cell this window, or null
   * for the windows the champion keeps it. A window roll rather than
   * a fixture: the seat is the champion's, and a legend is only ever
   * passing through
   */
  getLegend(cell: number): Legend | null {
    if (this.chunk.getLandmarkCells().get(cell) !== Landmark.Champion) {
      return null;
    }

    const rng = new AleaRNG(`${this.key}${this.npcTimestamp}legend${cell}`);
    const rolled = rng.random();

    if (!favorsEverything(this.npcWeather) && rolled >= LEGEND_CHANCE) {
      return null;
    }
    return LEGENDS[Math.floor(rng.random() * LEGENDS.length)] ?? null;
  }

  private championStops: Map<number, Spawn[]> | null = null;

  /**
   * The window's Champion parties, keyed by their landmark cell: the
   * champion's own named six, no shadows, the hardest fair fight there
   * is, or the legend's own six on the windows one has the seat. Only
   * what drives their rolls turns over with the window; the team
   * itself does not
   */
  getChampionStops(): Map<number, Spawn[]> {
    if (this.championStops == null) {
      const stops = new Map<number, Spawn[]>();

      for (const [cell, landmark] of this.chunk.getLandmarkCells()) {
        if (landmark !== Landmark.Champion) {
          continue;
        }

        const legend = this.getLegend(cell);

        if (legend != null) {
          stops.set(
            cell,
            signatureParty(LEGEND_PARTIES[legend], `${this.key}${this.npcTimestamp}legend${cell}`),
          );
          continue;
        }

        const champion = this.getChampion(cell);

        if (champion != null) {
          stops.set(
            cell,
            signatureParty(
              CHAMPION_PARTIES[champion],
              `${this.key}${this.npcTimestamp}champ${cell}`,
            ),
          );
        }
      }
      this.championStops = stops;
    }
    return this.championStops;
  }

  /**
   * Which counter the vendor at this cell set up this window, or null
   * when somebody else is standing there. Rolled apart from the crate,
   * so a new shelf added to the list does not reshuffle every crate
   */
  getVendorKind(cell: number): VendorKind | null {
    if (this.getStandingNpc(cell) !== Npc.Vendor) {
      return null;
    }

    const rng = new AleaRNG(`${this.key}${this.npcTimestamp}counter${cell}`);

    return VENDOR_KINDS[Math.floor(rng.random() * VENDOR_KINDS.length)];
  }

  /**
   * What the trader at this cell is carrying — the vendor's crate of
   * whichever counter he rolled, or the chef's larder — or an empty
   * crate when nobody who sells is standing there.
   *
   * It is drawn from the same seed the person was drawn from, so the
   * crate is part of who walked up rather than something stored: every
   * player who reaches this trader this window is offered the same
   * things, and the next window brings a different one with a
   * different crate. How many things that is belongs to the counter:
   * the machine stall lays out a dozen where the rest carry six
   */
  getVendorStock(cell: number): Items[] {
    const standing = this.getStandingNpc(cell);

    if (standing !== Npc.Vendor && standing !== Npc.Chef) {
      return [];
    }

    const rng = new AleaRNG(`${this.key}${this.npcTimestamp}wares${cell}`);

    return standing === Npc.Chef
      ? rollChefStock(() => rng.random())
      : rollVendorStock(() => rng.random(), this.getVendorKind(cell) ?? undefined);
  }

  /**
   * Which two fossils the maniac at this cell is carrying, or nothing
   * at all when somebody else is standing there.
   *
   * Derived the way the vendor's crate is, and for the same reason:
   * what he has is part of who walked up rather than something
   * stored, so every player who reaches him this window is offered
   * the same two — and the next window brings somebody with a
   * different pair
   */
  getFossilOffer(cell: number): Items[] {
    if (this.getWanderingNpcs().get(cell) !== Npc.FossilManiac) {
      return [];
    }

    const rng = new AleaRNG(`${this.key}${this.npcTimestamp}fossils${cell}`);

    return rollFossilOffer(() => rng.random());
  }

  /**
   * The hour a phenomenon belongs to. Every other landmark window is
   * either the quarter-hour of the ground or a matter of hours; this
   * one sits between them, because what is going on at a cell is an
   * event rather than a thing lying there
   */
  get phenomenonTimestamp(): number {
    return this.groundWindow(PHENOMENON_INTERVAL);
  }

  private phenomena: Map<number, Phenomenon> | null = null;

  /**
   * What is going on in the chunk this hour, and where.
   *
   * A phenomenon is **not a landmark**. Everything else a player walks
   * up to is a place — a stall, a nest, a lair, a board — and stays
   * where the chunk seed put it forever. Something happening is not a
   * place, so it is rolled over the chunk's free ground by the hour
   * and is somewhere else the next one. A chunk a player knows is
   * still worth re-reading.
   *
   * It rides its **own** generator rather than the snapshot's. That
   * one is a sequential stream the spawn roll draws from, and taking
   * draws out of it here would shift every pokemon in the world.
   *
   * The hour is the clock, not the five-minute window the pokemon
   * keep: the claim marker and the startled pokemon's rolls are both
   * named for `(chunk, hour, cell)`, so a cell that moved inside the
   * hour would be a second claim on the same event
   */
  getPhenomena(): Map<number, Phenomenon> {
    if (this.phenomena == null) {
      const showing = new Map<number, Phenomenon>();
      const rng = new AleaRNG(`${this.groundKey}${this.phenomenonTimestamp}happenings`);
      const count = MIN_PHENOMENA + Math.floor(rng.random() * (MAX_PHENOMENA - MIN_PHENOMENA + 1));
      // A phenomenon may stand in water where a landmark may not: the
      // water rippling is one of the four. What it may not do is stand
      // on somebody's stall, in a rock, inside a tree, on a cliff or in lava
      const occupied = new Set([
        ...this.chunk.getDecorationCells().keys(),
        ...this.chunk.getLandmarkCells().keys(),
        ...this.chunk.getRockCells(),
        ...this.chunk.getFaceCells(),
        ...this.chunk.getLavaCells(),
      ]);
      const water = this.chunk.getWaterCells();
      // Standing on water — in a pool, or at sea off the banks — the
      // only thing that can be going on is the water itself
      const afloat = (cell: number): boolean => water.has(cell);
      // ...and water is the only thing that ripples, so the rest of
      // the cell's own list is what dry ground can show. A beach hosts
      // both, and a ripple on its sand was the sea in the wrong place
      const overhead = new Map<Biome, boolean>();
      // Something passing over is over the water too, so a pond shows
      // a shadow as readily as the grass around it
      const fliesOver = (cell: number): boolean => {
        const biome = this.biomeAt(cell);
        const held = overhead.get(biome);

        if (held != null) {
          return held;
        }

        const flies = BIOME_PHENOMENA[biome].includes(Phenomenon.FlyingShadow);

        overhead.set(biome, flies);
        return flies;
      };
      // What the water can show: the water itself, and a shadow over
      // it where the country has one. A country with neither still
      // ripples, since water is what it is
      const wet = (cell: number): Phenomenon[] => {
        const kinds: Phenomenon[] = [];

        if (BIOME_PHENOMENA[this.biomeAt(cell)].includes(Phenomenon.RipplingWater)) {
          kinds.push(Phenomenon.RipplingWater);
        }
        if (fliesOver(cell)) {
          kinds.push(Phenomenon.FlyingShadow);
        }
        return kinds.length > 0 ? kinds : [Phenomenon.RipplingWater];
      };
      const dried = new Map<Biome, Phenomenon[]>();
      const dryAt = (cell: number): Phenomenon[] => {
        const biome = this.biomeAt(cell);
        const held = dried.get(biome);

        if (held != null) {
          return held;
        }

        const dry: Phenomenon[] = [];

        for (const kind of BIOME_PHENOMENA[biome]) {
          if (kind !== Phenomenon.RipplingWater) {
            dry.push(kind);
          }
        }
        dried.set(biome, dry);
        return dry;
      };
      const open: number[] = [];

      for (const cell of centeredCells(PLACEMENT_AREA)) {
        if (
          !occupied.has(cell) &&
          !this.chunk.isTownCell(cell) &&
          BIOME_PHENOMENA[this.biomeAt(cell)].length > 0
        ) {
          open.push(cell);
        }
      }
      // Dry ground first, so the biome's own are actually seen. A
      // wetland is mostly water, and rolling it flat would make every
      // marsh ripple and no marsh ever hide a grotto. A biome with
      // nothing but ripples in it goes the other way: its islands show
      // nothing, since nothing else happens there
      const ground: number[] = [];
      // A shadow passes over the water as readily as over the grass,
      // so those cells stand beside the dry ones rather than behind
      // them. Only a shadow does: a ripple is the water on its own,
      // and taking every wet cell would leave a marsh doing nothing
      // but ripple
      const flown: number[] = [];

      for (const cell of open) {
        if (!afloat(cell)) {
          if (dryAt(cell).length > 0) {
            ground.push(cell);
          }
        } else if (fliesOver(cell)) {
          flown.push(cell);
        }
      }

      const free: number[] = [...ground, ...flown];

      if (free.length === 0) {
        for (const cell of open) {
          if (afloat(cell)) {
            free.push(cell);
          }
        }
      }

      for (let at = 0; at < count && free.length > 0; at++) {
        const [cell] = free.splice(Math.floor(rng.random() * free.length), 1);

        const dry = dryAt(cell);

        if (afloat(cell)) {
          const kinds = wet(cell);

          showing.set(cell, kinds[Math.floor(rng.random() * kinds.length)]);
          continue;
        }
        showing.set(cell, dry[Math.floor(rng.random() * dry.length)]);
      }
      this.phenomena = showing;
    }
    return this.phenomena;
  }

  /**
   * What the phenomenon at this cell turns out to be, or null when
   * nothing is going on there — or when the biome had nothing in the
   * bands it draws from.
   *
   * It is resolved per cell rather than for the whole chunk at once:
   * a player only ever walks into one of them, and the roll is seeded
   * so that every visitor of that cell this hour finds the same thing
   */
  getPhenomenonReward(cell: number): PhenomenonReward | null {
    const phenomenon = this.getPhenomena().get(cell);

    if (phenomenon == null) {
      return null;
    }

    const rng = new AleaRNG(`${this.groundKey}${this.phenomenonTimestamp}happening${cell}`);

    const reward = resolvePhenomenon(
      phenomenon,
      this.biomeAt(cell),
      getTimeOfDay(this.phenomenonTimestamp),
      () => rng.random(),
      getFeaturedFamily(this.phenomenonTimestamp),
      // Only a ripple is the water's; the rest are over dry ground
      phenomenon === Phenomenon.RipplingWater ? this.drawnSurface(cell) : SpawnSurface.Land,
    );

    // A pokemon out of a phenomenon answers the meridian too
    return reward?.kind === 'pokemon'
      ? {
          ...reward,
          species: getWingPattern(getShoreForm(reward.species, this.chunk.x), this.chunk.biome),
        }
      : reward;
  }
}
