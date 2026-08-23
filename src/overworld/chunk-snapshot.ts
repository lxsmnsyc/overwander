import { toZoneKey } from '../auth/local-time';
import AleaRNG from '../core/alea';
import { boostFamilyWeights, getSpawnPool, pickSpawn } from '../data/biome';
import type { SpawnRarityGroups } from '../data/biome';
import { SPECIES_DAY_WEIGHT_BOOST, getFeaturedFamily } from '../data/species';
import { TimeOfDay, getTimeOfDay } from '../data/ids/biome';
import type { Items } from '../data/ids/items';
import type { ItemStack } from '../data/overworld/item-pool';
import type { Species } from '../data/ids/species';
import { rollFossilOffer } from '../data/overworld/fossil';
import Landmark from '../data/overworld/landmark';
import type Lairs from '../data/overworld/lair';
import { getBiomeLairs, getLairSpecies } from '../data/overworld/lair';
import Npc, { NPCS } from '../data/overworld/npc';
import type Phenomenon from '../data/overworld/phenomenon';
import { BIOME_PHENOMENA } from '../data/overworld/phenomenon';
import { rollVendorStock } from '../data/overworld/vendor';
import type Chunk from './chunk';
import { canStageBoss } from './raid';
import { CELL_COUNT, CHUNK_CELLS, PLACEMENT_AREA, centeredCells } from './chunk';
import type { PhenomenonReward } from './landmarks';
import { resolveBerryPatch, resolveItemCache, resolveNest, resolvePhenomenon } from './landmarks';

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
 * Rocket grunt among them. Twice a raid: a player who needs a breeder
 * and finds a daycare lady is waiting for the afternoon rather than
 * the next quarter hour, which is what makes finding the one they
 * wanted worth something
 */
