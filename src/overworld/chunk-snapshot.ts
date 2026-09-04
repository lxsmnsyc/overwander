import { asOffset, toZoneKey } from '../auth/local-time';
import AleaRNG from '../core/alea';
import { boostFamilyWeights, boostTypeWeights, getSpawnPool, pickSpawn } from '../data/biome';
import type { SpawnRarityGroups } from '../data/biome';
import { SPECIES_DAY_WEIGHT_BOOST, getFeaturedFamily } from '../data/species';
import { TimeOfDay, getTimeOfDay, isWaterBiome } from '../data/ids/biome';
import type { Items } from '../data/ids/items';
import type { ItemStack } from '../data/overworld/item-pool';
import { Species } from '../data/ids/species';
import { rollFossilOffer } from '../data/overworld/fossil';
import Landmark from '../data/overworld/landmark';
import type Lairs from '../data/overworld/lair';
import {
  EVERY_STAGED_LAIR,
  getBiomeLairs,
  getLairResidents,
  pickLairSpecies,
} from '../data/overworld/lair';
import Npc, {
  GIOVANNI_CHARSETS,
  NPCS,
  ROCKET_EXECUTIVES,
  ROCKET_EXECUTIVE_CHARSETS,
  type RocketExecutive,
  npcSheets,
} from '../data/overworld/npc';
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
  GYM_LEADER_CHARSETS,
  GYM_LEADER_SIGNATURES,
  type GymLeader,
  LEGENDS,
  LEGEND_CHARSETS,
  LEGEND_PARTIES,
  type Legend,
  getEliteMemberRoster,
  getGymLeaderRoster,
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
import type Weather from '../data/overworld/weather';
import {
  WEATHER_SPAWN_BOOST,
  favorsEverything,
  spawnFavoredTypes,
} from '../data/overworld/weather';
import getWorld from './current';
import type Chunk from './chunk';
import { canStageBoss } from './raid';
import { CELL_COUNT, CHUNK_CELLS, PLACEMENT_AREA, centeredCells, neighborCells } from './chunk';
import { getPortalCell } from './portal';
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
  const rolled = Array.from({ length: EXPERT_PARTY_SIZE - 1 }, (): Spawn => {
    const species = pool[Math.floor(rng.random() * pool.length)];

    return [species, rng.int32(), rng.int32()];
  });

  return [...rolled, [signature, rng.int32(), rng.int32()]];
}

/**
 * A named party rolled out: the species are the trainer's own, so
 * only the individual and trait values are drawn
 */