export const NPC_INTERVAL = 6 * 60 * 60 * 1000;

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
      const occupied = new Set([
        ...this.chunk.getDecorationCells().keys(),
        ...this.chunk.getLandmarkCells().keys(),
      ]);
      const free = centeredCells(PLACEMENT_AREA).filter((cell) => !occupied.has(cell));

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

  /**
   * The quarter-hour window the chunk's ground belongs to: what a
   * stash holds and what a patch grew. It outlives three spawn
   * windows, so a landmark picked clean stays picked clean while the
   * pokemon around it turn over
   */
  get landmarkTimestamp(): number {
    return Math.floor(this.timestamp / LANDMARK_INTERVAL) * LANDMARK_INTERVAL;
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
          const rng = new AleaRNG(`${this.key}${this.landmarkTimestamp}cache${cell}`);
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
          const rng = new AleaRNG(`${this.key}${this.landmarkTimestamp}berry${cell}`);
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
        canStageBoss(getLairSpecies(lair)),
      );

      if (lairs.length > 0) {
        for (const [cell, landmark] of this.chunk.getLandmarkCells()) {
          if (landmark === Landmark.LegendaryLair) {
            const rng = new AleaRNG(`${this.key}${this.raidTimestamp}raid${cell}`);
            // The draws land in order: the lair, then the trait value
            // its resident's nature and ability derive from
            const lair = lairs[Math.floor(rng.random() * lairs.length)];

            raids.set(cell, { lair, species: getLairSpecies(lair), traitValue: rng.int32() });
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
        canStageBoss(getLairSpecies(lair)),
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

          raids.set(cell, { lair, species: getLairSpecies(lair), traitValue: rng.int32() });
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
    return Math.floor(this.timestamp / NEST_INTERVAL) * NEST_INTERVAL;
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

  /**
   * The window a wandering NPC's rounds belong to. Whoever is
   * standing at the cell stays there for six hours, which is longer
   * than anything else a player walks up to and shorter than a nest
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
   * person on it is drawn afresh every six hours — so a player who
   * needs a breeder waits for one, or goes looking somewhere else.
   *
   * A Team Rocket grunt is one of the draws, so the same walk that
   * finds a nurse can find a fight instead
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

  private rocketStops: Map<number, Spawn[]> | null = null;

  /**
   * The window's Team Rocket stops, keyed by the NPC cell: three
   * pokemon, one from each of the biome's base, uncommon and rare
   * bands. An empty band falls back to the nearest one with anything,
   * so somewhere thin is still patrolled; only an empty pool stages
   * nobody. Each draw carries its own rolls but no level, which the
   * fight fixes for all three
   */
  getRocketStops(): Map<number, Spawn[]> {
    if (this.rocketStops == null) {
      const stops = new Map<number, Spawn[]>();
      // A biome asleep at this hour still patrols: the window's own
      // pool first, then the other periods in a fixed order, so a
      // grunt drawn on night tundra fields the tundra's daytime
      // residents instead of standing there unfightable
      const times = [
        getTimeOfDay(this.npcTimestamp),
        TimeOfDay.Morning,
        TimeOfDay.Day,
        TimeOfDay.Evening,
        TimeOfDay.Night,
      ];
      let bands: SpawnRarityGroups['base'][] = [];
      // Weakest first, so the party reads the way it is fought; a
      // thin band borrows from the commonest one that is not empty
      let stocked: SpawnRarityGroups['base'] | undefined;

      for (const time of times) {
        const pool = getSpawnPool(this.chunk.biome, time);

        bands = [pool.base, pool.uncommon, pool.rare];
        stocked = bands.find((band) => band.length > 0);
        if (stocked != null) {
          break;
        }
      }

      if (stocked != null) {
        // Named as a const so the closure below keeps the narrowing
        const filled = stocked;
        const fielded = bands.map((band) => (band.length > 0 ? band : filled));

        for (const [cell, standing] of this.getWanderingNpcs()) {
          if (standing !== Npc.RocketGrunt) {
            continue;
          }

          const rng = new AleaRNG(`${this.key}${this.npcTimestamp}rocket${cell}`);

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
   * What the vendor at this cell is carrying, or an empty crate when
   * somebody else is standing there.
   *
   * It is drawn from the same seed the person was drawn from, so the
   * crate is part of who walked up rather than something stored: every
   * player who reaches this vendor this window is offered the same six
   * things, and the next window brings a different trader with a
   * different crate
   */
  getVendorStock(cell: number): Items[] {
    if (this.getWanderingNpcs().get(cell) !== Npc.Vendor) {
      return [];
    }

    const rng = new AleaRNG(`${this.key}${this.npcTimestamp}wares${cell}`);

    return rollVendorStock(() => rng.random());
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
    return Math.floor(this.timestamp / PHENOMENON_INTERVAL) * PHENOMENON_INTERVAL;
  }

  private phenomena: Map<number, Phenomenon> | null = null;

  /**
   * What is going on at each phenomenon cell this hour, drawn from
   * what the biome can host. The cell is the chunk's own and never
   * moves; which of the four is happening on it is the window's, so a
   * player who wants a dust cloud waits an hour or walks to drier
   * ground
   */
  getPhenomena(): Map<number, Phenomenon> {
    if (this.phenomena == null) {
      const showing = new Map<number, Phenomenon>();
      const kinds = BIOME_PHENOMENA[this.chunk.biome];

      if (kinds.length > 0) {
        for (const [cell, landmark] of this.chunk.getLandmarkCells()) {
          if (landmark !== Landmark.Phenomenon) {
            continue;
          }

          const rng = new AleaRNG(`${this.key}${this.phenomenonTimestamp}phenomenon${cell}`);

          showing.set(cell, kinds[Math.floor(rng.random() * kinds.length)]);
        }
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

    const rng = new AleaRNG(`${this.key}${this.phenomenonTimestamp}happening${cell}`);

    return resolvePhenomenon(
      phenomenon,
      this.chunk.biome,
      getTimeOfDay(this.phenomenonTimestamp),
      () => rng.random(),
      getFeaturedFamily(this.phenomenonTimestamp),
    );
  }
}