function signatureParty(species: Species[], seed: string): Spawn[] {
  const rng = new AleaRNG(seed);

  return species.map((one): Spawn => [one, rng.int32(), rng.int32()]);
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
 * How often a portal has its keeper standing beside it: Porygon, the
 * made pokemon, lives in the portal network rather than in any
 * biome's wild pool
 */
export const PORTAL_KEEPER_CHANCE = 1 / 8;

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
  Giovanni = 2,
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
   * What the **ground** of this chunk is keyed by: the chunk alone,
   * with no zone in it.
   *
   * Spawns are a zone's own — the pokemon out at dusk are out at dusk
   * where the player is standing — but what is buried under a chunk is
   * not. A zone in this key made the same cache roll again for every
   * zone it was asked in, and made the claim that empties it a
   * different claim each time, which is a stash a caller could dig up
   * once per zone by saying it was somewhere else
   */
  get groundKey(): string {
    return this.chunk.seed;
  }

  /**
   * The instant this window began, as UTC rather than as the zone's
   * own wall clock. Every zone reading the same chunk at the same
   * moment answers the same number, which is what lets the ground be
   * shared
   */
  private get instant(): number {
    return this.timestamp - asOffset(this.offset) * 60_000;
  }

  /** The ground's window of that length, counted from UTC */
  private groundWindow(interval: number): number {
    return Math.floor(this.instant / interval) * interval;
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
      Math.floor(this.npcTimestamp / WEATHER_INTERVAL),
    );
    return this.npcSky;
  }

  private npcSky: Weather | null = null;

  /**
   * What the window may roll, crowded by the two things that crowd it:
   * the featured family for the day, and the sky for the hour
   */
  private getPool(): SpawnRarityGroups {
    const pool = getSpawnPool(this.chunk.biome, getTimeOfDay(this.timestamp));
    const featured = getFeaturedFamily(this.timestamp);
    const dayed =
      featured == null ? pool : boostFamilyWeights(pool, featured, SPECIES_DAY_WEIGHT_BOOST);

    return boostTypeWeights(dayed, spawnFavoredTypes(this.weather), WEATHER_SPAWN_BOOST);
  }

  /**
   * Roll the window's spawns from the biome pool for this time of day
   * and place each on a free cell.
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
      const pool = this.getPool();
      const spawns: Spawn[] = [];
      // Nothing spawns inside solid rock; a pool is fine, since a
      // pokemon in the water is a pokemon in the water
      const occupied = new Set([
        ...this.chunk.getDecorationCells().keys(),
        ...this.chunk.getLandmarkCells().keys(),
        ...this.chunk.getRockCells(),
        // Whatever is going on this hour holds its ground too. The
        // hour is the slower clock, so it takes its cells first and
        // the pokemon fit around it; sharing one would put a spawn on
        // top of a dust cloud, and the spawn would answer the press
        ...this.getPhenomena().keys(),
      ]);
      const free = centeredCells(PLACEMENT_AREA).filter((cell) => !occupied.has(cell));

      // The portal's keeper rolls before the pool does, so it is the
      // first published spawn and every player sees it, lure or none
      const portal = getPortalCell(this.chunk);

      if (portal != null && this.rng.random() < PORTAL_KEEPER_CHANCE) {
        const open = new Set(free);
        const beside = neighborCells(portal).filter((cell) => open.has(cell));

        if (beside.length > 0) {
          const spawn: Spawn = [Species.Porygon, this.rng.int32(), this.rng.int32()];
          const cell = beside[Math.floor(this.rng.random() * beside.length)];

          free.splice(free.indexOf(cell), 1);
          this.cells[cell] = spawn;
          spawns.push(spawn);
        }
      }

      // The keeper counts against the window, so a portal chunk never
      // publishes more rolls than any other
      for (let i = spawns.length; i < count && free.length > 0; i++) {
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
    return Math.floor(this.timestamp / WEATHER_INTERVAL);
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
      const lairs = getBiomeLairs(this.chunk.biome).filter((lair) =>
        getLairResidents(lair).some(canStageBoss),
      );

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
      const pool = getSpawnPool(this.chunk.biome, getTimeOfDay(this.raidTimestamp));
      const lairs = getBiomeLairs(this.chunk.biome).filter((lair) =>
        getLairResidents(lair).some(canStageBoss),
      );
      // A species with nothing left to cast once the boss bans are
      // applied is no boss: it is left out of the draw rather than
      // staged with an empty move list
      const rare = pool.rare.filter((entry) => canStageBoss(entry.species));

      for (const [cell, landmark] of this.chunk.getLandmarkCells()) {
        if (landmark !== Landmark.ShadowLair) {
          continue;
        }

        const rng = new AleaRNG(`${this.key}${this.raidTimestamp}shadow${cell}`);
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
   * window's wanderer, or the vendor whose stall is fixed to a Market
   * cell. Everything that asks "is this person really there" asks
   * this, so the server's refusal and the board's offer agree
   */
  getStandingNpc(cell: number): Npc | null {
    if (this.chunk.getLandmarkCells().get(cell) === Landmark.Market) {
      return Npc.Vendor;
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
          const executive = this.getRocketExecutive(cell);

          if (this.isRocketBoss(cell)) {
            dress(cell, GIOVANNI_CHARSETS);
          } else if (executive == null) {
            dress(cell, npcSheets(Npc.RocketGrunt));
          } else {
            dress(cell, ROCKET_EXECUTIVE_CHARSETS[executive]);
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
        } else if (landmark === Landmark.Market) {
          dress(cell, npcSheets(Npc.Vendor));
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
      return RocketRank.Giovanni;
    }
    return rolled < GIOVANNI_CHANCE + EXECUTIVE_CHANCE ? RocketRank.Executive : RocketRank.Grunt;
  }

  /**
   * Which of the four executives it is, once the rank says one is
   * standing there. Rolled apart from the rank, so adding a fifth
   * does not move anybody's odds of meeting one at all
   */
  getRocketExecutive(cell: number): RocketExecutive | null {
    if (this.getRocketRank(cell) !== RocketRank.Executive) {
      return null;
    }

    const rng = new AleaRNG(`${this.key}${this.npcTimestamp}executive${cell}`);

    return ROCKET_EXECUTIVES[Math.floor(rng.random() * ROCKET_EXECUTIVES.length)] ?? null;
  }

  /** Whether this Team Rocket stop rolled the boss himself */
  isRocketBoss(cell: number): boolean {
    return this.getRocketRank(cell) === RocketRank.Giovanni;
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
  private fightBands(): SpawnRarityGroups['base'][] | null {
    const times = [
      getTimeOfDay(this.npcTimestamp),
      TimeOfDay.Morning,
      TimeOfDay.Day,
      TimeOfDay.Evening,
      TimeOfDay.Night,
    ];

    for (const time of times) {
      const pool = getSpawnPool(this.chunk.biome, time);
      const bands = [pool.base, pool.uncommon, pool.rare];
      const stocked = bands.find((band) => band.length > 0);

      if (stocked != null) {
        return bands.map((band) => (band.length > 0 ? band : stocked));
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
   * Giovanni takes five of it and a legendary — the biome's own lair
   * where it has one, any lair at all where it does not. Each draw
   * carries its own rolls but no level, which the fight fixes for the
   * party
   */
  getRocketStops(): Map<number, Spawn[]> {
    if (this.rocketStops == null) {
      const stops = new Map<number, Spawn[]>();
      const fielded = this.fightBands();

      if (fielded != null) {
        for (const [cell, landmark] of this.chunk.getLandmarkCells()) {
          if (landmark !== Landmark.TeamRocket) {
            continue;
          }

          const rng = new AleaRNG(`${this.key}${this.npcTimestamp}rocket${cell}`);
          const draw = (band: SpawnRarityGroups['base']): Spawn => {
            const entry = band[Math.floor(rng.random() * band.length)];

            return [entry.species, rng.int32(), rng.int32()];
          };

          const [commons, uncommons, rares] = fielded;
          const rank = this.getRocketRank(cell);

          if (rank === RocketRank.Giovanni) {
            const lairs = getBiomeLairs(this.chunk.biome);
            // Any lair the world stages, never a mythical's: nothing
            // but its relic ever calls one of those out
            const homes = lairs.length > 0 ? lairs : EVERY_STAGED_LAIR;
            const lair = homes[Math.floor(rng.random() * homes.length)];
            const party = Array.from({ length: ROCKET_PARTY_SIZE - 1 }, () => draw(rares));

            party.push([pickLairSpecies(lair, () => true, rng.int32()), rng.int32(), rng.int32()]);
            stops.set(cell, party);
          } else if (rank === RocketRank.Executive) {
            stops.set(
              cell,
              Array.from({ length: ROCKET_PARTY_SIZE }, () => draw(rares)),
            );
          } else {
            // Weakest first, which is also the half a beaten grunt
            // hands over: the commoner and the two uncommons, never
            // the three they were actually fighting with
            stops.set(cell, [
              draw(commons),
              draw(uncommons),
              draw(uncommons),
              draw(rares),
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
   * Hiker on hard ground, with the Ace anywhere at all
   */
  getTrainerClass(cell: number): TrainerClass | null {
    if (this.chunk.getLandmarkCells().get(cell) !== Landmark.Trainer) {
      return null;
    }

    const standing = getBiomeTrainers(this.chunk.biome);
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

        stops.set(
          cell,
          // Drawn with replacement, as an expert's party is: a Kanto
          // type runs as thin as one fully-grown species, and a
          // Channeler with three Gengar is exactly right
          Array.from({ length: size }, (): Spawn => {
            const species = pool[Math.floor(rng.random() * pool.length)];

            return [species, rng.int32(), rng.int32()];
          }),
        );
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
   * player who reaches this trader this window is offered the same six
   * things, and the next window brings a different one with a
   * different crate
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
      const kinds = BIOME_PHENOMENA[this.chunk.biome];

      if (kinds.length === 0) {
        this.phenomena = showing;
        return showing;
      }

      const rng = new AleaRNG(`${this.groundKey}${this.phenomenonTimestamp}happenings`);
      const count = MIN_PHENOMENA + Math.floor(rng.random() * (MAX_PHENOMENA - MIN_PHENOMENA + 1));
      // A phenomenon may stand in water where a landmark may not: the
      // water rippling is one of the four. What it may not do is stand
      // on somebody's stall, in a rock, or inside a tree
      const occupied = new Set([
        ...this.chunk.getDecorationCells().keys(),
        ...this.chunk.getLandmarkCells().keys(),
        ...this.chunk.getRockCells(),
      ]);
      const spots = this.chunk.getSpotCells();
      const flooded = isWaterBiome(this.chunk.biome);
      // Standing on water — in a pool, or at sea off the banks — the
      // only thing that can be going on is the water itself
      const afloat = (cell: number): boolean => flooded !== spots.has(cell);
      // ...and water is the only thing that ripples, so the rest of
      // the biome's list is what dry ground can show. A beach hosts
      // both, and a ripple on its sand was the sea in the wrong place
      const dry = kinds.filter((kind) => kind !== Phenomenon.RipplingWater);
      const open = centeredCells(PLACEMENT_AREA).filter((cell) => !occupied.has(cell));
      // Dry ground first, so the biome's own are actually seen. A
      // wetland is mostly water, and rolling it flat would make every
      // marsh ripple and no marsh ever hide a grotto. A biome with
      // nothing but ripples in it goes the other way: its islands show
      // nothing, since nothing else happens there
      const ground = dry.length === 0 ? [] : open.filter((cell) => !afloat(cell));
      const free = ground.length > 0 ? ground : open.filter(afloat);

      for (let at = 0; at < count && free.length > 0; at++) {
        const [cell] = free.splice(Math.floor(rng.random() * free.length), 1);

        showing.set(
          cell,
          afloat(cell) ? Phenomenon.RipplingWater : dry[Math.floor(rng.random() * dry.length)],
        );
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

    return resolvePhenomenon(
      phenomenon,
      this.chunk.biome,
      getTimeOfDay(this.phenomenonTimestamp),
      () => rng.random(),
      getFeaturedFamily(this.phenomenonTimestamp),
    );
  }
}
