import { registerMoves } from '../../src/data/moves';
import { describe, expect, it } from 'vitest';
import AleaRNG from '../../src/core/alea';
import { MAX_OFFSET, MIN_OFFSET, asOffset } from '../../src/auth/local-time';
import Abilities from '../../src/data/ids/abilities';
import registerAbilities, { getAbilityData } from '../../src/data/abilities';
import PerlinNoise from '../../src/core/perlin';
import registerBiomeSpawns, {
  BIOME_NAMES,
  SpawnRarity,
  getSpawnPool,
  getSpawnRarity,
  isGrownSpecies,
  spawnRanks,
} from '../../src/data/biome';
import { BuildRole } from '../../src/data/species/best-moves';
import {
  CORE_COUNT,
  assignBuildRoles,
  getBestNature,
  getBestParty,
} from '../../src/data/species/best-build';
import Biome, {
  BIOME_CONFIGS,
  TimeOfDay,
  getTimeOfDay,
  growsBerries,
  growsTrees,
  isOpenSea,
  isWaterBiome,
} from '../../src/data/ids/biome';
import Lairs, {
  EVERY_LAIR,
  getBiomeLairs,
  getLairResidents,
  getLairTitle,
  getSpeciesLair,
} from '../../src/data/overworld/lair';
import Natures from '../../src/data/ids/natures';
import { APRICORNS, ItemTypes, Items } from '../../src/data/ids/items';
import registerItems, { getItemData } from '../../src/data/items';
import { isValuable } from '../../src/data/items/valuables';
import { getExpertHeldItems } from '../../src/data/items/expert-loadout';
import { Slots, countAbilitySlots, getSlots } from '../../src/data/constants/slots';
import type { CatchSnapshot } from '../../src/auth/catch-snapshot';
import {
  ITEM_BAND_ODDS,
  type ItemBand,
  PHENOMENON_BAND_ODDS,
  getItemBand,
  getItemOdds,
} from '../../src/data/overworld/item-pool';
import EggGroups from '../../src/data/ids/egg-groups';
import { Genders, Species } from '../../src/data/ids/species';
import {
  SPECIES_DAY_HIDDEN_ABILITY_BOOST,
  floats,
  getBaseSpecies,
  getRegisteredSpecies,
  getSpeciesAbilityPools,
  getSpeciesData,
  registerSpecies,
  swims,
} from '../../src/data/species';
import { MAX_LEVEL } from '../../src/data/constants/levels';
import { WILD_HELD_COMMON, WILD_HELD_UNCOMMON } from '../../src/data/species/held-items';
import { RaidKind, deriveRaidReward, getRaidTitle } from '../../src/auth/raids';
import {
  BANNED_BOSS_MOVES,
  BOSS_HEALTH_SCALE,
  getBannedBossMoves,
} from '../../src/battle/abilities/special';
import { EffectType } from '../../src/battle/events';
import { Types } from '../../src/data/constants/types';
import { getMaxHealth } from '../../src/auth/health';
import { isShadow, isShiny } from '../../src/auth/caught-record';
import {
  MAX_EFFORT_PER_STAT,
  MAX_IV,
  PERFECT_IVS,
  STAT_ORDER,
  Stats,
  getIV,
  unpackIVs,
} from '../../src/data/constants/stats';
import { Statuses, packStatuses } from '../../src/data/ids/status';
import { type StopRecord, deriveStopReward } from '../../src/auth/stop-record';
import { seatId } from '../../src/auth/gym-seat-record';
import type Chunk from '../../src/overworld/chunk';
import {
  CELL_COUNT,
  CHUNK_CELLS,
  PLACEMENT_AREA,
  centeredCells,
  chunkOfCell,
  neighborCells,
  worldCell,
} from '../../src/overworld/chunk';
import { CARDINALS } from '../../src/overworld/path';
import nameTown from '../../src/data/overworld/town-names';
import type { Town } from '../../src/overworld/town';
import {
  TOWN_REGION,
  getTownLots,
  townAt,
  townName,
  townOfRegion,
  townOverChunk,
} from '../../src/overworld/town';
import { getBiomeDecorations } from '../../src/data/overworld/decoration';
import ChunkSnapshot, {
  EXECUTIVE_CHANCE,
  LANDMARK_INTERVAL,
  MAX_PHENOMENA,
  NEST_INTERVAL,
  NPC_INTERVAL,
  PHENOMENON_INTERVAL,
  RAID_INTERVAL,
  ROCKET_PARTY_SIZE,
  RocketRank,
  SNAPSHOT_INTERVAL,
  SPAWN_COUNT,
  type Spawn,
  WEATHER_INTERVAL,
} from '../../src/overworld/chunk-snapshot';
import {
  BANNED_BOSS_SPECIES,
  BOSS_ALLIANCE,
  LEGENDARY_RAID_GOLD,
  LEGENDARY_RAID_REWARD_LEVEL,
  MYTHICAL_RAID_GOLD,
  MYTHICAL_RAID_REWARD_LEVEL,
  PLAYER_ALLIANCE,
  RAID_BOSS_LEVEL,
  SHADOW_RAID_GOLD,
  SHADOW_RAID_REWARD_LEVEL,
  canStageBoss,
  createRaidBossSnapshot,
  getBossMoves,
} from '../../src/overworld/raid';
import { collectAftermath, createRaidBattle } from '../../src/overworld/raid-battle';
import {
  ACE_OUTFIT,
  CHAMPION_GOLD,
  CHAMPION_OUTFIT,
  CHAMPION_PARTY_LEVELS,
  ELITE_GOLD,
  ELITE_OUTFIT,
  ELITE_PARTY_LEVELS,
  GIOVANNI_GOLD,
  GIOVANNI_PARTY_LEVELS,
  GYM_GOLD,
  GYM_OUTFIT,
  GYM_PARTY_LEVELS,
  type GoldBand,
  LEGEND_OUTFIT,
  LEGEND_PARTY_LEVELS,
  PLAIN_OUTFIT,
  ROCKET_GRUNT_GOLD,
  ROCKET_PARTY_LEVELS,
  ROCKET_REWARD_LEVEL,
  TYPE_TRAINER_GOLD,
  createStopParty,
  createStopSnapshot,
  polishedStats,
  rocketPartyLevels,
  rollStopGold,
  rollStopLoot,
  stopGoldBand,
  stopOutfit,
  stopPartyLevels,
} from '../../src/overworld/stop';
import {
  BIOME_ELITE_MEMBERS,
  BIOME_GYM_LEADERS,
  CHAMPION_CHARSETS,
  Champion,
  ELITE_MEMBER_CHARSETS,
  EXPERT_PARTY_SIZE,
  GYM_LEADER_CHARSETS,
  GYM_LEADER_TYPES,
  LEGEND_CHARSETS,
  getEliteMemberRoster,
} from '../../src/data/overworld/experts';
import {
  ACE_PARTY_SIZE,
  ACE_TRAINER_LEVELS,
  TRAINER_CHARSETS,
  TRAINER_CLASSES,
  TRAINER_NAMES,
  TRAINER_REGIONS,
  TRAINER_TYPES,
  TYPE_TRAINER_LEVELS,
  TYPE_TRAINER_PARTY_MAX,
  TYPE_TRAINER_PARTY_MIN,
  TrainerClass,
  getBiomeTrainers,
  getTrainerPool,
  isAceTrainer,
  isGrownInRegion,
  trainerLevels,
} from '../../src/data/overworld/trainers';
import pickStartPosition, { START_AREA, pickFreeCell } from '../../src/overworld/start';
import { Moves } from '../../src/data/ids/moves';
import type { Encounter } from '../../src/overworld/encounter/shape';
import deriveEncounter, {
  ENCOUNTER_TYPE_NAMES,
  EncounterType,
  MAX_SIZE_SCALE,
  MIN_SIZE_SCALE,
  MOVE_LIMIT,
  RAID_FAMILY_DAY_MIN_IV,
  deriveAbility,
  deriveMoves,
  deriveNature,
  deriveSize,
  deriveSizeScale,
  getSpawnLevels,
  isRaidEncounter,
  isShinyFor,
} from '../../src/overworld/encounter';
import {
  MAX_CATCH_BONUS,
  SHADOW_CATCH_FACTOR,
  encounterKey,
  encounterWindow,
} from '../../src/overworld/safari';
import { FOSSIL_OFFER_KINDS, getFossilPrice } from '../../src/data/overworld/fossil';
import { isFossil } from '../../src/data/items/fossils';
import Landmark from '../../src/data/overworld/landmark';
import { SYNDICATE_BOSS_CHARSETS } from '../../src/data/overworld/syndicate';
import { getPortalCell, portalInRegion } from '../../src/overworld/portal';
import Npc, {
  EXECUTIVE_CHARSETS,
  EXECUTIVE_NAMES,
  NPCS,
  npcSheet,
  npcSheets,
} from '../../src/data/overworld/npc';
import Phenomenon, {
  BIOME_PHENOMENA,
  getPhenomenonGroups,
  getPhenomenonItems,
} from '../../src/data/overworld/phenomenon';
import {
  VENDOR_STAPLES,
  VENDOR_STOCK_KINDS,
  type VendorKind,
  getChefGoods,
  getVendorGoods,
  isMarketable,
} from '../../src/data/overworld/vendor';
import {
  MAX_BERRY_PICK,
  MIN_BERRY_PICK,
  resolveApricornColour,
  resolveApricornTree,
  resolveBerryPatch,
  resolveNest,
  resolvePhenomenon,
} from '../../src/overworld/landmarks';
import { DARK_DAY_LAMP_CELLS, favorsEverything } from '../../src/data/overworld/weather';
import {
  BUDDY_ABILITIES,
  KINSHIP_CATCH_BOOST,
  LURE_SPAWN_BONUS,
  TRAP_FLEE_FACTOR,
} from '../../src/overworld/abilities/__create';
import { PUBLISHED_SPAWNS } from '../../src/auth/snapshots';
import {
  COMPOUND_EYES_HELD_BOOST,
  CUTE_CHARM_CHANCE,
  FLAME_BODY_FACTOR,
  GLUTTONY_FEAST,
  HONEY_STEP_INTERVAL,
  ILLUMINATE_LAMP_CELLS,
  KEEN_CRITICAL_BOOST,
  LEVEL_CEILING_LIFT,
  LEVEL_FLOOR_LIFT,
  PICKUP_STEP_INTERVAL,
  PURIFIED_SHADOW_RELIEF,
  SNIPER_AIMS,
  STENCH_QUIET,
  SYNCHRONIZE_CHANCE,
} from '../../src/overworld/abilities/gen-1';
import { EGG_HATCH_STEPS } from '../../src/auth/egg';
import type Overworld from '../../src/overworld/core';
import type { Buddy } from '../../src/overworld/core';
import { CANDY_ITEM_BONUS } from '../../src/overworld/items/candy-items';
import { LUCK_INCENSE_BONUS, PURE_INCENSE_QUIET } from '../../src/overworld/items/incenses';
import { AMULET_COIN_BONUS, CLEANSE_TAG_QUIET } from '../../src/overworld/items/trinkets';
import { CATCHING_CHARM_BOOST, SHINY_CHARM_BOOST } from '../../src/overworld/items/key-items';
import createOverworld from '../../src/overworld/setup';
import { POCKET_LIMIT, roleAt } from '../../src/overworld/ground';
import World, {
  WORLD_MAX,
  WORLD_MIN,
  WORLD_SIZE,
  clampToWorld,
  isInWorld,
} from '../../src/overworld/world';

// Spawn rolls read the species registry and the biome spawn pools;
// the berry patch reads the item registry to name what it grew, and
// the machines that registry generates read the move data
registerMoves();
registerSpecies();
registerItems();
registerAbilities();
registerBiomeSpawns();

describe('perlin noise', () => {
  it('is deterministic for a seed', () => {
    const first = new PerlinNoise('test-seed');
    const second = new PerlinNoise('test-seed');
    const other = new PerlinNoise('other-seed');

    expect(first.noise(1.5, 2.25)).toBe(second.noise(1.5, 2.25));
    expect(first.noise(1.5, 2.25)).not.toBe(other.noise(1.5, 2.25));
  });

  it('stays within the -1 to 1 climate scale', () => {
    const noise = new PerlinNoise('range-seed');

    for (let x = 0; x < 20; x++) {
      for (let y = 0; y < 20; y++) {
        const value = noise.noise(x * 0.37, y * 0.53);

        expect(value).toBeGreaterThanOrEqual(-1);
        expect(value).toBeLessThanOrEqual(1);
      }
    }
  });
});

/**
 * Biomes span whole regions, so a search for a specific one has to
 * cover far more ground than a handful of chunks
 */
/**
 * The first region whose town, or lack of one, is what a test is
 * after. Swept the way `findChunk` sweeps, since a town is sited to
 * every eighth chunk and most of the world is water
 */
function findRegion(
  world: World,
  matches: (town: Town | null) => boolean,
): [regionX: number, regionY: number] | null {
  for (let regionY = -24; regionY < 24; regionY++) {
    for (let regionX = -24; regionX < 24; regionX++) {
      if (matches(townOfRegion(world, regionX, regionY))) {
        return [regionX, regionY];
      }
    }
  }
  return null;
}

function findChunk(world: World, matches: (chunk: Chunk) => boolean): Chunk | null {
  // The towns first, and by region rather than by chunk. A town is two
  // chunks across and one is sited to every eight, so a sweep that
  // steps over chunks steps over the towns, and everything a town
  // holds is exactly what a chunk of open country no longer does
  for (let regionY = -24; regionY < 24; regionY++) {
    for (let regionX = -24; regionX < 24; regionX++) {
      const town = townOfRegion(world, regionX, regionY);

      if (town == null) {
        continue;
      }

      const seen = new Set<string>();

      for (const lot of getTownLots(world, town)) {
        const key = `${chunkOfCell(lot.x)},${chunkOfCell(lot.y)}`;

        if (seen.has(key)) {
          continue;
        }
        seen.add(key);

        const candidate = world.getChunk(chunkOfCell(lot.x), chunkOfCell(lot.y));

        if (matches(candidate)) {
          return candidate;
        }
      }
    }
  }
  for (let y = -200; y < 200; y += 4) {
    for (let x = -200; x < 200; x += 4) {
      const candidate = world.getChunk(x, y);

      if (matches(candidate)) {
        return candidate;
      }
    }
  }
  return null;
}

/**
 * A buddy that has the given abilities and nothing else notable: an
 * Adamant male carrying nothing
 */
function buddyWith(abilities: Abilities[]): Buddy {
  return {
    species: Species.Bulbasaur,
    abilities,
    items: [],
    nature: Natures.Adamant,
    gender: Genders.Male,
  };
}

/**
 * A meeting standing in front of the player, for the questions asked
 * of one rather than of the chunk that staged it
 */
function metWild(species: Species, shadow = false): Encounter {
  return {
    type: EncounterType.Wild,
    species,
    level: 10,
    individualValue: 0,
    traitValue: 0,
    ivs: 0,
    nature: Natures.Adamant,
    ability: Abilities.Overgrow,
    gender: Genders.Male,
    lair: null,
    shiny: false,
    shadow,
    moves: [],
    items: [],
    timestamp: 0,
    x: 0,
    y: 0,
    biome: Biome.Grassland,
  };
}

describe('world', () => {
  it('derives independent climate channels from one seed', () => {
    const world = new World('overworld');
    const same = new World('overworld');
    const other = new World('otherworld');

    // Same seed rebuilds the same world
    expect(world.humidity.noise(3.2, 4.7)).toBe(same.humidity.noise(3.2, 4.7));
    expect(world.elevation.noise(3.2, 4.7)).toBe(same.elevation.noise(3.2, 4.7));
    expect(world.temperature.noise(3.2, 4.7)).toBe(same.temperature.noise(3.2, 4.7));

    // Channels are decorrelated from each other and across seeds
    expect(world.humidity.noise(3.2, 4.7)).not.toBe(world.elevation.noise(3.2, 4.7));
    expect(world.elevation.noise(3.2, 4.7)).not.toBe(world.temperature.noise(3.2, 4.7));
    expect(world.humidity.noise(3.2, 4.7)).not.toBe(other.humidity.noise(3.2, 4.7));
  });

  it('resolves chunks deterministically with coordinate-derived seeds', () => {
    const world = new World('overworld');
    const chunk = world.getChunk(3, -7);

    expect(chunk.seed).toBe('overworld(3, -7)');
    expect(chunk.biome).toBe(world.getChunk(3, -7).biome);
  });

  it('rolls a few fixed landmarks per chunk of open country, each on its own cell', () => {
    const world = new World('overworld');
    const shapes = new Set<string>();

    for (let x = 0; x < 10; x++) {
      const chunk = world.getChunk(x, 0);
      const landmarks = chunk.getLandmarks();

      // Thin: the services live in towns, so what is left out here is
      // what a player goes out for. A chunk a town falls on holds the
      // town's lots as well
      expect(landmarks.length).toBeGreaterThanOrEqual(1);

      // One cell each, anywhere on the grid: the rim used to be held
      // clear for a player walking in from the chunk next door, and
      // nobody walks in any more
      expect(chunk.getLandmarkCells().size).toBe(landmarks.length);

      // Fixed forever: a fresh resolution of the chunk agrees
      const again = world.getChunk(x, 0);
      expect(again.getLandmarks()).toEqual(landmarks);
      expect([...again.getLandmarkCells()]).toEqual([...chunk.getLandmarkCells()]);
      shapes.add(JSON.stringify([...chunk.getLandmarkCells()]));
    }

    // Different chunks roll different landmark sets
    expect(shapes.size).toBeGreaterThan(1);
  });

  it('rolls window-scoped item cache rewards', () => {
    const world = new World('overworld');
    let chunk = world.getChunk(0, 0);

    // Find a chunk hosting at least one item cache landmark
    for (let x = 0; x < 20; x++) {
      const candidate = world.getChunk(x, 0);

      if (new Set(candidate.getLandmarkCells().values()).has(Landmark.ItemCache)) {
        chunk = candidate;
        break;
      }
    }

    const WINDOW = LANDMARK_INTERVAL;
    const caches = new ChunkSnapshot(chunk, 0).getItemCaches();

    // Every reward sits on an ItemCache landmark cell
    expect(caches.size).toBeGreaterThan(0);
    for (const cell of caches.keys()) {
      expect(chunk.getLandmarkCells().get(cell)).toBe(Landmark.ItemCache);
    }

    // The same window agrees for every observer, and the ground
    // outlives the spawns: three spawn windows share one stash
    expect(new ChunkSnapshot(chunk, 60 * 1000).getItemCaches()).toEqual(caches);
    expect(new ChunkSnapshot(chunk, LANDMARK_INTERVAL - 1).getItemCaches()).toEqual(caches);
    expect(new ChunkSnapshot(chunk, LANDMARK_INTERVAL - 1).landmarkTimestamp).toBe(0);
    expect(new ChunkSnapshot(chunk, LANDMARK_INTERVAL).landmarkTimestamp).toBe(LANDMARK_INTERVAL);

    // Expired windows regenerate: rewards vary across windows
    const shapes = new Set<string>();
    for (let window = 0; window <= 10; window++) {
      shapes.add(JSON.stringify([...new ChunkSnapshot(chunk, window * WINDOW).getItemCaches()]));
    }
    expect(shapes.size).toBeGreaterThan(1);

    // ...and the zone it is read in is not one of the things that
    // makes it a different stash. The offset comes from the caller, so
    // a zone in the seed or in the claim marker would be a stash dug
    // up once per zone by a client saying it was somewhere else
    const NOW = 1_700_000_000_000;
    const buried = new Set<string>();
    const markers = new Set<string>();

    for (let offset = MIN_OFFSET; offset <= MAX_OFFSET; offset++) {
      const zoned = new ChunkSnapshot(chunk, NOW + asOffset(offset) * 60 * 1000, offset);

      buried.add(JSON.stringify([...zoned.getItemCaches()]));
      markers.add(`${zoned.groundKey}@${zoned.landmarkTimestamp}`);
    }
    expect(buried.size).toBe(1);
    expect(markers.size).toBe(1);
  });

  it('rolls what is happening over the chunk rather than pinning it', () => {
    const world = new World('overworld');
    const chunk = findChunk(
      world,
      (candidate) => new ChunkSnapshot(candidate, 0).getPhenomena().size > 0,
    );

    expect(chunk).not.toBeNull();
    if (chunk == null) {
      return;
    }

    const places = new Set<string>();
    let counted = 0;

    for (let window = 0; window < 24; window++) {
      const at = window * PHENOMENON_INTERVAL;
      const showing = new ChunkSnapshot(chunk, at).getPhenomena();

      counted += showing.size;
      places.add(JSON.stringify([...showing.keys()].sort((left, right) => left - right)));

      // Never more than the chunk may hold at once
      expect(showing.size).toBeLessThanOrEqual(MAX_PHENOMENA);

      // Nothing stands on scenery, in a rock or on somebody's stall
      for (const cell of showing.keys()) {
        expect(chunk.getLandmarkCells().has(cell)).toBe(false);
        expect(chunk.getDecorationCells().has(cell)).toBe(false);
        expect(chunk.getRockCells().has(cell)).toBe(false);
      }

      // Everybody reading the same hour reads the same happenings:
      // it is derived, not stored
      expect(new ChunkSnapshot(chunk, at + 1).getPhenomena()).toEqual(showing);
    }

    // They move between hours rather than sitting on one cell forever,
    // which is the whole of why they stopped being landmarks
    expect(counted).toBeGreaterThan(0);
    expect(places.size).toBeGreaterThan(1);
  });

  it('never stands a pokemon on top of what is going on', () => {
    const world = new World('overworld');
    let checked = 0;

    // The hour is the slower clock, so a happening holds its cell and
    // the window's pokemon fit around it. Sharing one would hide the
    // happening behind a spawn that answers the press instead
    for (let x = 0; x < 25 && checked < 12; x++) {
      for (let y = 0; y < 8 && checked < 12; y++) {
        const chunk = world.getChunk(x, y);
        const snapshot = new ChunkSnapshot(chunk, 0);
        const happenings = snapshot.getPhenomena();

        if (happenings.size === 0) {
          continue;
        }
        snapshot.getSpawns(SPAWN_COUNT);

        for (const cell of snapshot.getSpawnCells().keys()) {
          expect(happenings.has(cell)).toBe(false);
        }
        checked += happenings.size;
      }
    }
    expect(checked).toBeGreaterThan(0);
  });

  it('leaves the spawn roll alone, drawing on its own generator', () => {
    const world = new World('overworld');
    const chunk = findChunk(
      world,
      (candidate) => new ChunkSnapshot(candidate, 0).getPhenomena().size > 0,
    );

    expect(chunk).not.toBeNull();
    if (chunk == null) {
      return;
    }

    // Reading what is happening first must not shift a single pokemon:
    // the happenings ride a generator of their own, and the spawn
    // stream is sequential
    const asked = new ChunkSnapshot(chunk, 0);

    asked.getPhenomena();

    expect(asked.getSpawns(SPAWN_COUNT)).toEqual(
      new ChunkSnapshot(chunk, 0).getSpawns(SPAWN_COUNT),
    );
  });

  it('shows one of the biome\u2019s own phenomena, an hour at a time', () => {
    const world = new World('overworld');
    const chunk = findChunk(
      world,
      (candidate) => new ChunkSnapshot(candidate, 0).getPhenomena().size > 0,
    );

    expect(chunk).not.toBeNull();
    if (chunk == null) {
      return;
    }

    const showing = new ChunkSnapshot(chunk, 0).getPhenomena();

    // Every one of them sits on a phenomenon cell and is something
    // this biome can actually host — or the forced ripple of a cell
    // standing in the water
    expect(showing.size).toBeGreaterThan(0);
    const spots = chunk.getSpotCells();

    for (const [cell, phenomenon] of showing) {
      const wet = isWaterBiome(chunk.biome) ? !spots.has(cell) : spots.has(cell);

      // Rolled over the chunk's free ground rather than pinned to a
      // landmark: what it must not do is stand on one
      expect(chunk.getLandmarkCells().has(cell)).toBe(false);
      expect(
        new Set(BIOME_PHENOMENA[chunk.biome]).has(phenomenon) ||
          (wet && phenomenon === Phenomenon.RipplingWater),
      ).toBe(true);
    }

    // Whatever is going on there goes on for the whole hour, and
    // every observer of that hour sees the same thing
    expect(new ChunkSnapshot(chunk, 60 * 1000).getPhenomena()).toEqual(showing);
    expect(new ChunkSnapshot(chunk, PHENOMENON_INTERVAL - 1).getPhenomena()).toEqual(showing);
    for (const cell of showing.keys()) {
      expect(new ChunkSnapshot(chunk, 60 * 1000).getPhenomenonReward(cell)).toEqual(
        new ChunkSnapshot(chunk, 0).getPhenomenonReward(cell),
      );
    }

    // And the hours are not all the same hour
    const shapes = new Set<string>();

    for (let window = 0; window <= 24; window++) {
      const snapshot = new ChunkSnapshot(chunk, window * PHENOMENON_INTERVAL);

      shapes.add(
        JSON.stringify([
          [...snapshot.getPhenomena()],
          [...snapshot.getPhenomena().keys()].map((cell) => snapshot.getPhenomenonReward(cell)),
        ]),
      );
    }
    expect(shapes.size).toBeGreaterThan(1);

    // Nothing is startled out of the space beyond the map
    const beyond = findChunk(world, (candidate) => candidate.biome === Biome.Beyond);

    if (beyond != null) {
      expect(new ChunkSnapshot(beyond, 0).getPhenomena().size).toBe(0);
    }
  });

  it('stages legendary raids on the raid window', () => {
    const world = new World('overworld');
    // A lair is a place: the polar ocean holds the Seafoam Islands
    // and the Island Cave, and each stages whoever is at home in it
    const chunk = findChunk(
      world,
      (candidate) =>
        candidate.biome === Biome.PolarOcean &&
        new Set(candidate.getLandmarkCells().values()).has(Landmark.LegendaryLair),
    );

    expect(chunk).not.toBeNull();
    if (chunk == null) {
      return;
    }

    const raids = new ChunkSnapshot(chunk, 0).getLegendaryLairs();

    expect(raids.size).toBeGreaterThan(0);
    const hosted = new Set(getBiomeLairs(Biome.PolarOcean));

    expect(hosted).toEqual(new Set([Lairs.SeafoamIslands, Lairs.IslandCave]));
    for (const [cell, roll] of raids) {
      expect(chunk.getLandmarkCells().get(cell)).toBe(Landmark.LegendaryLair);
      expect(roll.lair).not.toBeNull();
      expect(hosted.has(roll.lair ?? Lairs.FarawayIsland)).toBe(true);
      expect(getLairResidents(roll.lair ?? Lairs.FarawayIsland)).toContain(roll.species);
    }

    // Every spawn window inside the raid's three hours stages the
    // same raid, even as the spawns around it turn over
    const later = new ChunkSnapshot(chunk, RAID_INTERVAL - SNAPSHOT_INTERVAL);

    expect(later.raidTimestamp).toBe(0);
    expect([...later.getLegendaryLairs()]).toEqual([...raids]);

    // The next window rolls again
    const next = new ChunkSnapshot(chunk, RAID_INTERVAL);

    expect(next.raidTimestamp).toBe(RAID_INTERVAL);
  });

  it('never stages a mythical raid', () => {
    const world = new World('overworld');

    // Mew's island is a lair like any other, but no biome lists it:
    // the world stages no mythical, so the rainforest it lives in
    // holds no lair at all
    expect(getSpeciesLair(Species.Mew)).toBe(Lairs.FarawayIsland);
    for (const key of Object.keys(BIOME_NAMES)) {
      expect(getBiomeLairs(Number(key))).not.toContain(Lairs.FarawayIsland);
    }

    const chunk = findChunk(world, (candidate) => candidate.biome === Biome.TropicalRainforest);

    expect(chunk).not.toBeNull();
    expect(chunk == null ? -1 : new ChunkSnapshot(chunk, 0).getLegendaryLairs().size).toBe(0);
  });

  it('draws a lair from the biome rather than from its spawn pool', () => {
    const world = new World('overworld');
    const chunk = findChunk(
      world,
      (candidate) =>
        candidate.biome === Biome.Mountain &&
        new Set(candidate.getLandmarkCells().values()).has(Landmark.LegendaryLair),
    );

    expect(chunk).not.toBeNull();
    if (chunk == null) {
      return;
    }

    // A mountain holds six: the volcano, the cave under it, the two
    // towers on it, the tomb cut into it and the pillar at the top.
    // Every window stages one of them, and whoever is at home in it
    const hosted = new Set(getBiomeLairs(Biome.Mountain));

    expect(hosted).toEqual(
      new Set([
        Lairs.MtEmber,
        Lairs.CeruleanCave,
        Lairs.BellTower,
        Lairs.AncientTomb,
        Lairs.SkyPillar,
        Lairs.SpearPillar,
      ]),
    );

    for (let window = 0; window < 12; window++) {
      for (const roll of new ChunkSnapshot(chunk, window * RAID_INTERVAL)
        .getLegendaryLairs()
        .values()) {
        expect(roll.lair).not.toBeNull();
        expect(hosted.has(roll.lair ?? Lairs.FarawayIsland)).toBe(true);
        expect(getLairResidents(roll.lair ?? Lairs.FarawayIsland)).toContain(roll.species);
      }
    }
  });

  it('puts a mythical beyond the world rather than in it', () => {
    // Beyond is a biome a record can carry and nothing else: no
    // climate targets it, so no sampling can land on it and nothing
    // is ever generated there
    expect(BIOME_NAMES[Biome.Beyond]).toBe('Beyond');
    expect(Object.keys(BIOME_CONFIGS)).not.toContain(String(Biome.Beyond));
    expect(getSpawnPool(Biome.Beyond, TimeOfDay.Day).base).toEqual([]);
    expect(getBiomeLairs(Biome.Beyond)).toEqual([]);

    const world = new World('overworld');

    for (let x = 0; x < 40; x++) {
      for (let y = 0; y < 4; y++) {
        expect(world.getChunk(x, y).biome).not.toBe(Biome.Beyond);
      }
    }

    // The encounter's own biome is the chunk's unless the meeting
    // says otherwise, which is what a mythical says
    const snapshot = new ChunkSnapshot(world.getChunk(0, 0), 0);
    const spawn = [Species.Mew, 0, 0] as const;

    expect(deriveEncounter(snapshot, [...spawn], 'trainer-red').biome).toBe(snapshot.chunk.biome);
    expect(
      deriveEncounter(snapshot, [...spawn], 'trainer-red', {
        type: EncounterType.MythicalRaid,
        biome: Biome.Beyond,
      }).biome,
    ).toBe(Biome.Beyond);
  });

  it('names a raid after the place rather than the pokemon', () => {
    // A lair is named after itself, shadowed or not
    expect(getLairTitle(Lairs.SeafoamIslands, Biome.PolarOcean, false)).toBe('Seafoam Islands');
    expect(getLairTitle(Lairs.SeafoamIslands, Biome.PolarOcean, true)).toBe(
      'Shadow Seafoam Islands',
    );

    // A shadow that reached for a rare species instead stands in no
    // named place, so it is called after the ground it is on
    expect(getLairTitle(null, Biome.Woodland, true)).toBe('Shadow Woodland Lair');

    // And the record answers with the same words the lobby did
    expect(
      getRaidTitle({
        kind: RaidKind.Shadow,
        lair: null,
        species: Species.Gyarados,
        traitValue: 0,
        host: 'red',
        teams: [],
        battle: null,
        timestamp: 0,
        offset: 0,
        chunk: { seed: 'chunk', x: 0, y: 0 },
        biome: Biome.Woodland,
        cell: 0,
        cleared: false,
      }),
    ).toBe('Shadow Woodland Lair');
  });

  it('gives a raid boss the gender its species rolls', () => {
    // Nidoran-F is female-only, Nidoran-M male-only: a boss reads
    // the same ratio a spawn does rather than coming out genderless
    expect(createRaidBossSnapshot(Species.NidoranF, 0x12345678).gender).toBe(Genders.Female);
    expect(createRaidBossSnapshot(Species.NidoranM, 0x12345678).gender).toBe(Genders.Male);

    // A species with no ratio still has no gender
    expect(createRaidBossSnapshot(Species.Articuno, 0x12345678).gender).toBe(Genders.Genderless);

    // And the roll follows the trait value, so a mixed-ratio species
    // can come out either way
    const genders = new Set(
      [0, 0x1000, 0x4000, 0xff00, 0xabcdef].map(
        (traitValue) => createRaidBossSnapshot(Species.Gyarados, traitValue).gender,
      ),
    );

    expect(genders.size).toBeGreaterThan(1);
  });

  it('builds the raid boss trained as far as anything goes, and with no items', () => {
    const boss = createRaidBossSnapshot(Species.Articuno, 0x12345678);
    const trained = MAX_EFFORT_PER_STAT;

    expect(boss.level).toBe(RAID_BOSS_LEVEL);
    expect(boss.ivs).toBe(PERFECT_IVS);
    expect(Object.values(boss.effortValues)).toEqual([
      trained,
      trained,
      trained,
      trained,
      trained,
      trained,
    ]);
    expect(boss.items).toEqual([]);
    expect(boss.caught).toBe('');

    // Nature and ability follow the raid's trait value, so every
    // player in the lobby fights the same boss — and the Boss
    // ability rides alongside the species' own
    expect(boss.nature).toBe(deriveNature(0x12345678));
    expect(boss.abilities).toEqual([Abilities.Boss, deriveAbility(Species.Articuno, 0x12345678)]);
  });

  it('carries the player and the catch id into the battle', () => {
    const boss = createRaidBossSnapshot(Species.Articuno, 0x12345678);
    const { battle, units } = createRaidBattle('raid-battle-seed', [
      { player: '', alliance: BOSS_ALLIANCE, catches: [boss] },
      {
        player: 'trainer-uid',
        alliance: PLAYER_ALLIANCE,
        catches: [
          { ...boss, caught: 'catch-a', abilities: [] },
          { ...boss, caught: 'catch-b', abilities: [] },
        ],
      },
    ]);

    battle.initialize();

    const party = units.get(PLAYER_ALLIANCE) ?? [];
    const bossUnits = units.get(BOSS_ALLIANCE) ?? [];

    // A unit knows the record it was built from, and its team knows
    // whose party it is
    expect(party.map((unit) => unit.caught)).toEqual(['catch-a', 'catch-b']);
    expect(new Set(party.map((unit) => unit.team.player))).toEqual(new Set(['trainer-uid']));

    // The boss stands for no record and belongs to nobody
    expect(bossUnits.map((unit) => unit.caught)).toEqual(['']);
    expect(bossUnits[0].team.player).toBe('');

    // Units fight at their own measurements, frozen into the snapshot
    expect(bossUnits[0].height).toBe(boss.height);
    expect(bossUnits[0].weight).toBe(boss.weight);
    expect(boss.weight).toBe(deriveSize(Species.Articuno, 0x12345678).weight);
  });

  it('never derives the same move twice', () => {
    // A learn set lists a move at every level it is offered at, and
    // Kadabra is offered Confusion at 1 and again at 16, Disable at 1
    // and again at 20. Run together that is four slots holding two
    // moves — a pokemon that cannot do half of what its card says
    const kadabra = deriveMoves(Species.Kadabra, 30);

    expect(new Set(kadabra).size).toBe(kadabra.length);

    // ...and it is the *latest* of each that is kept, so the four are
    // still the four most recently learned
    expect(kadabra).toContain(Moves.Psybeam);

    // Every species, at every level one of them can be met at
    for (const species of getRegisteredSpecies()) {
      for (const level of [1, 10, 25, 50, MAX_LEVEL]) {
        const moves = deriveMoves(species, level);

        expect(new Set(moves).size, `${getSpeciesData(species).name} at ${level}`).toBe(
          moves.length,
        );
        expect(moves.length).toBeLessThanOrEqual(MOVE_LIMIT);
      }
    }
  });

  it('stages a boss without the moves a boss must not have', () => {
    // Transform is banned because a boss that copies a player throws
    // away the raid-sized pool the whole fight is built around, and
    // the four copying moves because each is a way back to it. The
    // rest are moves a raid pool breaks
    for (const move of [
      Moves.Transform,
      Moves.Metronome,
      Moves.MirrorMove,
      Moves.Mimic,
      Moves.Sketch,
      Moves.PainSplit,
      Moves.BatonPass,
      Moves.DestinyBond,
      Moves.Bide,
      Moves.BellyDrum,
      Moves.RolePlay,
      Moves.SkillSwap,
      Moves.Memento,
      Moves.Grudge,
      Moves.Endeavor,
      // The heal it sleeps for is capped like any other, while the
      // sleep is self-inflicted and lands in full
      Moves.Rest,
      // Temporary: a boss is immune to Perishing, so the song would
      // only be a slot it wastes
      Moves.PerishSong,
      // Spent on a teammate a lone boss does not have, and the first
      // two spend the whole pool doing it
      Moves.HealingWish,
      Moves.LunarDance,
      Moves.HelpingHand,
      Moves.FollowMe,
      // A swap leaks whichever way it is cast, since a boss refuses
      // the half that would cost it anything
      Moves.PowerSwap,
      Moves.GuardSwap,
      Moves.HeartSwap,
    ]) {
      expect(BANNED_BOSS_MOVES.has(move)).toBe(true);
    }

    // The heals a boss may keep: each puts back an eighth of the pool
    // rather than a half, which is worth a slot without stalling the
    // raid
    for (const move of [
      Moves.Recover,
      Moves.SoftBoiled,
      Moves.MilkDrink,
      Moves.Moonlight,
      Moves.MorningSun,
      Moves.Synthesis,
      Moves.Wish,
      Moves.Ingrain,
      Moves.SlackOff,
      Moves.Swallow,
    ]) {
      expect(BANNED_BOSS_MOVES.has(move)).toBe(false);
    }

    // Curse is barred from a Ghost, which pays half a raid pool to
    // lay it, and left to anything else, which takes the stages
    expect(getBannedBossMoves(Species.Gengar).has(Moves.Curse)).toBe(true);
    expect(getBannedBossMoves(Species.Snorlax).has(Moves.Curse)).toBe(false);

    // Clefable would otherwise take Metronome, which can call
    // anything registered — Transform included
    expect(deriveMoves(Species.Clefable, RAID_BOSS_LEVEL)).toContain(Moves.Metronome);
    expect(createRaidBossSnapshot(Species.Clefable, 0x12345678).moves).not.toContain(
      Moves.Metronome,
    );

    // The ban is applied before the four are taken, so a species with
    // more to draw on still comes with a full set
    const staged = createRaidBossSnapshot(Species.Pidgeot, 0x12345678);

    expect(staged.moves).not.toContain(Moves.MirrorMove);
    expect(staged.moves).toHaveLength(MOVE_LIMIT);
  });

  it('never stages a Ditto, or anything with nothing left to cast', () => {
    // Ditto is barred by name: what it does is become something
    // else, and a boss is the one thing that must not
    expect(BANNED_BOSS_SPECIES.has(Species.Ditto)).toBe(true);
    expect(canStageBoss(Species.Ditto)).toBe(false);

    // It would have been barred by the second rule anyway — Transform
    // is its whole learnset, so the ban leaves it with nothing — but
    // the name is what keeps it out if it ever learns more
    expect(deriveMoves(Species.Ditto, RAID_BOSS_LEVEL)).toEqual([Moves.Transform]);
    expect(getBossMoves(Species.Ditto)).toEqual([]);
    expect(canStageBoss(Species.Articuno)).toBe(true);

    // And nothing the world actually stages is ever empty-handed
    const world = new World('overworld');

    for (let x = 0; x < 24; x++) {
      const chunk = world.getChunk(x, 0);
      const snapshot = new ChunkSnapshot(chunk, 0);

      for (const roll of [
        ...snapshot.getShadowLairs().values(),
        ...snapshot.getLegendaryLairs().values(),
      ]) {
        expect(roll.species).not.toBe(Species.Ditto);
        expect(createRaidBossSnapshot(roll.species, roll.traitValue).moves.length).toBeGreaterThan(
          0,
        );
      }
    }
  });

  it('fields a party at the share of health its records kept', () => {
    const boss = createRaidBossSnapshot(Species.Articuno, 0x12345678);
    const whole = { ...boss, caught: 'catch-a', abilities: [] };
    const { battle, units } = createRaidBattle('raid-health-seed', [
      { player: '', alliance: BOSS_ALLIANCE, catches: [boss] },
      {
        player: 'trainer-uid',
        alliance: PLAYER_ALLIANCE,
        catches: [
          whole,
          // Half hurt, out of some earlier fight
          { ...whole, caught: 'catch-b', health: Math.floor(getMaxHealth(whole) / 2) },
        ],
      },
    ]);

    battle.initialize();

    const party = units.get(PLAYER_ALLIANCE) ?? [];
    const bossUnits = units.get(BOSS_ALLIANCE) ?? [];

    // An ordinary pokemon fights on the pool its record describes, so
    // the stored figure travels unchanged
    expect(party[0].health).toBe(party[0].checkStat(Stats.HP, 0));
    expect(party[0].checkStat(Stats.HP, 0)).toBe(getMaxHealth(whole));
    expect(party[1].health).toBe(Math.floor(getMaxHealth(whole) / 2));

    // A Boss carries a raid-sized pool its record knows nothing
    // about, so the stored figure is read as a share and applied to
    // the pool it actually fights with: a boss at full is at full,
    // not at a twentieth of itself
    const pool = bossUnits[0].checkStat(Stats.HP, 0);

    expect(pool).toBe(getMaxHealth(boss) * BOSS_HEALTH_SCALE);
    expect(bossUnits[0].health).toBe(pool);
  });

  it('reports only the reporting player’s own party, health and all', () => {
    const boss = createRaidBossSnapshot(Species.Articuno, 0x12345678);
    const built = createRaidBattle('raid-consumption-seed', [
      { player: '', alliance: BOSS_ALLIANCE, catches: [boss] },
      {
        player: 'trainer-uid',
        alliance: PLAYER_ALLIANCE,
        catches: [
          { ...boss, caught: 'catch-a', abilities: [] },
          { ...boss, caught: 'catch-b', abilities: [] },
        ],
      },
      {
        player: 'other-uid',
        alliance: PLAYER_ALLIANCE,
        catches: [{ ...boss, caught: 'catch-c', abilities: [] }],
      },
    ]);

    built.battle.initialize();

    const party = built.units.get(PLAYER_ALLIANCE) ?? [];
    const bossUnits = built.units.get(BOSS_ALLIANCE) ?? [];

    // One of the player's catches spends a berry, the other keeps
    // its own; a teammate and the boss spend one each too
    party[0].consumed.add(Items.CheriBerry);
    party[2].consumed.add(Items.OranBerry);
    bossUnits[0].consumed.add(Items.SitrusBerry);

    // One of them walks out hurt, burned and poisoned — a unit can
    // be several things at once — the other untouched
    party[1].setHealth(12);
    party[1].addStatus(Statuses.Burned, { type: EffectType.None });
    party[1].addStatus(Statuses.Poisoned, { type: EffectType.None });
    // Confusion ends with the battle, so it is never carried out
    party[0].addStatus(Statuses.Confused, { type: EffectType.None });

    const reported = collectAftermath(built, 'trainer-uid');

    // Every one of the player's own catches is reported, spent or
    // not: health is owed either way
    expect(reported).toEqual([
      {
        caught: 'catch-a',
        items: [Items.CheriBerry],
        health: party[0].health,
        statuses: 0,
        coins: 0,
      },
      {
        caught: 'catch-b',
        items: [],
        health: 12,
        statuses: packStatuses([Statuses.Poisoned, Statuses.Burned]),
        coins: 0,
      },
    ]);
    expect(collectAftermath(built, 'other-uid')).toEqual([
      {
        caught: 'catch-c',
        items: [Items.OranBerry],
        health: party[2].health,
        statuses: 0,
        coins: 0,
      },
    ]);
    // The boss stands for no record, so nothing it did is written
    expect(collectAftermath(built, '')).toEqual([]);
  });

  it('stands a syndicate grunt on two of each of the biome’s bands', () => {
    const world = new World('overworld');
    const chunk = findChunk(
      world,
      (candidate) => new ChunkSnapshot(candidate, 0).getRocketStops().size > 0,
    );

    expect(chunk).not.toBeNull();
    if (chunk == null) {
      return;
    }

    const snapshot = new ChunkSnapshot(chunk, 0);
    const stops = snapshot.getRocketStops();
    const pool = getSpawnPool(chunk.biome, getTimeOfDay(0));

    expect(stops.size).toBeGreaterThan(0);
    for (const [cell, party] of stops) {
      // A stop stands at Team Rocket's own landmark now
      expect(chunk.getLandmarkCells().get(cell)).toBe(Landmark.TeamRocket);

      // Everybody fields six, whatever the rank
      expect(party).toHaveLength(ROCKET_PARTY_SIZE);

      const rank = snapshot.getRocketRank(cell);
      const [young, middle, grown] = spawnRanks(pool);
      const bandOf = (band: typeof pool.base): typeof pool.base =>
        band.length > 0 ? band : [young, middle, grown].flat();
      const drawnFrom = (at: number, band: typeof pool.base): void => {
        expect(new Set(bandOf(band).map((entry) => entry.species)).has(party[at][0])).toBe(true);
      };

      if (rank === RocketRank.Boss) {
        // Five grown ones and a legendary at the end
        for (let at = 0; at < ROCKET_PARTY_SIZE - 1; at++) {
          drawnFrom(at, grown);
        }
        continue;
      }
      if (rank === RocketRank.Executive) {
        // Six grown ones and nothing softer
        for (let at = 0; at < ROCKET_PARTY_SIZE; at++) {
          drawnFrom(at, grown);
        }
        continue;
      }
      // A grunt's six, weakest first: two out of each of the biome's
      // three bands, so the rank that is met most often is the one
      // that reaches the whole pool. A band the window leaves empty
      // borrows from the commonest one that is not
      const bands = [young, young, middle, middle, grown, grown];

      for (const [at, band] of bands.entries()) {
        drawnFrom(at, band);
      }
    }

    // The grunt keeps the cell's own window: they stand as long as any
    // other wanderer, and the next one brings somebody else
    expect(snapshot.npcTimestamp).toBe(0);
    expect(new ChunkSnapshot(chunk, NPC_INTERVAL - 1).getRocketStops()).toEqual(stops);
    expect(new ChunkSnapshot(chunk, NPC_INTERVAL).getRocketStops()).not.toEqual(stops);
  });

  it('fields a grunt at a fixed level, shadowed, with rolled traits', () => {
    const world = new World('overworld');
    const chunk = findChunk(
      world,
      (candidate) => new ChunkSnapshot(candidate, 0).getRocketStops().size > 0,
    );

    expect(chunk).not.toBeNull();
    if (chunk == null) {
      return;
    }

    const snapshot = new ChunkSnapshot(chunk, 0);
    const [spawns] = [...snapshot.getRocketStops().values()];
    const party = createStopParty(snapshot, spawns);

    expect(party).toHaveLength(ROCKET_PARTY_SIZE);
    for (const [at, member] of party.entries()) {
      // Every one rolls its level inside the grunt's band whatever
      // its species would have rolled, and every one is a shadow
      expect(member.level).toBeGreaterThanOrEqual(ROCKET_PARTY_LEVELS[0]);
      expect(member.level).toBeLessThanOrEqual(ROCKET_PARTY_LEVELS[1]);
      expect(new Set(member.abilities).has(Abilities.Shadow)).toBe(true);
      expect(member.species).toBe(spawns[at][0]);
      // It belongs to no catch record, and never sparkles
      expect(member.caught).toBe('');
      expect(isShiny(member)).toBe(false);
      expect(member.items).toEqual([]);
    }

    // The traits are the spawn's own, so the six are not clones of
    // one build
    expect(new Set(party.map((member) => member.nature)).size).toBeGreaterThanOrEqual(1);
    expect(party.map((member) => member.ivs)).not.toEqual([]);

    // A duelling trainer fields the same pokemon as their ordinary
    // selves: same species and level, nothing shadowed
    const duel = createStopParty(snapshot, spawns, false);

    for (const [at, member] of duel.entries()) {
      expect(member.level).toBeGreaterThanOrEqual(ROCKET_PARTY_LEVELS[0]);
      expect(member.level).toBeLessThanOrEqual(ROCKET_PARTY_LEVELS[1]);
      expect(member.species).toBe(spawns[at][0]);
      expect(member.shadow).toBe(false);
      expect(new Set(member.abilities).has(Abilities.Shadow)).toBe(false);
    }
  });

  it('stands duelling trainers at their own landmark', () => {
    const world = new World('overworld');
    const chunk = findChunk(
      world,
      (candidate) => new ChunkSnapshot(candidate, 0).getTrainerStops().size > 0,
    );

    expect(chunk).not.toBeNull();
    if (chunk == null) {
      return;
    }

    const snapshot = new ChunkSnapshot(chunk, 0);
    const lairSpecies = new Set(EVERY_LAIR.flatMap((lair) => getLairResidents(lair)));

    for (const [cell, party] of snapshot.getTrainerStops()) {
      expect(chunk.getLandmarkCells().get(cell)).toBe(Landmark.Trainer);

      const trainer = snapshot.getTrainerClass(cell);

      expect(trainer).not.toBeNull();
      if (trainer == null) {
        continue;
      }

      // Whoever is standing there is one this country puts on the
      // road, or the Ace, who belongs to no country
      expect(getBiomeTrainers(chunk.biome)).toContain(trainer);

      // The Ace fields five of anything; a type expert three to five
      // of their own kind, and nothing of the biome's choosing
      const types = new Set(TRAINER_TYPES[trainer]);

      if (isAceTrainer(trainer)) {
        expect(party).toHaveLength(ACE_PARTY_SIZE);
      } else {
        expect(party.length).toBeGreaterThanOrEqual(TYPE_TRAINER_PARTY_MIN);
        expect(party.length).toBeLessThanOrEqual(TYPE_TRAINER_PARTY_MAX);
      }
      for (const [species] of party) {
        // As grown as its own region goes, never a legendary, and of
        // the class' type. A later region often holds the last stage
        // of an older line, and that stage is not this trainer's
        expect(
          isGrownInRegion(species, TRAINER_REGIONS[trainer]),
          getSpeciesData(species).name,
        ).toBe(true);
        expect(lairSpecies.has(species)).toBe(false);
        if (types.size > 0) {
          expect(
            getSpeciesData(species).types.some((one) => types.has(one)),
            getSpeciesData(species).name,
          ).toBe(true);
        }
      }
      // Dressed from their own class' wardrobe rather than the
      // landmark's old one
      expect(TRAINER_CHARSETS[trainer]).toContain(snapshot.getWandererCoats().get(cell));
    }
  });

  it('gives every trainer class a name, a wardrobe and a pool', () => {
    for (const trainer of TRAINER_CLASSES) {
      expect(TRAINER_NAMES[trainer]).not.toBe('');
      expect(TRAINER_CHARSETS[trainer].length).toBeGreaterThan(0);
      expect(getTrainerPool(trainer).length).toBeGreaterThan(0);
      expect(trainerLevels(trainer)).toEqual(
        isAceTrainer(trainer) ? ACE_TRAINER_LEVELS : TYPE_TRAINER_LEVELS,
      );
    }

    // Two trades may want the same type now, so what has to be one
    // class' own is the coat: no sheet is worn twice
    const worn = TRAINER_CLASSES.flatMap((trainer) => TRAINER_CHARSETS[trainer]);

    expect(new Set(worn).size).toBe(worn.length);
    // And only the Aces field everything there is, one to a region
    expect(TRAINER_CLASSES.filter((trainer) => TRAINER_TYPES[trainer].length === 0)).toEqual(
      TRAINER_CLASSES.filter(isAceTrainer),
    );
  });

  it('rolls Giovanni once in a long while, six strong', () => {
    const world = new World('overworld');
    let staged: { snapshot: ChunkSnapshot; cell: number } | null = null;

    // 1/64 a stop a window: a few hundred stop-windows finds him
    for (let x = 0; x < 48 && staged == null; x++) {
      for (let y = 0; y < 8 && staged == null; y++) {
        const chunk = world.getChunk(x, y);

        for (const [cell, landmark] of chunk.getLandmarkCells()) {
          if (landmark !== Landmark.TeamRocket) {
            continue;
          }
          for (let window = 0; window < 16; window++) {
            const snapshot = new ChunkSnapshot(chunk, window * NPC_INTERVAL);

            if (snapshot.isRocketBoss(cell) && snapshot.getRocketStops().get(cell) != null) {
              staged = { snapshot, cell };
              break;
            }
          }
          if (staged != null) {
            break;
          }
        }
      }
    }

    expect(staged).not.toBeNull();
    if (staged == null) {
      return;
    }

    const party = staged.snapshot.getRocketStops().get(staged.cell) ?? [];
    const legendaries = new Set(EVERY_LAIR.flatMap((lair) => getLairResidents(lair)));
    const homes = getBiomeLairs(staged.snapshot.chunk.biome);
    const endemic = new Set(homes.flatMap((lair) => getLairResidents(lair)));

    // Six strong: five of the biome's rares, and at the end a
    // legendary that lives here. A biome hosting no lair has none for
    // him to have taken, so the sixth is another rare
    expect(party).toHaveLength(6);
    expect(homes.length > 0 ? endemic.has(party[5][0]) : !legendaries.has(party[5][0])).toBe(true);

    // Dressed as the boss himself
    expect(SYNDICATE_BOSS_CHARSETS[staged.snapshot.getSyndicate()]).toContain(
      staged.snapshot.getWandererCoats().get(staged.cell),
    );

    // Fielded at his own level, all shadows. The band is the stop's to
    // pass now that every rank fields six: nothing about the party
    // says whose it is
    const fielded = createStopParty(
      staged.snapshot,
      party,
      true,
      rocketPartyLevels(RocketRank.Boss),
    );

    for (const member of fielded) {
      expect(member.level).toBeGreaterThanOrEqual(GIOVANNI_PARTY_LEVELS[0]);
      expect(member.level).toBeLessThanOrEqual(GIOVANNI_PARTY_LEVELS[1]);
      expect(member.shadow).toBe(true);
    }
  });

  it('never fields Giovanni a legendary the biome cannot host', () => {
    const world = new World('overworld');
    const legendaries = new Set(EVERY_LAIR.flatMap((lair) => getLairResidents(lair)));
    let bosses = 0;
    let barren = 0;

    for (let x = 0; x < 48; x++) {
      for (let y = 0; y < 8; y++) {
        const chunk = world.getChunk(x, y);
        const homes = getBiomeLairs(chunk.biome);
        const endemic = new Set(homes.flatMap((lair) => getLairResidents(lair)));

        for (const [cell, landmark] of chunk.getLandmarkCells()) {
          if (landmark !== Landmark.TeamRocket) {
            continue;
          }
          for (let window = 0; window < 16; window++) {
            const snapshot = new ChunkSnapshot(chunk, window * NPC_INTERVAL);

            if (!snapshot.isRocketBoss(cell)) {
              continue;
            }

            const party = snapshot.getRocketStops().get(cell);

            if (party == null) {
              continue;
            }
            bosses += 1;

            const last = party[party.length - 1][0];

            if (homes.length > 0) {
              expect(endemic.has(last)).toBe(true);
              continue;
            }
            // Nowhere here for one to have come from, so the sixth is
            // a rare like the five in front of it
            barren += 1;
            expect(legendaries.has(last)).toBe(false);
          }
        }
      }
    }

    // Both sides of it are actually walked: most biomes host no lair
    expect(bosses).toBeGreaterThan(0);
    expect(barren).toBeGreaterThan(0);
  });

  it('ranks a Team Rocket cell into a grunt, an executive or the boss', () => {
    const world = new World('overworld');
    const seen = new Map<RocketRank, number>();
    let windows = 0;
    let executive: { snapshot: ChunkSnapshot; cell: number } | null = null;

    for (let x = 0; x < 24; x++) {
      for (let y = 0; y < 6; y++) {
        const chunk = world.getChunk(x, y);

        for (const [cell, landmark] of chunk.getLandmarkCells()) {
          if (landmark !== Landmark.TeamRocket) {
            continue;
          }
          for (let window = 0; window < 24; window++) {
            const snapshot = new ChunkSnapshot(chunk, window * NPC_INTERVAL);
            const rank = snapshot.getRocketRank(cell);

            expect(rank).not.toBeNull();
            if (rank == null) {
              continue;
            }
            seen.set(rank, (seen.get(rank) ?? 0) + 1);
            windows += 1;

            // The three are one draw, so they cannot overlap: only the
            // boss reads as the boss, and only an executive names one
            expect(snapshot.isRocketBoss(cell)).toBe(rank === RocketRank.Boss);
            expect(snapshot.getRocketExecutive(cell) != null).toBe(rank === RocketRank.Executive);

            if (rank === RocketRank.Executive && executive == null) {
              executive = { snapshot, cell };
            }
          }
        }
      }
    }

    expect(windows).toBeGreaterThan(500);

    // Roughly the stated odds: a grunt most of the time, an executive
    // about one window in eight, the boss far rarer than either
    const share = (rank: RocketRank): number => (seen.get(rank) ?? 0) / windows;

    expect(share(RocketRank.Grunt)).toBeGreaterThan(0.7);
    expect(share(RocketRank.Executive)).toBeGreaterThan(EXECUTIVE_CHANCE / 2);
    expect(share(RocketRank.Executive)).toBeLessThan(EXECUTIVE_CHANCE * 2);
    expect(share(RocketRank.Boss)).toBeLessThan(EXECUTIVE_CHANCE);

    // And an executive stands there as one of the four, dressed as
    // themselves, fielding six of the country's rares at the Elite
    // Four's level
    expect(executive).not.toBeNull();
    if (executive == null) {
      return;
    }

    const who = executive.snapshot.getRocketExecutive(executive.cell);

    expect(who).not.toBeNull();
    if (who == null) {
      return;
    }
    expect(EXECUTIVE_CHARSETS[who]).toContain(
      executive.snapshot.getWandererCoats().get(executive.cell),
    );
    expect(EXECUTIVE_NAMES[who].length).toBeGreaterThan(0);

    const party = executive.snapshot.getRocketStops().get(executive.cell) ?? [];
    const rares = new Set(
      spawnRanks(
        getSpawnPool(executive.snapshot.chunk.biome, getTimeOfDay(executive.snapshot.npcTimestamp)),
      )[2].map((entry) => entry.species),
    );

    expect(party).toHaveLength(ROCKET_PARTY_SIZE);
    for (const [species] of party) {
      expect(rares.has(species)).toBe(true);
    }

    const fielded = createStopParty(
      executive.snapshot,
      party,
      true,
      rocketPartyLevels(RocketRank.Executive),
    );

    for (const member of fielded) {
      expect(member.level).toBeGreaterThanOrEqual(ELITE_PARTY_LEVELS[0]);
      expect(member.level).toBeLessThanOrEqual(ELITE_PARTY_LEVELS[1]);
      expect(member.shadow).toBe(true);
    }
  });

  it('fields an expert’s party trained rather than caught', () => {
    const world = new World('overworld');
    const chunk = findChunk(
      world,
      (candidate) => new ChunkSnapshot(candidate, 0).getRocketStops().size > 0,
    );

    expect(chunk).not.toBeNull();
    if (chunk == null) {
      return;
    }

    const snapshot = new ChunkSnapshot(chunk, 0);
    const [spawns] = [...snapshot.getRocketStops().values()];

    // What each rung fields above what it caught: a gym leader gears
    // its six, the Elite Four and the executives train a second
    // ability into them, and a champion and Giovanni do both twice
    expect(stopOutfit(Landmark.Trainer, RocketRank.Grunt)).toEqual(PLAIN_OUTFIT);
    // An Ace Trainer catches what anybody catches and raises it the
    // way the Elite Four do
    expect(stopOutfit(Landmark.Trainer, RocketRank.Grunt, false, TrainerClass.AceTrainer)).toEqual(
      ACE_OUTFIT,
    );
    expect(ACE_OUTFIT.training).toBe(ELITE_OUTFIT.training);
    expect(
      stopOutfit(Landmark.Trainer, RocketRank.Grunt, false, TrainerClass.JohtoAceTrainer),
    ).toEqual(ACE_OUTFIT);
    expect(stopOutfit(Landmark.Trainer, RocketRank.Grunt, false, TrainerClass.Swimmer)).toEqual(
      PLAIN_OUTFIT,
    );
    expect(stopOutfit(Landmark.TeamRocket, RocketRank.Grunt)).toEqual(PLAIN_OUTFIT);
    expect(stopOutfit(Landmark.GymLeader, RocketRank.Grunt)).toEqual(GYM_OUTFIT);
    expect(stopOutfit(Landmark.EliteFour, RocketRank.Grunt)).toEqual(ELITE_OUTFIT);
    expect(stopOutfit(Landmark.TeamRocket, RocketRank.Executive)).toEqual(ELITE_OUTFIT);
    expect(stopOutfit(Landmark.Champion, RocketRank.Grunt)).toEqual(CHAMPION_OUTFIT);
    expect(stopOutfit(Landmark.TeamRocket, RocketRank.Boss)).toEqual(CHAMPION_OUTFIT);
    // And the one rung above the league, which is three of everything
    expect(stopOutfit(Landmark.Champion, RocketRank.Grunt, true)).toEqual(LEGEND_OUTFIT);

    const fielded = (outfit: typeof PLAIN_OUTFIT, shadow = false): CatchSnapshot[] =>
      createStopParty(snapshot, spawns, shadow, ELITE_PARTY_LEVELS, outfit);

    // A duelling trainer's six is what a walk would have met
    for (const member of fielded(PLAIN_OUTFIT)) {
      expect(member.abilities).toHaveLength(1);
      expect(member.items).toEqual([]);
      expect(getSlots(member.slots, Slots.Item)).toBe(1);
      expect(getSlots(member.slots, Slots.Ability)).toBe(1);
    }

    for (const member of fielded(GYM_OUTFIT)) {
      expect(member.abilities).toHaveLength(1);
      // One item, and the one that pokemon would want, which is a
      // question about the set it is fielding rather than its species
      expect(member.items).toEqual(
        getExpertHeldItems(member.species, 1, {
          moves: member.moves,
          abilities: member.abilities,
        }),
      );
      expect(getSlots(member.slots, Slots.Item)).toBe(1);
    }

    for (const member of fielded(ELITE_OUTFIT)) {
      // Two abilities, which nothing met in the world ever has, and
      // room counted for both
      expect(member.abilities.length, getSpeciesData(member.species).name).toBe(
        Math.min(
          2,
          new Set([
            ...getSpeciesAbilityPools(member.species).regular,
            ...getSpeciesAbilityPools(member.species).hidden,
          ]).size,
        ),
      );
      expect(getSlots(member.slots, Slots.Ability)).toBe(member.abilities.length);
      expect(member.items).toHaveLength(1);
    }

    for (const member of fielded(CHAMPION_OUTFIT)) {
      expect(member.items).toHaveLength(2);
      expect(new Set(member.items).size).toBe(2);
      // The room is the outfit's, which is what a Utility Belt would
      // otherwise have to buy
      expect(getSlots(member.slots, Slots.Item)).toBe(2);
    }

    // A shadow's own mark rides free of the ability count, so
    // Giovanni's six carry two abilities and the Shadow besides
    for (const member of fielded(CHAMPION_OUTFIT, true)) {
      expect(new Set(member.abilities).has(Abilities.Shadow)).toBe(true);
      expect(countAbilitySlots(member.abilities)).toBeLessThanOrEqual(2);
      expect(getSlots(member.slots, Slots.Ability)).toBe(countAbilitySlots(member.abilities));
    }

    // And a legend's, which is three of each: a species with fewer
    // than three abilities to give carries what it has, and the items
    // never run short
    for (const member of fielded(LEGEND_OUTFIT)) {
      const pool = new Set([
        ...getSpeciesAbilityPools(member.species).regular,
        ...getSpeciesAbilityPools(member.species).hidden,
      ]);

      expect(member.abilities.length, getSpeciesData(member.species).name).toBe(
        Math.min(3, pool.size),
      );
      expect(new Set(member.abilities).size).toBe(member.abilities.length);
      expect(member.items).toHaveLength(3);
      expect(new Set(member.items).size).toBe(3);
      expect(getSlots(member.slots, Slots.Item)).toBe(3);
      expect(getSlots(member.slots, Slots.Ability)).toBe(member.abilities.length);
    }
  });

  it('fields a built party as two cores behind four supports', () => {
    const world = new World('overworld');
    const chunk = findChunk(
      world,
      (candidate) => new ChunkSnapshot(candidate, 0).getRocketStops().size > 0,
    );

    expect(chunk).not.toBeNull();
    if (chunk == null) {
      return;
    }
    const snapshot = new ChunkSnapshot(chunk, 0);
    const spawns = [...snapshot.getRocketStops().values()][0];
    const party = createStopParty(snapshot, spawns, false, ELITE_PARTY_LEVELS, ELITE_OUTFIT);
    const roles = assignBuildRoles(party.map((member) => member.species));
    const composed = getBestParty(
      party.map((member) => member.species),
      ELITE_OUTFIT.abilities,
    );

    expect(roles.filter((role) => role === BuildRole.Core)).toHaveLength(
      Math.min(CORE_COUNT, party.length),
    );

    for (const [at, member] of party.entries()) {
      // Everything chosen rather than rolled comes off the party's
      // own plan: the jobs, the sky, the abilities, the moves and the
      // nature those moves want
      expect(member.abilities, getSpeciesData(member.species).name).toEqual(composed[at].abilities);
      expect(member.moves).toEqual(composed[at].moves);
      expect(member.nature).toBe(getBestNature(member.species, roles[at], member.moves));
    }

    // A rolled party has no jobs to hand out, so nothing about it
    // moves when the builder changes
    const rolled = createStopParty(snapshot, spawns, false, ELITE_PARTY_LEVELS, PLAIN_OUTFIT);

    for (const [at, member] of rolled.entries()) {
      expect(member.nature).toBe(
        createStopSnapshot(snapshot, spawns[at], false, ELITE_PARTY_LEVELS, PLAIN_OUTFIT).nature,
      );
    }
  });

  it('raises an expert’s party by its rung', () => {
    const world = new World('overworld');
    const chunk = findChunk(
      world,
      (candidate) => new ChunkSnapshot(candidate, 0).getRocketStops().size > 0,
    );

    expect(chunk).not.toBeNull();
    if (chunk == null) {
      return;
    }

    const snapshot = new ChunkSnapshot(chunk, 0);
    const [spawns] = [...snapshot.getRocketStops().values()];
    const fielded = (outfit: typeof PLAIN_OUTFIT): CatchSnapshot[] =>
      createStopParty(snapshot, spawns, false, ELITE_PARTY_LEVELS, outfit);
    const rolled = createStopParty(snapshot, spawns, false, ELITE_PARTY_LEVELS, PLAIN_OUTFIT);

    // A duelling trainer's and a grunt's is what the roll gave, with
    // nothing spent on it
    for (const member of rolled) {
      for (const stat of STAT_ORDER) {
        expect(member.effortValues[stat]).toBe(0);
      }
    }

    // A gym leader's is evenly raised and evenly valued, which is
    // below what a lucky roll would have given
    for (const member of fielded(GYM_OUTFIT)) {
      for (const stat of STAT_ORDER) {
        expect(getIV(member.ivs, stat)).toBe(10);
        expect(member.effortValues[stat]).toBe(50);
      }
    }

    for (const [outfit, polished] of [
      [ELITE_OUTFIT, 2],
      [CHAMPION_OUTFIT, 4],
      [LEGEND_OUTFIT, 6],
    ] as const) {
      const party = fielded(outfit);

      for (const [index, member] of party.entries()) {
        const best = new Set(polishedStats(member.species).slice(0, polished));

        for (const stat of STAT_ORDER) {
          if (best.has(stat)) {
            expect(getIV(member.ivs, stat)).toBe(MAX_IV);
            expect(member.effortValues[stat]).toBe(MAX_EFFORT_PER_STAT);
            continue;
          }
          // Everything else is the roll, untouched, and the rung's
          // even share of training on top
          expect(getIV(member.ivs, stat)).toBe(getIV(rolled[index].ivs, stat));
          expect(member.effortValues[stat]).toBe(50);
        }
        // HP and Speed are what every rung above a gym polishes first
        expect(best.has(Stats.HP)).toBe(true);
        expect(best.has(Stats.Speed)).toBe(true);
      }
    }

    // A legend leaves nothing to raise
    for (const member of fielded(LEGEND_OUTFIT)) {
      expect(member.ivs).toBe(PERFECT_IVS);
    }
  });

  it('polishes the side of its own spread a species leans on', () => {
    // Steelix attacks and defends physically; Alakazam does neither
    expect(polishedStats(Species.Steelix).slice(0, 4)).toEqual([
      Stats.HP,
      Stats.Speed,
      Stats.Attack,
      Stats.Defense,
    ]);
    expect(polishedStats(Species.Alakazam).slice(0, 4)).toEqual([
      Stats.HP,
      Stats.Speed,
      Stats.SpecialAttack,
      Stats.SpecialDefense,
    ]);
    // All six, once, however the spread falls
    for (const species of [Species.Steelix, Species.Alakazam, Species.Snorlax]) {
      expect(new Set(polishedStats(species)).size).toBe(STAT_ORDER.length);
    }
  });

  it('rolls a purse in the stop’s own range, the same on every ask', () => {
    for (let winner = 0; winner < 32; winner++) {
      const seed = `stop:purse:player-${winner}`;
      const purse = rollStopGold(seed, ROCKET_GRUNT_GOLD);
      const bounty = rollStopGold(seed, GIOVANNI_GOLD);

      expect(purse).toBeGreaterThanOrEqual(ROCKET_GRUNT_GOLD[0]);
      expect(purse).toBeLessThanOrEqual(ROCKET_GRUNT_GOLD[1]);
      expect(bounty).toBeGreaterThanOrEqual(GIOVANNI_GOLD[0]);
      expect(bounty).toBeLessThanOrEqual(GIOVANNI_GOLD[1]);
      // Seeded: asking again answers the same
      expect(rollStopGold(seed, ROCKET_GRUNT_GOLD)).toBe(purse);
    }
  });

  it('climbs the purse with the rung, and pays the ladder in order', () => {
    const rungs: [name: string, band: GoldBand][] = [
      ['a type expert', stopGoldBand(Landmark.Trainer, RocketRank.Grunt, TrainerClass.BugCatcher)],
      ['a grunt', stopGoldBand(Landmark.TeamRocket, RocketRank.Grunt)],
      ['a gym leader', stopGoldBand(Landmark.GymLeader, RocketRank.Grunt)],
      ['an Ace Trainer', stopGoldBand(Landmark.Trainer, RocketRank.Grunt, TrainerClass.AceTrainer)],
      ['an executive', stopGoldBand(Landmark.TeamRocket, RocketRank.Executive)],
      ['the Elite Four', stopGoldBand(Landmark.EliteFour, RocketRank.Grunt)],
      ['Giovanni', stopGoldBand(Landmark.TeamRocket, RocketRank.Boss)],
      ['the Champion', stopGoldBand(Landmark.Champion, RocketRank.Grunt)],
      ['a legend', stopGoldBand(Landmark.Champion, RocketRank.Grunt, undefined, true)],
    ];

    for (const [at, [name, [floor, ceiling]]] of rungs.entries()) {
      expect(floor, name).toBeLessThan(ceiling);

      if (at === 0) {
        continue;
      }

      const [below, over] = rungs[at - 1][1];

      // No rung pays less than the one under it, floor and ceiling
      // alike
      expect(floor, name).toBeGreaterThanOrEqual(below);
      expect(ceiling, name).toBeGreaterThanOrEqual(over);
    }

    // And the ladder actually climbs: the top of it is worth an order
    // of magnitude more than the bottom
    expect(CHAMPION_GOLD[0]).toBeGreaterThanOrEqual(TYPE_TRAINER_GOLD[1] * 10);

    // Two rungs share a purse, and it is the two that share a level
    // band: a grunt is a thief with a roadside party
    expect(ROCKET_GRUNT_GOLD).toEqual(TYPE_TRAINER_GOLD);
    expect(ROCKET_PARTY_LEVELS).toEqual(TYPE_TRAINER_LEVELS);

    // A nugget off the ground sells for 10,000, so nothing on the
    // ladder may be worth less than tripping over one
    expect(rungs[0][1][1]).toBeGreaterThanOrEqual(getItemData(Items.Nugget).sell);

    // And the raids are read off the same ladder, flat because a raid
    // pays everybody who fought it
    expect(SHADOW_RAID_GOLD).toBeGreaterThan(GYM_GOLD[0]);
    expect(SHADOW_RAID_GOLD).toBeLessThan(GYM_GOLD[1]);
    expect(LEGENDARY_RAID_GOLD).toBeGreaterThan(ELITE_GOLD[0]);
    expect(LEGENDARY_RAID_GOLD).toBeLessThan(ELITE_GOLD[1]);
    // A mythical is the largest purse there is, and still under a
    // champion's middle
    expect(MYTHICAL_RAID_GOLD).toBeGreaterThan(LEGENDARY_RAID_GOLD);
    expect(MYTHICAL_RAID_GOLD).toBeLessThan(CHAMPION_GOLD[1]);
  });

  it('leaves an item behind only on the rungs that have one', () => {
    const rolls = (landmark: Landmark, rank: RocketRank): Items[] => {
      const rng = new AleaRNG(`loot-${landmark}-${rank}`);

      return Array.from({ length: 400 }, () =>
        rollStopLoot(landmark, rank, Biome.Grassland, () => rng.random()),
      ).filter((item): item is Items => item != null);
    };

    // A duelling trainer keeps their party and their pockets, and so
    // do the two lower Team Rocket ranks. The gym leader is not here
    // either: theirs is a machine of their own type
    expect(rollStopLoot(Landmark.Trainer, RocketRank.Grunt, Biome.Grassland, () => 0.5)).toBeNull();
    expect(
      rollStopLoot(Landmark.TeamRocket, RocketRank.Grunt, Biome.Grassland, () => 0.5),
    ).toBeNull();
    expect(
      rollStopLoot(Landmark.GymLeader, RocketRank.Grunt, Biome.Grassland, () => 0.5),
    ).toBeNull();

    const executive = rolls(Landmark.TeamRocket, RocketRank.Executive);
    const elite = rolls(Landmark.EliteFour, RocketRank.Grunt);
    const champion = rolls(Landmark.Champion, RocketRank.Grunt);

    // Every one of them lands something, and never out of the base
    // band: the odds shut it out
    for (const drawn of [executive, elite, champion]) {
      expect(drawn).toHaveLength(400);
      for (const item of drawn) {
        expect(getItemBand(item)).not.toBe('base');
        expect(getItemBand(item)).not.toBe('uncommon');
      }
    }

    const share = (items: Items[], band: ItemBand): number =>
      items.filter((item) => getItemBand(item) === band).length / items.length;

    // A thief carries loot and the league reaches higher, but nobody
    // reaches the special band: a champion's seat can be fought every
    // window, and a Master Ball handed out at that rate is not a find
    // of a lifetime any more
    for (const drawn of [executive, elite, champion]) {
      expect(share(drawn, 'special')).toBe(0);
    }
    expect(share(elite, 'prized')).toBeGreaterThan(share(executive, 'prized'));
    expect(share(champion, 'prized')).toBeGreaterThan(share(elite, 'prized'));

    // The one exception, and the whole reason to walk into a legend:
    // a rare or a special at twenty to one, which is the only draw in
    // the game that reaches the special band
    const rng = new AleaRNG('loot-legend');
    const legend = Array.from({ length: 4200 }, () =>
      rollStopLoot(Landmark.Champion, RocketRank.Grunt, Biome.Grassland, () => rng.random(), true),
    ).filter((item): item is Items => item != null);

    expect(legend).toHaveLength(4200);
    for (const item of legend) {
      expect(['rare', 'special']).toContain(getItemBand(item));
    }
    expect(share(legend, 'special')).toBeGreaterThan(0.02);
    expect(share(legend, 'special')).toBeLessThan(0.08);
  });

  it('puts a legend in the champion’s seat now and then, and always under the rarest sky', () => {
    const world = new World('overworld');
    const chunk = findChunk(
      world,
      (candidate) => new ChunkSnapshot(candidate, 0).getChampionStops().size > 0,
    );

    expect(chunk).not.toBeNull();
    if (chunk == null) {
      return;
    }

    const [cell] = [...new ChunkSnapshot(chunk, 0).getChampionStops().keys()];
    let held = 0;

    // The seat is the champion's most windows: the roll is the same
    // one in sixty-four Giovanni turns up on
    for (let window = 0; window < 640; window++) {
      const snapshot = new ChunkSnapshot(chunk, window * NPC_INTERVAL);

      // Under one of the four skies that favour everything the seat
      // is theirs for certain: those are the rarest weather there is
      if (favorsEverything(snapshot.npcWeather)) {
        expect(snapshot.getLegend(cell)).not.toBeNull();
        continue;
      }
      if (snapshot.getLegend(cell) != null) {
        held++;
      }
    }
    expect(held).toBeGreaterThan(0);
    expect(held).toBeLessThan(64);

    // The seat holds whoever it holds for the whole window, whatever
    // the sky does in the middle of it: weather turns over every hour
    // and the people every three, and a server rebuilding the window
    // from its timestamp has to find the same person standing there
    for (let window = 0; window < 32; window++) {
      const opened = new ChunkSnapshot(chunk, window * NPC_INTERVAL);
      const later = new ChunkSnapshot(chunk, window * NPC_INTERVAL + 2 * WEATHER_INTERVAL);

      expect(later.getLegend(cell)).toBe(opened.getLegend(cell));
    }

    // A cell that is nobody's seat holds no legend either
    const elsewhere = [...chunk.getLandmarkCells()].find(
      ([, landmark]) => landmark !== Landmark.Champion,
    );

    expect(new ChunkSnapshot(chunk, 0).getLegend(elsewhere?.[0] ?? 0)).toBeNull();
  });

  it('keeps one leader to a gym and fields 6 of their type', () => {
    const world = new World('overworld');
    const chunk = findChunk(
      world,
      (candidate) => new ChunkSnapshot(candidate, 0).getGymStops().size > 0,
    );

    expect(chunk).not.toBeNull();
    if (chunk == null) {
      return;
    }

    const snapshot = new ChunkSnapshot(chunk, 0);

    for (const [cell, party] of snapshot.getGymStops()) {
      expect(chunk.getLandmarkCells().get(cell)).toBe(Landmark.GymLeader);
      expect(party).toHaveLength(EXPERT_PARTY_SIZE);

      const leader = snapshot.getGymLeader(cell);

      expect(leader).not.toBeNull();
      if (leader == null) {
        continue;
      }
      // The biome names the candidates, so a badge has a country to
      // be hunted in — and the next window keeps whoever was seated
      expect(BIOME_GYM_LEADERS[chunk.biome]).toContain(leader);
      expect(new ChunkSnapshot(chunk, NPC_INTERVAL).getGymLeader(cell)).toBe(leader);

      // Every fielded species carries the gym's type
      for (const [species] of party) {
        expect(getSpeciesData(species).types).toContain(GYM_LEADER_TYPES[leader]);
      }
      // Dressed as the leader themselves
      expect(GYM_LEADER_CHARSETS[leader]).toContain(snapshot.getWandererCoats().get(cell));
    }
  });

  it('stages the elite and the champion with full parties of their own', () => {
    const world = new World('overworld');
    const eliteChunk = findChunk(
      world,
      (candidate) => new ChunkSnapshot(candidate, 0).getEliteStops().size > 0,
    );

    expect(eliteChunk).not.toBeNull();
    if (eliteChunk != null) {
      const snapshot = new ChunkSnapshot(eliteChunk, 0);

      for (const [cell, party] of snapshot.getEliteStops()) {
        const member = snapshot.getEliteMember(cell);

        expect(party).toHaveLength(EXPERT_PARTY_SIZE);
        expect(member).not.toBeNull();
        if (member == null) {
          continue;
        }
        expect(BIOME_ELITE_MEMBERS[eliteChunk.biome]).toContain(member);

        // Their own pool rather than their type alone: an elite whose
        // type runs to one fully-grown species is widened by kinship
        // or by name, so the party is checked against the pool
        const pool = new Set(getEliteMemberRoster(member));

        for (const [species] of party) {
          expect(pool.has(species), getSpeciesData(species).name).toBe(true);
        }
        expect(ELITE_MEMBER_CHARSETS[member]).toContain(snapshot.getWandererCoats().get(cell));
      }
    }

    const champChunk = findChunk(
      world,
      (candidate) => new ChunkSnapshot(candidate, 0).getChampionStops().size > 0,
    );

    expect(champChunk).not.toBeNull();
    if (champChunk != null) {
      const snapshot = new ChunkSnapshot(champChunk, 0);
      const legendaries = new Set(EVERY_LAIR.flatMap((lair) => getLairResidents(lair)));

      for (const [cell, party] of snapshot.getChampionStops()) {
        expect(party).toHaveLength(EXPERT_PARTY_SIZE);
        // The Champion fields no legendary: those belong to raids
        for (const [species] of party) {
          expect(legendaries.has(species)).toBe(false);
        }
        // The seat is the champion's, but a legend may have it this
        // window, and then the coat standing there is theirs
        const legend = snapshot.getLegend(cell);

        if (legend != null) {
          expect(LEGEND_CHARSETS[legend]).toContain(snapshot.getWandererCoats().get(cell));
          continue;
        }

        const champion = snapshot.getChampion(cell);

        expect(champion).not.toBeNull();
        expect(CHAMPION_CHARSETS[champion ?? Champion.Blue]).toContain(
          snapshot.getWandererCoats().get(cell),
        );
      }
    }
  });

  it('prices every rank of stop by its landmark', () => {
    expect(stopPartyLevels(Landmark.GymLeader, RocketRank.Grunt)).toEqual(GYM_PARTY_LEVELS);
    expect(stopPartyLevels(Landmark.EliteFour, RocketRank.Grunt)).toEqual(ELITE_PARTY_LEVELS);
    expect(stopPartyLevels(Landmark.Champion, RocketRank.Grunt)).toEqual(CHAMPION_PARTY_LEVELS);
    expect(stopPartyLevels(Landmark.Champion, RocketRank.Grunt, undefined, true)).toEqual(
      LEGEND_PARTY_LEVELS,
    );
    // Every rank fields six, so it is the rank rather than the party
    // that says what a Team Rocket cell is worth
    expect(stopPartyLevels(Landmark.TeamRocket, RocketRank.Boss)).toEqual(CHAMPION_PARTY_LEVELS);
    expect(stopPartyLevels(Landmark.TeamRocket, RocketRank.Executive)).toEqual(ELITE_PARTY_LEVELS);
    expect(stopPartyLevels(Landmark.TeamRocket, RocketRank.Grunt)).toEqual(TYPE_TRAINER_LEVELS);
    // A duellist's band is their class', which the caller passes in
    expect(stopPartyLevels(Landmark.Trainer, RocketRank.Grunt, ACE_TRAINER_LEVELS)).toEqual(
      ACE_TRAINER_LEVELS,
    );
    expect(stopPartyLevels(Landmark.Trainer, RocketRank.Grunt)).toEqual(ROCKET_PARTY_LEVELS);

    // The purse is read the same way, so a Team Rocket cell is priced
    // by who is standing on it rather than by what they brought
    expect(stopGoldBand(Landmark.TeamRocket, RocketRank.Boss)).toEqual(GIOVANNI_GOLD);
    expect(stopGoldBand(Landmark.TeamRocket, RocketRank.Grunt)).toEqual(ROCKET_GRUNT_GOLD);
    expect(stopGoldBand(Landmark.Champion, RocketRank.Grunt)).toEqual(CHAMPION_GOLD);
    expect(stopGoldBand(Landmark.EliteFour, RocketRank.Grunt)).toEqual(ELITE_GOLD);
    expect(stopGoldBand(Landmark.GymLeader, RocketRank.Grunt)).toEqual(GYM_GOLD);
  });

  it('offers any of the boss’ six as the reward', () => {
    const record: StopRecord = {
      player: 'red',
      party: [
        Species.Magnemite,
        Species.Voltorb,
        Species.Porygon,
        Species.Growlithe,
        Species.Ponyta,
        Species.Mewtwo,
      ].map((species, at) => ({
        species,
        individualValue: at,
        traitValue: at,
      })),
      battle: 'battle-id',
      timestamp: 0,
      offset: 0,
      chunk: { seed: 'overworld0,0', x: 0, y: 0 },
      cell: 60,
      defeated: false,
    };
    const met = new Set<Species>();

    for (let winner = 0; winner < 64; winner++) {
      const [, spawn] = deriveStopReward(record, 'stop-id', `player-${winner}`);

      met.add(spawn[0]);
    }
    // Not the weaker half alone: the back of the party is on offer,
    // the legendary included
    expect(met.size).toBeGreaterThan(3);
    expect(
      [...met].some((species) => record.party.slice(3).some((entry) => entry.species === species)),
    ).toBe(true);
  });

  it('pays a beaten grunt out of the half it was not fighting with', () => {
    const record: StopRecord = {
      player: 'red',
      party: [
        { species: Species.Rattata, individualValue: 1, traitValue: 2 },
        { species: Species.Pidgey, individualValue: 3, traitValue: 4 },
        { species: Species.Ekans, individualValue: 5, traitValue: 6 },
        { species: Species.Kangaskhan, individualValue: 7, traitValue: 8 },
        { species: Species.Lapras, individualValue: 9, traitValue: 10 },
        { species: Species.Snorlax, individualValue: 11, traitValue: 12 },
      ],
      battle: 'battle-id',
      timestamp: 0,
      offset: 0,
      chunk: { seed: 'chunk', x: 0, y: 0 },
      cell: 0,
      defeated: false,
    };

    const offered = new Set<Species>();

    for (const uid of ['red', 'blue', 'green', 'yellow', 'gold', 'silver']) {
      const [id, [species, individualValue, traitValue]] = deriveStopReward(record, 'stop-id', uid);

      offered.add(species);
      expect(id).toBe('stop-id$reward');
      // Each winner meets their own individual of it
      expect(individualValue).not.toBe(traitValue);
    }

    // Every one of the six comes up across enough winners: a grunt
    // puts its whole party up the way the ranks above it do
    expect(offered.size).toBeGreaterThan(1);

    // A player's own reward is the same however often it is derived
    expect(deriveStopReward(record, 'stop-id', 'red')).toEqual(
      deriveStopReward(record, 'stop-id', 'red'),
    );
  });

  it('stages a shadow lair from the biome, or from its rare band', () => {
    const world = new World('overworld');
    const chunk = findChunk(world, (candidate) =>
      new Set(candidate.getLandmarkCells().values()).has(Landmark.ShadowLair),
    );

    expect(chunk).not.toBeNull();
    if (chunk == null) {
      return;
    }

    const time = getTimeOfDay(0);
    const pool = getSpawnPool(chunk.biome, time);
    const hosted = new Set(getBiomeLairs(chunk.biome));
    const raids = new ChunkSnapshot(chunk, 0).getShadowLairs();

    expect(raids.size).toBeGreaterThan(0);
    for (const [cell, roll] of raids) {
      expect(chunk.getLandmarkCells().get(cell)).toBe(Landmark.ShadowLair);

      if (roll.lair == null) {
        // No named place behind it, so it is one of the biome's own
        // grown species and it is called after the ground
        expect(spawnRanks(pool)[2].some((entry) => entry.species === roll.species)).toBe(true);
        expect(getLairTitle(roll.lair, chunk.biome, true)).toBe(
          `Shadow ${BIOME_NAMES[chunk.biome]} Lair`,
        );
        continue;
      }

      // Otherwise it has taken over one of the biome's own lairs, and
      // is called that place with a word in front of it
      expect(hosted.has(roll.lair)).toBe(true);
      expect(getLairResidents(roll.lair)).toContain(roll.species);
      expect(getSpawnRarity(roll.species)).toBe(SpawnRarity.Special);
    }

    // The window holds the roll, the same way legendary raids do
    expect([...new ChunkSnapshot(chunk, 30 * 60 * 1000).getShadowLairs()]).toEqual([...raids]);
  });

  it('lets a shadow take over one of the biome own lairs', () => {
    const world = new World('overworld');
    // A mountain has two lairs to be taken over, so a run of windows
    // turns one up
    const chunk = findChunk(
      world,
      (candidate) =>
        candidate.biome === Biome.Mountain &&
        new Set(candidate.getLandmarkCells().values()).has(Landmark.ShadowLair),
    );

    expect(chunk).not.toBeNull();
    if (chunk == null) {
      return;
    }

    const taken = new Set<string>();

    for (let window = 0; window < 200; window++) {
      for (const roll of new ChunkSnapshot(chunk, window * RAID_INTERVAL)
        .getShadowLairs()
        .values()) {
        taken.add(getLairTitle(roll.lair, chunk.biome, true));
      }
    }

    // Both kinds turn up: the shadowed place, and the nameless one
    expect(taken.has('Shadow Mt. Ember') || taken.has('Shadow Cerulean Cave')).toBe(true);
    expect(taken.has(`Shadow ${BIOME_NAMES[Biome.Mountain]} Lair`)).toBe(true);
  });

  it('gives a shadow boss both the Boss and Shadow abilities', () => {
    const shadow = createRaidBossSnapshot(Species.Gyarados, 0x12345678, true);
    const plain = createRaidBossSnapshot(Species.Gyarados, 0x12345678);

    expect(shadow.abilities).toEqual([
      Abilities.Boss,
      Abilities.Shadow,
      deriveAbility(Species.Gyarados, 0x12345678),
    ]);
    expect(plain.abilities).not.toContain(Abilities.Shadow);

    // Everything else about the boss is unchanged
    expect(shadow.level).toBe(plain.level);
    expect(shadow.ivs).toBe(plain.ivs);
  });

  it('starts a player in a free cell of the starting region', () => {
    const world = new World('overworld');
    const start = pickStartPosition(world, 'player-uid');

    // Somewhere in the 1000x1000 square centered on the origin
    expect(start.chunkX).toBeGreaterThanOrEqual(-START_AREA / 2);
    expect(start.chunkX).toBeLessThan(START_AREA / 2);
    expect(start.chunkY).toBeGreaterThanOrEqual(-START_AREA / 2);
    expect(start.chunkY).toBeLessThan(START_AREA / 2);

    // Never on a fixture: nobody opens the game already standing on a
    // raid, and nobody opens it inside a boulder either
    const chunk = world.getChunk(start.chunkX, start.chunkY);

    expect(chunk.getLandmarkAt(start.cellX, start.cellY)).toBeNull();
    // The same holds wherever anything is put down without walking
    // there, which is what a teleport is
    for (let at = 0; at < 100; at++) {
      const ground = world.getChunk(at - 50, at * 3);
      const where = pickFreeCell(world, at - 50, at * 3, new AleaRNG(`free-${at}`));
      const cell = where.cellY * CHUNK_CELLS + where.cellX;

      expect(ground.getLandmarkCells().has(cell)).toBe(false);
      expect(ground.getDecorationCells().has(cell)).toBe(false);
      expect(ground.getRockCells().has(cell)).toBe(false);
    }

    // The same player lands in the same place every time, and
    // different players spread out
    expect(pickStartPosition(world, 'player-uid')).toEqual(start);
    expect(pickStartPosition(world, 'other-uid')).not.toEqual(start);
  });

  it('publishes room for the lure as well as the ordinary spawns', () => {
    // What a visit writes has to hold the extras, since the window
    // publishes them for everybody and a lure only decides who may
    // reach them. It is one figure, kept beside the publishing
    expect(PUBLISHED_SPAWNS).toBe(SPAWN_COUNT + LURE_SPAWN_BONUS);
  });

  it('draws two more spawns out for a buddy that lures', () => {
    const alone = createOverworld('player-uid', null);

    expect(alone.checkSpawnCount(SPAWN_COUNT)).toBe(SPAWN_COUNT);
    expect(createOverworld('player-uid', buddyWith([])).checkSpawnCount(SPAWN_COUNT)).toBe(
      SPAWN_COUNT,
    );

    // Each of the three lures is worth the same two
    for (const lure of [Abilities.ArenaTrap, Abilities.Illuminate, Abilities.NoGuard]) {
      expect(createOverworld('player-uid', buddyWith([lure])).checkSpawnCount(SPAWN_COUNT)).toBe(
        SPAWN_COUNT + LURE_SPAWN_BONUS,
      );
    }
  });

  it('reaches further into the dark with an Illuminate buddy', () => {
    const alone = createOverworld('player-uid', null);

    expect(alone.checkLampReach(DARK_DAY_LAMP_CELLS)).toBe(DARK_DAY_LAMP_CELLS);
    expect(
      createOverworld('player-uid', buddyWith([Abilities.Synchronize])).checkLampReach(
        DARK_DAY_LAMP_CELLS,
      ),
    ).toBe(DARK_DAY_LAMP_CELLS);

    // The lantern is Illuminate's alone: the other two lures draw more
    // out of a chunk and light none of it
    for (const lure of [Abilities.ArenaTrap, Abilities.NoGuard]) {
      expect(
        createOverworld('player-uid', buddyWith([lure])).checkLampReach(DARK_DAY_LAMP_CELLS),
      ).toBe(DARK_DAY_LAMP_CELLS);
    }
    // A lantern is a reach of its own rather than a multiple of the
    // one it replaces: three cells, whatever a player walking alone
    // sees
    expect(
      createOverworld('player-uid', buddyWith([Abilities.Illuminate])).checkLampReach(
        DARK_DAY_LAMP_CELLS,
      ),
    ).toBeCloseTo(ILLUMINATE_LAMP_CELLS);
  });

  it('keeps a chunk quiet for a buddy that smells', () => {
    expect(
      createOverworld('player-uid', buddyWith([Abilities.Stench])).checkSpawnCount(SPAWN_COUNT),
    ).toBe(SPAWN_COUNT - STENCH_QUIET);

    // A lure and a stink cancel as far as they go, and nothing ever
    // quiets a chunk below nothing
    expect(createOverworld('player-uid', buddyWith([Abilities.Stench])).checkSpawnCount(1)).toBe(0);
  });

  it('lifts the band a meeting rolls in, from either end', () => {
    const band: [number, number] = [10, 20];
    const alone = createOverworld('player-uid', null);

    expect(alone.checkEncounterLevels('spawn@0', band)).toEqual(band);

    // Wary keeps the weak away; fierce draws the strong out; a buddy
    // with one of each does both
    expect(
      createOverworld('player-uid', buddyWith([Abilities.KeenEye])).checkEncounterLevels(
        'spawn@0',
        band,
      ),
    ).toEqual([10 + LEVEL_FLOOR_LIFT, 20]);
    expect(
      createOverworld('player-uid', buddyWith([Abilities.Hustle])).checkEncounterLevels(
        'spawn@0',
        band,
      ),
    ).toEqual([10, 20 + LEVEL_CEILING_LIFT]);
    expect(
      createOverworld(
        'player-uid',
        buddyWith([Abilities.Intimidate, Abilities.Pressure]),
      ).checkEncounterLevels('spawn@0', band),
    ).toEqual([10 + LEVEL_FLOOR_LIFT, 20 + LEVEL_CEILING_LIFT]);

    // A floor lifted past the ceiling is a band of one level rather
    // than a band that reads backwards
    expect(
      createOverworld('player-uid', buddyWith([Abilities.KeenEye])).checkEncounterLevels(
        'spawn@0',
        [10, 11],
      ),
    ).toEqual([11, 11]);
  });

  it('finds what a meeting is carrying, and says so', () => {
    const alone = createOverworld('player-uid', null);

    expect(alone.checkEncounterHeld('spawn@0')).toBe(1);
    expect(alone.checkRevealsHeld()).toBe(false);

    expect(
      createOverworld('player-uid', buddyWith([Abilities.CompoundEyes])).checkEncounterHeld(
        'spawn@0',
      ),
    ).toBe(COMPOUND_EYES_HELD_BOOST);
    expect(createOverworld('player-uid', buddyWith([Abilities.Frisk])).checkRevealsHeld()).toBe(
      true,
    );
    // Seeing what it holds and drawing more of it out are separate
    // buddies: neither does the other's work
    expect(
      createOverworld('player-uid', buddyWith([Abilities.Frisk])).checkEncounterHeld('spawn@0'),
    ).toBe(1);
    expect(
      createOverworld('player-uid', buddyWith([Abilities.CompoundEyes])).checkRevealsHeld(),
    ).toBe(false);
  });

  it('talks an encounter into a nature and a gender', () => {
    const buddy = buddyWith([Abilities.Synchronize, Abilities.CuteCharm]);
    const overworld = createOverworld('player-uid', buddy);
    const spawns = Array.from({ length: 60 }, (_, index) => `sync@0#${index}`);

    const natures = spawns.map((spawn) => overworld.checkEncounterNature(spawn, Natures.Timid));
    const genders = spawns.map((spawn) => overworld.checkEncounterGender(spawn, Genders.Male));

    // Some of each, and never anything but the buddy's nature or the
    // opposite of its gender
    expect(natures.filter((nature) => nature === buddy.nature).length).toBeGreaterThan(0);
    expect(natures.filter((nature) => nature === Natures.Timid).length).toBeGreaterThan(0);
    expect(new Set(natures)).toEqual(new Set([Natures.Timid, buddy.nature]));

    expect(genders.filter((gender) => gender === Genders.Female).length).toBeGreaterThan(0);
    expect(new Set(genders)).toEqual(new Set([Genders.Male, Genders.Female]));

    // A buddy with neither ability changes nothing, and a genderless
    // one has nothing to charm
    const plain = createOverworld('player-uid', buddyWith([Abilities.Overgrow]));

    expect(plain.checkEncounterNature(spawns[0], Natures.Timid)).toBe(Natures.Timid);
    expect(plain.checkEncounterGender(spawns[0], Genders.Male)).toBe(Genders.Male);

    const genderless = createOverworld('player-uid', {
      ...buddy,
      gender: Genders.Genderless,
    });

    expect(genderless.checkEncounterGender(spawns[0], Genders.Male)).toBe(Genders.Male);
    expect(overworld.checkEncounterGender(spawns[0], Genders.Genderless)).toBe(Genders.Genderless);
  });

  it('lifts the shiny odds for a buddy holding the charm', () => {
    const plain = createOverworld('player-uid', buddyWith([]));
    const charmed = createOverworld('player-uid', {
      ...buddyWith([]),
      items: [Items.ShinyCharm],
    });

    expect(createOverworld('player-uid', null).checkEncounterShiny('spawn#0')).toBe(1);
    expect(plain.checkEncounterShiny('spawn#0')).toBe(1);
    expect(charmed.checkEncounterShiny('spawn#0')).toBe(SHINY_CHARM_BOOST);
  });

  it('lifts every throw for a buddy holding the catching charm', () => {
    const plain = createOverworld('player-uid', buddyWith([]));
    const charmed = createOverworld('player-uid', {
      ...buddyWith([]),
      items: [Items.CatchingCharm],
    });

    const wild = metWild(Species.Rattata);

    expect(createOverworld('player-uid', null).checkCatchChance('spawn#0', wild)).toBe(1);
    expect(plain.checkCatchChance('spawn#0', wild)).toBe(1);
    expect(charmed.checkCatchChance('spawn#0', wild)).toBe(CATCHING_CHARM_BOOST);
    // The two charms answer different questions, so neither is worth
    // anything on the other's
    expect(charmed.checkEncounterShiny('spawn#0')).toBe(1);
  });

  it('holds a meeting still for a buddy that traps', () => {
    const alone = createOverworld('player-uid', null);
    const wild = metWild(Species.Rattata);

    expect(alone.checkFleeChance('spawn#0', wild)).toBe(1);
    expect(createOverworld('player-uid', buddyWith([])).checkFleeChance('spawn#0', wild)).toBe(1);

    for (const trap of [Abilities.ArenaTrap, Abilities.ShadowTag]) {
      expect(
        createOverworld('player-uid', buddyWith([trap])).checkFleeChance('spawn#0', wild),
      ).toBe(TRAP_FLEE_FACTOR);
    }

    // Arena Trap is a lure as well, and the two answers are separate:
    // neither ability reads on the other's question
    expect(
      createOverworld('player-uid', buddyWith([Abilities.ShadowTag])).checkSpawnCount(SPAWN_COUNT),
    ).toBe(SPAWN_COUNT);
    expect(
      createOverworld('player-uid', buddyWith([Abilities.Illuminate])).checkFleeChance(
        'spawn#0',
        wild,
      ),
    ).toBe(1);
  });

  it('pins down what a Magnet Pull buddy has a hold on, and nothing else', () => {
    const magnetic = createOverworld('player-uid', buddyWith([Abilities.MagnetPull]));

    // Magnemite is a Steel type and Rattata is not, so one of them
    // cannot get away at all and the other leaves when it likes
    expect(magnetic.checkFleeChance('spawn#0', metWild(Species.Magnemite))).toBe(0);
    expect(magnetic.checkFleeChance('spawn#0', metWild(Species.Rattata))).toBe(1);
    expect(
      createOverworld('player-uid', buddyWith([])).checkFleeChance(
        'spawn#0',
        metWild(Species.Magnemite),
      ),
    ).toBe(1);
  });

  it('throws truer at a shadow for a buddy that has been one', () => {
    const purified = createOverworld('player-uid', buddyWith([Abilities.Purified]));
    const plain = createOverworld('player-uid', buddyWith([]));

    expect(purified.checkCatchChance('spawn#0', metWild(Species.Rattata, true))).toBe(
      PURIFIED_SHADOW_RELIEF,
    );
    // Nothing changes for a meeting whose heart was never closed
    expect(purified.checkCatchChance('spawn#0', metWild(Species.Rattata))).toBe(1);
    expect(plain.checkCatchChance('spawn#0', metWild(Species.Rattata, true))).toBe(1);
    // It gives something back, which the old formula stopped doing the
    // day a shadow became a half rather than a third
    expect(PURIFIED_SHADOW_RELIEF).toBeGreaterThan(1);
    // And less than the shadow took, so a shadow stays the harder catch
    expect(PURIFIED_SHADOW_RELIEF * SHADOW_CATCH_FACTOR).toBeLessThan(1);
  });

  it('carries a bagful of treats further, and grows the last one back', () => {
    const plain = createOverworld('player-uid', buddyWith([]));
    const greedy = createOverworld('player-uid', buddyWith([Abilities.Gluttony]));
    const grower = createOverworld('player-uid', buddyWith([Abilities.Harvest]));

    expect(plain.checkTreats('spawn#0', MAX_CATCH_BONUS)).toEqual({
      cap: MAX_CATCH_BONUS,
      keeps: false,
    });
    expect(greedy.checkTreats('spawn#0', MAX_CATCH_BONUS).cap).toBe(
      MAX_CATCH_BONUS * GLUTTONY_FEAST,
    );
    expect(greedy.checkTreats('spawn#0', MAX_CATCH_BONUS).keeps).toBe(false);
    expect(grower.checkTreats('spawn#0', MAX_CATCH_BONUS)).toEqual({
      cap: MAX_CATCH_BONUS,
      keeps: true,
    });
  });

  it('comes back from the hedges with a Honey Gather buddy', () => {
    const gatherer = createOverworld('player-uid', buddyWith([Abilities.HoneyGather]));
    const far = HONEY_STEP_INTERVAL * 4;

    expect(gatherer.checkWalkPickup('buddy', 0, far).gathered).toBe(4);
    // What grows is not what is dropped: it finds nothing on the
    // ground, the way a Pickup buddy finds nothing on a bush
    expect(gatherer.checkWalkPickup('buddy', 0, far).found).toBe(0);
    expect(gatherer.checkWalkPickup('buddy', 0, HONEY_STEP_INTERVAL - 1).gathered).toBe(0);
  });

  it('reads a meeting for a Forewarn buddy and its pockets for a Pickpocket one', () => {
    const plain = createOverworld('player-uid', buddyWith([]));

    expect(plain.checkRevealsFlight()).toBe(false);
    expect(plain.checkPockets('spawn#0')).toBe(false);
    // The two readers answer alike: out here there is one thing to
    // read about a meeting, and both of them read it
    for (const reader of [Abilities.Forewarn, Abilities.Anticipation]) {
      expect(createOverworld('player-uid', buddyWith([reader])).checkRevealsFlight()).toBe(true);
    }
    expect(
      createOverworld('player-uid', buddyWith([Abilities.Pickpocket])).checkPockets('spawn#0'),
    ).toBe(true);
    // Neither reads on the other's question, nor on Frisk's
    expect(createOverworld('player-uid', buddyWith([Abilities.Frisk])).checkRevealsFlight()).toBe(
      false,
    );
    expect(createOverworld('player-uid', buddyWith([Abilities.Forewarn])).checkRevealsHeld()).toBe(
      false,
    );
  });

  it('lifts a throw at what a buddy shares an element with', () => {
    const water = metWild(Species.Squirtle);
    const plain = metWild(Species.Rattata);

    for (const kin of [Abilities.StormDrain, Abilities.WaterAbsorb]) {
      const buddy = createOverworld('player-uid', buddyWith([kin]));

      expect(buddy.checkCatchChance('spawn#0', water)).toBe(KINSHIP_CATCH_BOOST);
      // Nothing for a meeting that shares nothing with it
      expect(buddy.checkCatchChance('spawn#0', plain)).toBe(1);
      // And it lifts the throw rather than holding the meeting down,
      // which is what separates it from Magnet Pull
      expect(buddy.checkFleeChance('spawn#0', water)).toBe(1);
    }
    expect(
      createOverworld('player-uid', buddyWith([Abilities.SapSipper])).checkCatchChance(
        'spawn#0',
        water,
      ),
    ).toBe(1);
  });

  it('reads what a meeting can do for a Trace buddy', () => {
    expect(createOverworld('player-uid', buddyWith([])).checkRevealsAbility()).toBe(false);
    expect(createOverworld('player-uid', buddyWith([Abilities.Trace])).checkRevealsAbility()).toBe(
      true,
    );
    // Three readers, three separate questions
    expect(createOverworld('player-uid', buddyWith([Abilities.Trace])).checkRevealsHeld()).toBe(
      false,
    );
    expect(createOverworld('player-uid', buddyWith([Abilities.Frisk])).checkRevealsAbility()).toBe(
      false,
    );
  });

  it('sharpens a throw for a buddy that knows where to aim', () => {
    const wild = metWild(Species.Rattata);

    expect(
      createOverworld('player-uid', buddyWith([])).checkCriticalCatch('spawn#0', wild),
    ).toEqual({ boost: 1, aims: 1 });

    // The two are halves rather than copies: Super Luck is how often a
    // throw comes out critical, Sniper is how well the one it gets
    // goes
    expect(
      createOverworld('player-uid', buddyWith([Abilities.SuperLuck])).checkCriticalCatch(
        'spawn#0',
        wild,
      ),
    ).toEqual({ boost: KEEN_CRITICAL_BOOST, aims: 1 });
    expect(
      createOverworld('player-uid', buddyWith([Abilities.Sniper])).checkCriticalCatch(
        'spawn#0',
        wild,
      ),
    ).toEqual({ boost: 1, aims: SNIPER_AIMS });

    // It is its own question: neither of them lifts an ordinary throw
    expect(
      createOverworld('player-uid', buddyWith([Abilities.SuperLuck])).checkCatchChance(
        'spawn#0',
        wild,
      ),
    ).toBe(1);
  });

  it('pays candy for what a buddy is carrying, to the right family', () => {
    // The buddy is a Bulbasaur; the pokemon being caught is not
    const buddyFamily = getSpeciesData(Species.Bulbasaur).family;
    const caughtFamily = getSpeciesData(Species.Rattata).family;

    expect(buddyFamily).not.toBe(caughtFamily);

    const carrying = (item: Items): Overworld =>
      createOverworld('player-uid', { ...buddyWith([]), items: [item] });
    const shared = carrying(Items.ExpShare);
    const lucky = carrying(Items.LuckyEgg);
    let sharedPaid = 0;
    let luckyPaid = 0;
    let plainPaid = 0;

    // Half the catches, so a run of them shows both outcomes; every
    // payment is one candy, and it always goes to the same family
    for (let index = 0; index < 40; index++) {
      const spawn = `spawn#${index}`;

      for (const [family, count] of shared.checkCatchCandy(spawn, caughtFamily)) {
        expect(family).toBe(buddyFamily);
        expect(count).toBe(CANDY_ITEM_BONUS);
        sharedPaid += 1;
      }
      for (const [family, count] of lucky.checkCatchCandy(spawn, caughtFamily)) {
        expect(family).toBe(caughtFamily);
        expect(count).toBe(CANDY_ITEM_BONUS);
        luckyPaid += 1;
      }
      // Carrying nothing pays nothing, and neither does walking alone
      plainPaid += createOverworld('player-uid', buddyWith([])).checkCatchCandy(
        spawn,
        caughtFamily,
      ).size;
      plainPaid += createOverworld('player-uid', null).checkCatchCandy(spawn, caughtFamily).size;
    }

    expect(plainPaid).toBe(0);
    // Neither certain nor never: both land somewhere inside the run
    expect(sharedPaid).toBeGreaterThan(0);
    expect(sharedPaid).toBeLessThan(40);
    expect(luckyPaid).toBeGreaterThan(0);
    expect(luckyPaid).toBeLessThan(40);
  });

  it('pays an Exp. Share buddy of the caught line from both sides', () => {
    // The one case where the two items would meet: the buddy is of
    // the family being caught, so an Exp. Share pays the same stack
    // a Lucky Egg would
    const family = getSpeciesData(Species.Bulbasaur).family;
    const shared = createOverworld('player-uid', { ...buddyWith([]), items: [Items.ExpShare] });

    for (let index = 0; index < 20; index++) {
      const bonus = shared.checkCatchCandy(`spawn#${index}`, family);

      // One item, so one candy at most — never doubled by the two
      // families happening to be the same
      expect([...bonus.values()].every((count) => count === CANDY_ITEM_BONUS)).toBe(true);
      expect(bonus.size).toBeLessThanOrEqual(1);
    }
  });

  it('warms an egg picked up beside a Flame Body or Magma Armor buddy', () => {
    const warm = createOverworld('player-uid', buddyWith([Abilities.FlameBody]));
    const plain = createOverworld('player-uid', buddyWith([Abilities.Overgrow]));

    expect(warm.checkEggSteps('egg', EGG_HATCH_STEPS)).toBe(EGG_HATCH_STEPS * FLAME_BODY_FACTOR);
    // The other warm one is worth exactly the same walk
    expect(
      createOverworld('player-uid', buddyWith([Abilities.MagmaArmor])).checkEggSteps(
        'egg',
        EGG_HATCH_STEPS,
      ),
    ).toBe(EGG_HATCH_STEPS * FLAME_BODY_FACTOR);
    expect(plain.checkEggSteps('egg', EGG_HATCH_STEPS)).toBe(EGG_HATCH_STEPS);
    expect(createOverworld('player-uid', null).checkEggSteps('egg', EGG_HATCH_STEPS)).toBe(
      EGG_HATCH_STEPS,
    );

    // However short the walk gets, there is always one step of it
    expect(warm.checkEggSteps('egg', 1)).toBe(1);
  });

  it('turns something up every so far for a Pickup buddy', () => {
    const finder = createOverworld('player-uid', buddyWith([Abilities.Pickup]));
    const plain = createOverworld('player-uid', buddyWith([Abilities.Overgrow]));
    const far = PICKUP_STEP_INTERVAL * 3;

    expect(finder.checkWalkPickup('buddy', 0, far).found).toBe(3);
    expect(plain.checkWalkPickup('buddy', 0, far).found).toBe(0);
    // Nothing off a bush either: the ground and the hedges are two
    // pools, and Pickup only reads one of them
    expect(finder.checkWalkPickup('buddy', 0, far).gathered).toBe(0);
    // Short of the first mark is nothing at all
    expect(finder.checkWalkPickup('buddy', 0, PICKUP_STEP_INTERVAL - 1).found).toBe(0);

    // It counts marks crossed rather than steps reported, so walking
    // the same distance in handfuls finds exactly as much
    let piecemeal = 0;

    for (let at = 0; at < far; at += 64) {
      piecemeal += finder.checkWalkPickup('buddy', at, Math.min(far, at + 64)).found;
    }
    expect(piecemeal).toBe(3);
  });

  it('doubles a purse and quiets a chunk for a buddy burning incense', () => {
    const plain = createOverworld('player-uid', buddyWith([]));
    const lucky = createOverworld('player-uid', {
      ...buddyWith([]),
      items: [Items.LuckIncense],
    });
    const quiet = createOverworld('player-uid', {
      ...buddyWith([]),
      items: [Items.PureIncense],
    });

    // What the raid owes, and then what the claimant brought along
    expect(plain.checkGoldReward('raid-id', 2000)).toBe(2000);
    expect(lucky.checkGoldReward('raid-id', 2000)).toBe(2000 * LUCK_INCENSE_BONUS);

    // The mirror of a lure: the window rolls what it rolls, and the
    // player carrying one meets fewer of them
    expect(plain.checkSpawnCount(SPAWN_COUNT)).toBe(SPAWN_COUNT);
    expect(quiet.checkSpawnCount(SPAWN_COUNT)).toBe(SPAWN_COUNT - PURE_INCENSE_QUIET);
    // It can never quiet a chunk below nothing
    expect(quiet.checkSpawnCount(1)).toBe(0);

    // A player walking alone carries nothing
    expect(createOverworld('player-uid', null).checkGoldReward('raid-id', 2000)).toBe(2000);
  });

  it('does the same for a buddy wearing a coin or a tag', () => {
    const rich = createOverworld('player-uid', {
      ...buddyWith([]),
      items: [Items.AmuletCoin],
    });
    const tagged = createOverworld('player-uid', {
      ...buddyWith([]),
      items: [Items.CleanseTag],
    });

    expect(rich.checkGoldReward('raid-id', 2000)).toBe(2000 * AMULET_COIN_BONUS);
    expect(tagged.checkSpawnCount(SPAWN_COUNT)).toBe(SPAWN_COUNT - CLEANSE_TAG_QUIET);
    expect(tagged.checkSpawnCount(1)).toBe(0);

    // The coin pays better than the incense it stands against, which
    // is what not being on any shelf is worth
    expect(AMULET_COIN_BONUS).toBeGreaterThan(LUCK_INCENSE_BONUS);

    // And each is asked separately, so a buddy carrying both is paid
    // for both — the way a Shiny Charm stacks with the day's own boost
    const both = createOverworld('player-uid', {
      ...buddyWith([]),
      items: [Items.AmuletCoin, Items.LuckIncense],
    });

    expect(both.checkGoldReward('raid-id', 2000)).toBe(
      2000 * AMULET_COIN_BONUS * LUCK_INCENSE_BONUS,
    );
  });

  it('bounds the world at 4096 chunks a side', () => {
    const world = new World('overworld');

    expect(WORLD_MAX - WORLD_MIN + 1).toBe(WORLD_SIZE);
    expect(isInWorld(WORLD_MIN, WORLD_MAX)).toBe(true);
    expect(isInWorld(WORLD_MIN - 1, 0)).toBe(false);
    expect(isInWorld(0, WORLD_MAX + 1)).toBe(false);

    // Past the edge there is no new ground: the outermost chunk is
    // what a coordinate beyond it resolves to
    expect(clampToWorld(WORLD_MAX + 500)).toBe(WORLD_MAX);
    expect(world.getChunk(WORLD_MIN - 7, 0).seed).toBe(world.getChunk(WORLD_MIN, 0).seed);

    // A player always starts inside it
    for (const uid of ['player-uid', 'other-uid', 'third-uid']) {
      const start = pickStartPosition(world, uid);

      expect(isInWorld(start.chunkX, start.chunkY)).toBe(true);
    }
  });

  it('ripens berry patches on the landmark window', () => {
    const world = new World('overworld');
    const chunk = findChunk(world, (candidate) =>
      new Set(candidate.getLandmarkCells().values()).has(Landmark.BerryPatch),
    );

    expect(chunk).not.toBeNull();
    if (chunk == null) {
      return;
    }

    const WINDOW = LANDMARK_INTERVAL;
    const patches = new ChunkSnapshot(chunk, 0).getBerryPatches();

    // Every pick sits on a patch cell, is a berry, and is a handful
    // of one rather than a single berry
    expect(patches.size).toBeGreaterThan(0);
    for (const [cell, picked] of patches) {
      expect(chunk.getLandmarkCells().get(cell)).toBe(Landmark.BerryPatch);
      expect(getItemData(picked.item).type).toBe(ItemTypes.Berry);
      expect(picked.amount).toBeGreaterThanOrEqual(MIN_BERRY_PICK);
      expect(picked.amount).toBeLessThanOrEqual(MAX_BERRY_PICK);
    }

    // The same window agrees for every observer, and a bush keeps
    // its fruit for the whole quarter hour
    expect(new ChunkSnapshot(chunk, 60 * 1000).getBerryPatches()).toEqual(patches);
    expect(new ChunkSnapshot(chunk, LANDMARK_INTERVAL - 1).getBerryPatches()).toEqual(patches);

    // Expired windows grow something new
    const shapes = new Set<string>();

    for (let window = 0; window <= 10; window++) {
      shapes.add(JSON.stringify([...new ChunkSnapshot(chunk, window * WINDOW).getBerryPatches()]));
    }
    expect(shapes.size).toBeGreaterThan(1);
  });

  it('holds one egg species in a nest for the whole half day', () => {
    const world = new World('overworld');
    const chunk = findChunk(world, (candidate) =>
      new Set(candidate.getLandmarkCells().values()).has(Landmark.Nest),
    );

    expect(chunk).not.toBeNull();
    if (chunk == null) {
      return;
    }

    const snapshot = new ChunkSnapshot(chunk, 0);
    const nests = snapshot.getNests();
    const pool = getSpawnPool(chunk.biome, getTimeOfDay(0));
    const ordinary = new Set(
      [...pool.base, ...pool.uncommon, ...pool.rare].map((entry) => getBaseSpecies(entry.species)),
    );

    expect(nests.size).toBeGreaterThan(0);
    for (const [cell, species] of nests) {
      expect(chunk.getLandmarkCells().get(cell)).toBe(Landmark.Nest);
      // What is lying there hatches, so it is the first stage of its
      // line — and it is one of the biome's own
      expect(getSpeciesData(species).evolvesFrom).toBeUndefined();
      expect(ordinary.has(species)).toBe(true);
      // A nest never holds a legendary or a mythical
      expect(getSpawnRarity(species)).not.toBe(SpawnRarity.Special);
    }

    // A nest outlives every other landmark in the chunk: the spawns
    // around it turn over half a day and it holds the same egg
    expect(snapshot.nestTimestamp).toBe(0);
    expect(new ChunkSnapshot(chunk, NEST_INTERVAL - 1).getNests()).toEqual(nests);
    expect(new ChunkSnapshot(chunk, NEST_INTERVAL - 1).nestTimestamp).toBe(0);
    expect(new ChunkSnapshot(chunk, NEST_INTERVAL).nestTimestamp).toBe(NEST_INTERVAL);
  });

  it('gives everything in a chunk a window of its own', () => {
    // What a window is worth is how long it is: the pokemon a player
    // walks past turn over fastest, the ground they dig up slower,
    // and the things worth making a trip for slowest of all
    expect(SNAPSHOT_INTERVAL).toBe(5 * 60 * 1000);
    expect(LANDMARK_INTERVAL).toBe(15 * 60 * 1000);
    expect(RAID_INTERVAL).toBe(3 * 60 * 60 * 1000);
    expect(NPC_INTERVAL).toBe(3 * 60 * 60 * 1000);
    expect(NEST_INTERVAL).toBe(12 * 60 * 60 * 1000);

    // Every window is a whole number of spawn windows, so no landmark
    // ever turns over halfway through the one a player is standing in
    for (const interval of [LANDMARK_INTERVAL, RAID_INTERVAL, NPC_INTERVAL, NEST_INTERVAL]) {
      expect(interval % SNAPSHOT_INTERVAL).toBe(0);
      expect(interval).toBeGreaterThanOrEqual(SNAPSHOT_INTERVAL);
    }

    // And each is read off the same snapshot, floored to its own
    const world = new World('overworld');
    const snapshot = new ChunkSnapshot(world.getChunk(0, 0), NPC_INTERVAL + LANDMARK_INTERVAL);

    expect(snapshot.landmarkTimestamp).toBe(NPC_INTERVAL + LANDMARK_INTERVAL);
    expect(snapshot.raidTimestamp).toBe(RAID_INTERVAL);
    expect(snapshot.npcTimestamp).toBe(NPC_INTERVAL);
    expect(snapshot.nestTimestamp).toBe(0);
  });

  it('keeps the same person and the same visit through every spawn window', () => {
    // What a counter held open across a 5-minute boundary depends on:
    // the server derives who is standing there from its own clock
    // rather than from the published spawn window, and both have to
    // answer the same for as long as the passer-by stands there
    const world = new World('overworld');
    const chunk = findChunk(world, (candidate) =>
      new Set(candidate.getLandmarkCells().values()).has(Landmark.WanderingNpc),
    );

    expect(chunk).not.toBeNull();
    if (chunk == null) {
      return;
    }

    const opened = new ChunkSnapshot(chunk, NPC_INTERVAL);
    const cell = [...opened.getWanderingNpcs().keys()][0];

    for (let at = 0; at < NPC_INTERVAL; at += SNAPSHOT_INTERVAL) {
      const later = new ChunkSnapshot(chunk, NPC_INTERVAL + at);

      expect(later.getStandingNpc(cell)).toBe(opened.getStandingNpc(cell));
      expect(later.visitMarker('daycare', cell)).toBe(opened.visitMarker('daycare', cell));
    }

    // And the window after it is somebody else's business: a marker
    // from this one buys nothing there
    const next = new ChunkSnapshot(chunk, NPC_INTERVAL * 2);

    expect(next.visitMarker('daycare', cell)).not.toBe(opened.visitMarker('daycare', cell));
  });

  it('puts a different passer-by on a wandering cell each window', () => {
    const world = new World('overworld');
    const chunk = findChunk(world, (candidate) =>
      new Set(candidate.getLandmarkCells().values()).has(Landmark.WanderingNpc),
    );

    expect(chunk).not.toBeNull();
    if (chunk == null) {
      return;
    }

    const wanderers = new ChunkSnapshot(chunk, 0).getWanderingNpcs();

    expect(wanderers.size).toBeGreaterThan(0);
    for (const [cell, npc] of wanderers) {
      expect(chunk.getLandmarkCells().get(cell)).toBe(Landmark.WanderingNpc);
      expect(new Set(NPCS).has(npc)).toBe(true);
    }

    // Whoever it is stands for the whole 3-hour window, and the
    // windows are not all the same person
    expect(new ChunkSnapshot(chunk, NPC_INTERVAL - 1).getWanderingNpcs()).toEqual(wanderers);
    expect(new ChunkSnapshot(chunk, NPC_INTERVAL).npcTimestamp).toBe(NPC_INTERVAL);

    const shapes = new Set<string>();
    const met = new Set<Npc>();

    // Enough windows that all 10 roles have room to turn up on however
    // few wandering cells the chunk rolled
    for (let window = 0; window < 96; window++) {
      const standing = new ChunkSnapshot(chunk, window * NPC_INTERVAL).getWanderingNpcs();

      shapes.add(JSON.stringify([...standing]));
      for (const npc of standing.values()) {
        met.add(npc);
      }
    }
    expect(shapes.size).toBeGreaterThan(1);
    // Everyone who wanders turns up: the groomer is drawn from the
    // same pool as the two who came first
    expect(met.has(Npc.Groomer)).toBe(true);
    expect(met.has(Npc.MoveReminder)).toBe(true);
    // Neither of the two with a place of their own is among them: the
    // vendor keeps a stall and Nurse Joy keeps a centre
    expect(met.has(Npc.Vendor)).toBe(false);
    expect(met.has(Npc.NurseJoy)).toBe(false);
  });

  it('dresses each wanderer from their role’s own wardrobe', () => {
    const world = new World('overworld');
    const chunk = findChunk(world, (candidate) =>
      new Set(candidate.getLandmarkCells().values()).has(Landmark.WanderingNpc),
    );

    expect(chunk).not.toBeNull();
    if (chunk == null) {
      return;
    }

    const styles = new Map<Npc, Set<string>>();
    const seen = new Map<Npc, number>();

    for (let window = 0; window < 96; window++) {
      const snapshot = new ChunkSnapshot(chunk, window * NPC_INTERVAL);
      const wanderers = snapshot.getWanderingNpcs();
      const coats = snapshot.getWandererCoats();

      // A coat for every wanderer, and for whoever stands at the
      // fighting landmarks besides
      expect(coats.size).toBeGreaterThanOrEqual(wanderers.size);
      for (const [cell, npc] of wanderers) {
        const coat = coats.get(cell);

        expect(coat).not.toBeUndefined();
        if (coat != null) {
          // Always one of the role's own styles
          expect(npcSheets(npc)).toContain(coat);
          styles.set(npc, (styles.get(npc) ?? new Set()).add(coat));
          seen.set(npc, (seen.get(npc) ?? 0) + 1);
        }
      }
      // The window's roll is everybody's roll
      expect(new ChunkSnapshot(chunk, window * NPC_INTERVAL).getWandererCoats()).toEqual(coats);
    }

    // A role both packs drew actually turns up in both styles — asked
    // only of a role met often enough that one style would be a fault
    // in the roll rather than a short visit
    for (const [npc, worn] of styles) {
      if (npcSheets(npc).length > 1 && (seen.get(npc) ?? 0) >= 6) {
        expect(worn.size, String(npc)).toBeGreaterThan(1);
      }
    }
  });

  it('fills a trader’s crate from the window he was drawn in', () => {
    const world = new World('overworld');
    // A chunk with both, so the stall and the wandering chef are
    // measured against each other in one place
    const chunk = findChunk(world, (candidate) => {
      const kinds = new Set(candidate.getLandmarkCells().values());

      return kinds.has(Landmark.WanderingNpc) && kinds.has(Landmark.Market);
    });

    expect(chunk).not.toBeNull();
    if (chunk == null) {
      return;
    }

    const crates = new Set<string>();
    const counters = new Set<VendorKind>();
    let found = 0;
    let stalls = 0;

    for (let window = 0; window < 24; window++) {
      const at = window * NPC_INTERVAL;
      const snapshot = new ChunkSnapshot(chunk, at);
      // Everyone who could be selling: the window's wanderers, and
      // whoever the landmarks put on a cell for good
      const standing = new Map<number, Npc>();

      for (const cell of snapshot.getWanderingNpcs().keys()) {
        const npc = snapshot.getStandingNpc(cell);

        if (npc != null) {
          standing.set(cell, npc);
        }
      }
      for (const [cell, landmark] of chunk.getLandmarkCells()) {
        if (landmark === Landmark.Market) {
          expect(snapshot.getStandingNpc(cell)).toBe(Npc.Vendor);
          standing.set(cell, Npc.Vendor);
          stalls++;
        }
      }

      for (const [cell, npc] of standing) {
        const stock = snapshot.getVendorStock(cell);

        // Anybody else's cell holds no crate at all
        if (npc !== Npc.Vendor && npc !== Npc.Chef) {
          expect(stock).toEqual([]);
          expect(snapshot.getVendorKind(cell)).toBeNull();
          continue;
        }
        found++;
        crates.add(JSON.stringify(stock));

        // A dozen kinds, none of them twice, or the whole shelf where
        // that counter is carrying fewer than a dozen
        const kind = npc === Npc.Chef ? null : snapshot.getVendorKind(cell);
        const shelf = kind == null ? getChefGoods() : getVendorGoods(kind);

        expect(stock.length).toBe(Math.min(VENDOR_STOCK_KINDS, shelf.length));
        expect(new Set(stock).size).toBe(stock.length);

        if (npc === Npc.Chef) {
          // Everything on his counter came out of his own larder
          const larder = new Set(getChefGoods());

          expect(snapshot.getVendorKind(cell)).toBeNull();
          for (const item of stock) {
            expect(larder.has(item)).toBe(true);
          }
        } else {
          // A vendor's crate is his counter's shelf and nothing else
          expect(kind).not.toBeNull();
          if (kind == null) {
            continue;
          }
          counters.add(kind);

          const goods = new Set(getVendorGoods(kind));

          for (const item of stock) {
            expect(goods.has(item)).toBe(true);
          }
          // A counter with a staple always has it out: a ball stall
          // with no Poke Ball is one a player cannot plan a walk
          // around, and the specialist shelves are their own plan
          for (const staple of VENDOR_STAPLES[kind] ?? []) {
            expect(new Set(stock).has(staple)).toBe(true);
          }
        }
        // Priced goods only, which is what keeps the Master Ball out
        // of the crate without naming it
        for (const item of stock) {
          expect(isMarketable(item)).toBe(true);
          expect(getItemData(item).buy).toBeGreaterThan(0);
        }
        expect(new Set(stock).has(Items.MasterBall)).toBe(false);

        // Everybody who walks up to the same trader is shown the same
        // crate: it is derived, not stored
        expect(new ChunkSnapshot(chunk, at + 1).getVendorStock(cell)).toEqual(stock);
      }
    }

    expect(found).toBeGreaterThan(0);
    // The stall is there every window, which is the whole point of
    // moving him off the wandering roll. A chunk may keep more than
    // one, so the count is per window rather than exact
    expect(stalls).toBeGreaterThanOrEqual(24);
    // The crates are not all the same crate, and the vendor is not
    // always behind the same counter
    expect(crates.size).toBeGreaterThan(1);
    expect(counters.size).toBeGreaterThan(1);
  });

  it('keeps a vendor on every market stall, whatever the window', () => {
    const world = new World('overworld');
    const chunk = findChunk(world, (candidate) =>
      new Set(candidate.getLandmarkCells().values()).has(Landmark.Market),
    );

    expect(chunk).not.toBeNull();
    if (chunk == null) {
      return;
    }

    const stalls = [...chunk.getLandmarkCells()]
      .filter(([, landmark]) => landmark === Landmark.Market)
      .map(([cell]) => cell);

    for (let window = 0; window < 24; window++) {
      const snapshot = new ChunkSnapshot(chunk, window * NPC_INTERVAL);

      for (const cell of stalls) {
        // He is never rolled away: the stall is the landmark, and only
        // which counter he set up turns over
        expect(snapshot.getStandingNpc(cell)).toBe(Npc.Vendor);
        expect(snapshot.getVendorKind(cell)).not.toBeNull();
        // And he is dressed, so the board draws a person rather than a
        // letter in a circle
        expect(snapshot.getWandererCoats().get(cell)).not.toBeUndefined();
      }
      // A wandering cell never stages him any more
      for (const npc of snapshot.getWanderingNpcs().values()) {
        expect(npc).not.toBe(Npc.Vendor);
      }
    }
  });

  it('keeps Nurse Joy at a centre in every town, whatever the window', () => {
    const world = new World('overworld');
    const chunk = findChunk(world, (candidate) =>
      new Set(candidate.getLandmarkCells().values()).has(Landmark.PokemonCenter),
    );

    expect(chunk).not.toBeNull();
    if (chunk == null) {
      return;
    }

    const counters = [...chunk.getLandmarkCells()]
      .filter(([, landmark]) => landmark === Landmark.PokemonCenter)
      .map(([cell]) => cell);

    for (let window = 0; window < 24; window++) {
      const snapshot = new ChunkSnapshot(chunk, window * NPC_INTERVAL);

      for (const cell of counters) {
        // She is never rolled away: the counter is the landmark
        expect(snapshot.getStandingNpc(cell)).toBe(Npc.NurseJoy);
        expect(snapshot.getWandererCoats().get(cell)).toBe(npcSheet(Npc.NurseJoy));
      }
      // And a wandering cell never stages her any more
      for (const npc of snapshot.getWanderingNpcs().values()) {
        expect(npc).not.toBe(Npc.NurseJoy);
      }
    }
  });

  it('charters a centre in every town and none in the country', () => {
    const world = new World('overworld');
    let towns = 0;

    for (let regionY = -8; regionY < 8; regionY++) {
      for (let regionX = -8; regionX < 8; regionX++) {
        const town = townOfRegion(world, regionX, regionY);

        if (town == null) {
          continue;
        }
        towns++;

        const lots = getTownLots(world, town).filter(
          (lot) => lot.landmark === Landmark.PokemonCenter,
        );

        // One, never two: a second counter is the same service twice
        expect(lots.length, `${town.x}, ${town.y}`).toBe(1);
      }
    }
    expect(towns).toBeGreaterThan(0);

    // Nothing out in the country stages one. A chunk that holds a
    // centre is a chunk a town reaches into
    for (let x = -20; x < 20; x++) {
      for (let y = -20; y < 20; y++) {
        const chunk = world.getChunk(x, y);
        const centres = [...chunk.getLandmarkCells()].filter(
          ([, landmark]) => landmark === Landmark.PokemonCenter,
        );

        if (centres.length > 0) {
          expect(townOverChunk(world, x, y)).not.toBeNull();
        }
      }
    }
  });

  it('names every town it grows, and never two of them the same', () => {
    const world = new World('overworld');
    const names = new Map<string, string>();

    // Not a sample of the odds: names are worked out from where a town
    // is, so two of them sharing one is not unlikely, it is impossible
    for (let regionY = -24; regionY < 24; regionY++) {
      for (let regionX = -24; regionX < 24; regionX++) {
        const town = townOfRegion(world, regionX, regionY);

        if (town == null) {
          continue;
        }

        const name = townName(town);
        const where = `${regionX}, ${regionY}`;

        expect(name).toMatch(/^[A-Z].*, [A-Z][a-z]+$/);
        // Answered the same way every time, by anybody, with nothing
        // asked of a store
        expect(townName(town)).toBe(name);
        expect(names.get(name) ?? where, name).toBe(where);
        names.set(name, where);
      }
    }
    expect(names.size).toBeGreaterThan(500);
  });

  it('names a town for its own country and its own county', () => {
    const world = new World('overworld');
    const settled = findRegion(world, (town) => town != null);

    expect(settled).not.toBeNull();
    if (settled == null) {
      return;
    }

    const town = townOfRegion(world, settled[0], settled[1]);

    expect(town).not.toBeNull();
    if (town == null) {
      return;
    }

    // The same answer the data table gives for those coordinates: the
    // town carries nothing of its own into it but where it stands
    expect(townName(town)).toBe(nameTown(town.regionX, town.regionY, town.biome));

    // And a second world says the same thing, since there is nothing
    // remembered anywhere for it to differ about
    const other = new World('overworld');
    const same = townOfRegion(other, settled[0], settled[1]);

    expect(same).not.toBeNull();
    expect(same == null ? null : townName(same)).toBe(townName(town));
  });

  it('posts an auction board in a town, one to a chunk and reachable', () => {
    const world = new World('overworld');
    let boards = 0;
    let towns = 0;
    const span = TOWN_REGION * CHUNK_CELLS;

    for (let regionY = -3; regionY < 3; regionY++) {
      for (let regionX = -3; regionX < 3; regionX++) {
        // Sampled across the region, since a town sits wherever its
        // region's own roll put it
        for (let step = 0; step < span; step += 8) {
          if (townAt(world, regionX * span + step, regionY * span + step) != null) {
            towns++;
            break;
          }
        }
      }
    }

    for (let x = -40; x < 40; x++) {
      for (let y = -40; y < 40; y++) {
        const chunk = world.getChunk(x, y);
        const cells = [...chunk.getLandmarkCells()].filter(
          ([, landmark]) => landmark === Landmark.AuctionBoard,
        );

        boards += cells.length;
        // One board to a chunk: every board reads the same global
        // lots, so a second would be the same board twice
        expect(cells.length).toBeLessThanOrEqual(1);
      }
    }
    // Boards live in towns, and about half of a town's charters carry
    // one, so a stretch of country this size holds several
    expect(towns).toBeGreaterThan(0);
    expect(boards).toBeGreaterThan(3);
  });

  it('names a gym seat by its place and never by its window', () => {
    const world = new World('overworld');
    const chunk = findChunk(world, (candidate) =>
      new Set(candidate.getLandmarkCells().values()).has(Landmark.GymSeat),
    );

    expect(chunk).not.toBeNull();
    if (chunk == null) {
      return;
    }

    const cells = [...chunk.getLandmarkCells()]
      .filter(([, landmark]) => landmark === Landmark.GymSeat)
      .map(([cell]) => cell);

    expect(cells.length).toBe(1);

    const cell = cells[0];
    const id = seatId(chunk, cell);

    // The same cell answers the same id however long anybody waits:
    // a seat outlives windows, which is what makes it a place to come
    // back to rather than a thing to catch while it is there
    expect(seatId(chunk, cell)).toBe(id);
    expect(id).toContain(chunk.seed);
    // A different cell, and a different chunk, are different seats
    expect(seatId(chunk, cell + 1)).not.toBe(id);
    expect(seatId(world.getChunk(chunk.x + 1, chunk.y), cell)).not.toBe(id);
  });

  it('gives the fossil maniac two of the three, drawn with his window', () => {
    const world = new World('overworld');
    // Several of them rather than any: a chunk with one wanderer in it
    // draws the maniac a handful of times over forty-eight windows,
    // which is too few to say anything about what he varies
    const chunk = findChunk(
      world,
      (candidate) =>
        [...candidate.getLandmarkCells().values()].filter(
          (landmark) => landmark === Landmark.WanderingNpc,
        ).length >= 3,
    );

    expect(chunk).not.toBeNull();
    if (chunk == null) {
      return;
    }

    const offers = new Set<string>();
    let found = 0;

    for (let window = 0; window < 48; window++) {
      const at = window * NPC_INTERVAL;
      const snapshot = new ChunkSnapshot(chunk, at);

      for (const [cell, npc] of snapshot.getWanderingNpcs()) {
        const offer = snapshot.getFossilOffer(cell);

        // Nobody else is carrying any
        if (npc !== Npc.FossilManiac) {
          expect(offer).toEqual([]);
          continue;
        }
        found++;
        offers.add(JSON.stringify(offer));

        // Two of the three, never the same one twice, and never all
        // of them: what he offers is a choice
        expect(offer.length).toBe(FOSSIL_OFFER_KINDS);
        expect(new Set(offer).size).toBe(offer.length);
        for (const item of offer) {
          expect(isFossil(item)).toBe(true);
          expect(getFossilPrice(item)).toBeGreaterThan(0);
        }

        // Everybody who reaches the same maniac is offered the same
        // two: it is derived, not stored
        expect(new ChunkSnapshot(chunk, at + 1).getFossilOffer(cell)).toEqual(offer);
      }
    }

    expect(found).toBeGreaterThan(0);
    // And he is not carrying the same pair every window
    expect(offers.size).toBeGreaterThan(1);
  });

  it('opens a portal onto the portal in the town named', () => {
    const world = new World('overworld');
    const chunk = findChunk(world, (candidate) =>
      new Set(candidate.getLandmarkCells().values()).has(Landmark.Portal),
    );

    expect(chunk).not.toBeNull();
    if (chunk == null) {
      return;
    }

    // A portal stands on a cell of its own, and that cell is where a
    // traveller comes out
    const cell = getPortalCell(chunk);

    expect(cell).not.toBeNull();
    expect(chunk.getLandmarkCells().get(cell ?? -1)).toBe(Landmark.Portal);

    // A region with a town is a place somebody can name; one without
    // has a portal out in the country and nothing to call it
    const settled = findRegion(world, (town) => town != null);

    expect(settled).not.toBeNull();
    if (settled == null) {
      return;
    }

    const town = townOfRegion(world, settled[0], settled[1]);

    expect(town).not.toBeNull();
    if (town == null) {
      return;
    }

    const destination = portalInRegion(world, settled[0], settled[1]);

    expect(destination).not.toBeNull();
    if (destination == null) {
      return;
    }

    // It is a real portal, in the middle of the town it was named for
    expect(destination.name).toBe(townName(town));
    expect(destination.biome).toBe(town.biome);
    expect(getPortalCell(world.getChunk(destination.x, destination.y))).toBe(destination.cell);
    expect(worldCell(destination.x, destination.cell % CHUNK_CELLS)).toBe(town.x);
    expect(worldCell(destination.y, Math.floor(destination.cell / CHUNK_CELLS))).toBe(town.y);
  });

  it('has nowhere to come out in a region with no town', () => {
    const world = new World('overworld');
    const empty = findRegion(world, (town) => town == null);

    expect(empty).not.toBeNull();
    if (empty == null) {
      return;
    }
    expect(portalInRegion(world, empty[0], empty[1])).toBeNull();
  });

  it('reads the window back out of an encounter key', () => {
    const world = new World('overworld');
    const snapshot = new ChunkSnapshot(world.getChunk(3, 4), 12 * SNAPSHOT_INTERVAL);
    const encounter = deriveEncounter(snapshot, [Species.Pidgey, 0, 0]);
    const key = encounterKey(encounter);

    // The key carries which window staged the spawn, which is what
    // lets a fled list forget the ones that can never come back: a
    // window that has turned over has taken its spawns with it
    expect(encounterWindow(key)).toBe(12 * SNAPSHOT_INTERVAL);
    expect(encounterKey(encounter)).toBe(key);

    // A key from another window is a different key, and anything that
    // is not a key at all reads as long expired
    const later = new ChunkSnapshot(world.getChunk(3, 4), 13 * SNAPSHOT_INTERVAL);

    expect(encounterKey(deriveEncounter(later, [Species.Pidgey, 0, 0]))).not.toBe(key);
    expect(encounterWindow('nonsense')).toBe(0);
  });

  it('keeps specials out of nests however the roll falls', () => {
    // Both ends of the stream, on every biome that stages anything:
    // whatever a nest draws is reduced to the stage that hatches, and
    // the special tier is not in the draw at all
    for (const key of Object.keys(BIOME_NAMES)) {
      // oxlint-disable-next-line typescript/no-unnecessary-type-assertion
      const biome = Number(key) as Biome;

      for (const time of [TimeOfDay.Morning, TimeOfDay.Day, TimeOfDay.Evening, TimeOfDay.Night]) {
        for (const roll of [0, 0.5, 0.999999]) {
          const species = resolveNest(biome, time, () => roll);

          if (species == null) {
            continue;
          }
          expect(getSpawnRarity(species)).not.toBe(SpawnRarity.Special);
          expect(getSpeciesData(species).evolvesFrom).toBeUndefined();
        }
      }
    }
  });

  it('rolls the berry pool through its rarity bands', () => {
    const rolls = (values: number[]) => () => values.shift() ?? 0.999;

    // Same bands as the spawn pool: the better the berry, the rarer.
    // The berries a fight turns on — the ones held against the moment
    // the holder is nearly out — are the special band
    expect(resolveBerryPatch(rolls([0, 0, 0]))?.item).toBe(Items.LiechiBerry);
    expect(resolveBerryPatch(rolls([0.01, 0, 0]))?.item).toBe(Items.LumBerry);
    expect(resolveBerryPatch(rolls([0.05, 0, 0]))?.item).toBe(Items.LeppaBerry);
    expect(resolveBerryPatch(rolls([0.5, 0, 0]))?.item).toBe(Items.CheriBerry);

    // A bush bears a handful: the third draw is how many, between
    // MIN_BERRY_PICK and MAX_BERRY_PICK inclusive
    expect(resolveBerryPatch(rolls([0.5, 0, 0]))).toEqual({
      item: Items.CheriBerry,
      amount: MIN_BERRY_PICK,
    });
    expect(resolveBerryPatch(rolls([0.5, 0, 0.999]))).toEqual({
      item: Items.CheriBerry,
      amount: MAX_BERRY_PICK,
    });
    expect(resolveBerryPatch(rolls([0.5, 0, 0.5]))?.amount).toBe(4);
  });

  it('stands apricorn trees on the ground, one colour to a tree', () => {
    const world = new World('overworld');
    const chunk = findChunk(world, (candidate) =>
      new Set(candidate.getLandmarkCells().values()).has(Landmark.ApricornTree),
    );

    expect(chunk).not.toBeNull();
    if (chunk == null) {
      return;
    }

    const snapshot = new ChunkSnapshot(chunk, 0);
    const trees = snapshot.getApricornTrees();

    expect(trees.size).toBeGreaterThan(0);
    for (const [cell, crop] of trees) {
      expect(chunk.getLandmarkCells().get(cell)).toBe(Landmark.ApricornTree);
      expect(APRICORNS).toContain(crop.item);
      expect(crop.amount).toBeGreaterThanOrEqual(MIN_BERRY_PICK);
      expect(crop.amount).toBeLessThanOrEqual(MAX_BERRY_PICK);
      // The colour is the tree's own, and the same one the cell reads
      expect(snapshot.getApricornTree(cell)).toBe(crop.item);
    }

    // A tree keeps its colour through every window, since the tree
    // itself is what is drawn, and its crop turns over on the berry
    // clock
    const later = new ChunkSnapshot(chunk, LANDMARK_INTERVAL * 4);

    for (const [cell, crop] of trees) {
      expect(later.getApricornTrees().get(cell)?.item).toBe(crop.item);
    }
    expect(new ChunkSnapshot(chunk, LANDMARK_INTERVAL - 1).getApricornTrees()).toEqual(trees);

    // A cell that holds no tree bears nothing
    const elsewhere = [...chunk.getLandmarkCells()].find(
      ([, landmark]) => landmark !== Landmark.ApricornTree,
    );

    expect(snapshot.getApricornTree(elsewhere?.[0] ?? 0)).toBeNull();
  });

  it('bears one apricorn colour a tree, and a handful of it', () => {
    const draw = (value: number) => () => value;

    // No rarer colour to hunt: an apricorn is a ball nobody has
    // carved yet, and the seven balls are worth about the same as
    // each other, so every colour is equally likely
    expect(resolveApricornColour(draw(0))).toBe(APRICORNS[0]);
    expect(resolveApricornColour(draw(0.999))).toBe(APRICORNS[APRICORNS.length - 1]);

    // Two draws on two clocks: the colour is the tree's for good and
    // the crop is the window's, so a good season cannot repaint it
    expect(resolveApricornTree(draw(0), draw(0)).item).toBe(APRICORNS[0]);
    expect(resolveApricornTree(draw(0), draw(0.999)).item).toBe(APRICORNS[0]);
    expect(resolveApricornTree(draw(0), draw(0)).amount).toBe(MIN_BERRY_PICK);
    expect(resolveApricornTree(draw(0), draw(0.999)).amount).toBe(MAX_BERRY_PICK);
  });

  it('resolves a phenomenon into a meeting, a find or an egg', () => {
    const rolls = (values: number[]) => () => values.shift() ?? 0.999;
    const grotto = Phenomenon.HiddenGrotto;

    // A grotto has no item side at all: the opening draw is the egg,
    // and everything past it is the pokemon it was hiding
    const egg = resolvePhenomenon(grotto, Biome.Grassland, TimeOfDay.Morning, rolls([0, 0]));

    expect(egg?.kind).toBe('egg');
    if (egg?.kind === 'egg') {
      // A nest's own rule: what hatches, not what it grows into
      expect(getSpeciesData(egg.species).evolvesFrom).toBeUndefined();
    }

    // The pokemon branch is 1/8 grown, the rest half-grown, and never
    // reaches the legendary tier
    const rare = resolvePhenomenon(grotto, Biome.Grassland, TimeOfDay.Morning, rolls([0.9, 0, 0]));
    const uncommon = resolvePhenomenon(
      grotto,
      Biome.Grassland,
      TimeOfDay.Morning,
      rolls([0.9, 0.5, 0]),
    );

    expect(rare?.kind).toBe('pokemon');
    if (rare?.kind === 'pokemon') {
      expect(isGrownSpecies(rare.species)).toBe(true);
    }
    expect(uncommon?.kind).toBe('pokemon');
    if (uncommon?.kind === 'pokemon') {
      expect(getSpawnRarity(uncommon.species)).toBe(SpawnRarity.Rare);
    }

    // The other three are half a meeting and half a find, and what
    // they leave behind is their own: dust turns up anything the
    // ground held, water only what it keeps, a shadow only wings
    // Each in a biome that hosts it: a ripple asks for water, and
    // grassland has none of it in either band
    for (const [phenomenon, biome] of [
      [Phenomenon.DustCloud, Biome.Grassland],
      [Phenomenon.RipplingWater, Biome.Swamp],
      [Phenomenon.FlyingShadow, Biome.Grassland],
    ] as const) {
      const found = resolvePhenomenon(phenomenon, biome, TimeOfDay.Morning, rolls([0, 0.5]));

      expect(found?.kind).toBe('item');
      if (found?.kind === 'item') {
        expect(found.items.length).toBe(1);
        // One piece: everything a phenomenon leaves is worth carrying
        // home on its own
        expect(found.items[0].amount).toBe(1);
        expect(new Set(getPhenomenonItems(phenomenon)).has(found.items[0].item)).toBe(true);
      }

      // Past the item draw it is a pokemon, the same two bands
      expect(
        resolvePhenomenon(phenomenon, biome, TimeOfDay.Morning, rolls([0.9, 0.5, 0]))?.kind,
      ).toBe('pokemon');
    }

    // A wing is the whole of what a shadow drops, and a ripple never
    // turns up a stone
    expect(new Set(getPhenomenonItems(Phenomenon.FlyingShadow)).has(Items.HealthWing)).toBe(true);
    expect(new Set(getPhenomenonItems(Phenomenon.RipplingWater)).has(Items.FireStone)).toBe(false);
    expect(new Set(getPhenomenonItems(Phenomenon.DustCloud)).has(Items.FireStone)).toBe(true);
    expect(getPhenomenonItems(Phenomenon.HiddenGrotto)).toEqual([]);
  });

  it('draws what a phenomenon leaves through its own bands', () => {
    // The pools used to be picked over uniformly, which set a relic
    // crown at 1 in 24 out of a ripple against 1 in 50,000 out of the
    // ground. Six hundred thousand gold and a two hundred gold shell
    // are not the same draw
    for (const phenomenon of [
      Phenomenon.DustCloud,
      Phenomenon.RipplingWater,
      Phenomenon.FlyingShadow,
    ]) {
      const groups = getPhenomenonGroups(phenomenon);
      const listed = getPhenomenonItems(phenomenon);
      const bands = ['uncommon', 'rare', 'prized'] as const;

      // Nothing is lost on the way into the bands, and nothing is
      // invented: the same items, sorted
      expect(new Set(bands.flatMap((band) => groups[band].map((entry) => entry.item)))).toEqual(
        new Set(listed),
      );
      // Neither base nor special has any width here, so anything left
      // in one would be an item the phenomenon could never leave
      expect(groups.base).toEqual([]);
      expect(groups.special).toEqual([]);

      for (const band of bands) {
        const entries = groups[band];

        // Peers stay flat inside a band, and the valuables in it keep
        // exactly the share their count gave them: the weights decide
        // **which** valuable, never how often one turns up at all
        expect(entries.reduce((sum, entry) => sum + entry.weight, 0)).toBeCloseTo(
          entries.length,
          6,
        );
        for (const entry of entries) {
          if (!isValuable(entry.item)) {
            expect(entry.weight, getItemData(entry.item).name).toBe(1);
          }
        }

        // And among the valuables it is the ground's own ladder that
        // orders them, so the two cannot drift apart
        const valuables = entries.filter((entry) => isValuable(entry.item));

        for (const one of valuables) {
          for (const other of valuables) {
            if (getItemOdds(one.item) > getItemOdds(other.item)) {
              expect(
                one.weight,
                `${getItemData(one.item).name} against ${getItemData(other.item).name}`,
              ).toBeGreaterThan(other.weight);
            }
          }
        }
      }
    }

    // A gem is in no band the ground knows, and neither is what a walk
    // turns up anyway: both are drawn on the floor
    const dust = getPhenomenonGroups(Phenomenon.DustCloud);
    const floor = new Set(dust.uncommon.map((entry) => entry.item));

    expect(floor.has(Items.NormalGem)).toBe(true);
    expect(floor.has(Items.TinyMushroom)).toBe(true);
    expect(getItemBand(Items.NormalGem)).toBeNull();
    expect(getItemBand(Items.TinyMushroom)).toBe('base');

    // The crown is a special on the ground and is drawn with the ruins
    // here, because a pool picked by type reaches no other special and
    // a band of one would hand it that band's whole width
    const ripple = getPhenomenonGroups(Phenomenon.RipplingWater);

    expect(getItemBand(Items.RelicCrown)).toBe('special');
    expect(ripple.prized.map((entry) => entry.item)).toContain(Items.RelicCrown);
    for (const item of [Items.RelicVase, Items.CometShard, Items.RelicBand, Items.RelicStatue]) {
      expect(ripple.prized.map((entry) => entry.item)).toContain(item);
    }
    // And it is still the rarest of the five it stands with
    const crown = ripple.prized.find((entry) => entry.item === Items.RelicCrown);

    for (const entry of ripple.prized) {
      if (entry.item !== Items.RelicCrown) {
        expect(entry.weight, getItemData(entry.item).name).toBeGreaterThan(crown?.weight ?? 0);
      }
    }

    // The bands themselves are the ground's, one step richer, and what
    // is left over is nothing: no base, no special
    expect(PHENOMENON_BAND_ODDS.rare).toBe(8 * ITEM_BAND_ODDS.rare);
    expect(PHENOMENON_BAND_ODDS.prized).toBe(8 * ITEM_BAND_ODDS.prized);
    expect(PHENOMENON_BAND_ODDS.special).toBe(0);
    expect(
      PHENOMENON_BAND_ODDS.prized + PHENOMENON_BAND_ODDS.rare + PHENOMENON_BAND_ODDS.uncommon,
    ).toBe(1);
  });

  it('startles what the phenomenon looks like', () => {
    const water = new Set([EggGroups.Water1, EggGroups.Water2, EggGroups.Water3]);
    // Skip the item half, then walk both bands with a spread of picks
    const draws = [];

    for (const rare of [0, 0.5]) {
      for (let pick = 0; pick < 8; pick++) {
        draws.push([0.9, rare, pick / 8]);
      }
    }

    for (const roll of draws) {
      const rolls = (values: number[]) => () => values.shift() ?? 0.999;
      // A shadow over grassland is always something that flies
      const shadowed = resolvePhenomenon(
        Phenomenon.FlyingShadow,
        Biome.Grassland,
        TimeOfDay.Morning,
        rolls([...roll]),
      );

      expect(shadowed?.kind).toBe('pokemon');
      if (shadowed?.kind === 'pokemon') {
        expect(getSpeciesData(shadowed.species).eggGroups).toContain(EggGroups.Flying);
      }

      // A ripple in a swamp is never the Farfetch'd wading beside it
      const rippled = resolvePhenomenon(
        Phenomenon.RipplingWater,
        Biome.Swamp,
        TimeOfDay.Morning,
        rolls([...roll]),
      );

      expect(rippled?.kind).toBe('pokemon');
      if (rippled?.kind === 'pokemon') {
        const groups = getSpeciesData(rippled.species).eggGroups;

        expect(groups.some((group) => water.has(group))).toBe(true);
      }
    }

    // A biome with nothing that fits hands over what the phenomenon
    // was carrying rather than a species of the wrong kind
    const landlocked = resolvePhenomenon(
      Phenomenon.RipplingWater,
      Biome.Grassland,
      TimeOfDay.Morning,
      (() => {
        const values = [0.9, 0.5, 0];
        return () => values.shift() ?? 0.999;
      })(),
    );

    expect(landlocked?.kind).toBe('item');
  });

  it('produces varied biomes across a region', () => {
    const world = new World('overworld');
    const biomes = new Set<Biome>();

    for (let x = 0; x < 32; x++) {
      for (let y = 0; y < 32; y++) {
        biomes.add(world.getChunk(x, y).biome);
      }
    }

    expect(biomes.size).toBeGreaterThan(1);
  });
});

describe('chunk snapshot', () => {
  it('floors timestamps to the last 5-minute boundary', () => {
    const world = new World('overworld');
    const chunk = world.getChunk(0, 0);
    const MINUTE = 60 * 1000;

    // Anywhere inside a window snaps back; boundaries stay put
    expect(new ChunkSnapshot(chunk, 722 * MINUTE).timestamp).toBe(720 * MINUTE);
    expect(new ChunkSnapshot(chunk, 724 * MINUTE).timestamp).toBe(720 * MINUTE);
    expect(new ChunkSnapshot(chunk, 725 * MINUTE).timestamp).toBe(725 * MINUTE);

    // Observers within one window share an identity
    const first = new ChunkSnapshot(chunk, 721 * MINUTE);
    const second = new ChunkSnapshot(chunk, 722 * MINUTE);
    expect(first.timestamp).toBe(second.timestamp);
    expect(first.chunk).toBe(chunk);
  });

  it('rolls the same sequence for the same chunk and window', () => {
    const world = new World('overworld');
    const chunk = world.getChunk(0, 0);
    const MINUTE = 60 * 1000;

    const first = new ChunkSnapshot(chunk, 721 * MINUTE);
    const second = new ChunkSnapshot(chunk, 724 * MINUTE);
    expect(first.rng.random()).toBe(second.rng.random());

    // A new window or another chunk reseeds the roll
    const later = new ChunkSnapshot(chunk, 726 * MINUTE);
    const elsewhere = new ChunkSnapshot(world.getChunk(1, 0), 721 * MINUTE);
    expect(later.rng.random()).not.toBe(new ChunkSnapshot(chunk, 721 * MINUTE).rng.random());
    expect(elsewhere.rng.random()).not.toBe(new ChunkSnapshot(chunk, 721 * MINUTE).rng.random());
  });

  it('rolls a different world for every zone', () => {
    const world = new World('overworld');
    const chunk = world.getChunk(0, 0);
    const NOON = 12 * 60 * 60 * 1000;

    const utc = new ChunkSnapshot(chunk, NOON, 0);
    const manila = new ChunkSnapshot(chunk, NOON, 480);
    const lima = new ChunkSnapshot(chunk, NOON, -300);

    // The same chunk in the same window, but the zone is part of the
    // seed: nobody can read another zone's spawns off their own
    expect(utc.rng.random()).not.toBe(manila.rng.random());
    expect(utc.rng.random()).not.toBe(lima.rng.random());
    expect(manila.getSpawns(4)).not.toEqual(utc.getSpawns(4));

    // Landmark rewards are zoned the same way. One window can collide
    // — a cache has few things to hold — so the run of them is what
    // has to differ
    const stocked =
      findChunk(world, (candidate) =>
        new Set(candidate.getLandmarkCells().values()).has(Landmark.ItemCache),
      ) ?? chunk;
    const WINDOW = LANDMARK_INTERVAL;
    const caches = (offset: number): string =>
      JSON.stringify(
        Array.from({ length: 6 }, (_, at) => [
          ...new ChunkSnapshot(stocked, NOON + at * WINDOW, offset).getItemCaches(),
        ]),
      );

    expect(new Set([0, 480, -300].map(caches)).size).toBe(3);

    // Within one zone it stays deterministic
    expect(new ChunkSnapshot(chunk, NOON + 60 * 1000, 480).getSpawns(4)).toEqual(
      new ChunkSnapshot(chunk, NOON, 480).getSpawns(4),
    );
  });

  it('rolls cached, biome-appropriate spawns', () => {
    const world = new World('overworld');
    const chunk = world.getChunk(0, 0);
    const NOON = 12 * 60 * 60 * 1000;
    const snapshot = new ChunkSnapshot(chunk, NOON);

    const spawns = snapshot.getSpawns(4);
    expect(spawns).toHaveLength(4);
    for (const [species, individualValue, traitValue] of spawns) {
      // The rolled species lives here and is awake in this window
      expect(getSpeciesData(species).biomes).toContain(chunk.biome);
      expect(getSpeciesData(species).activeTimes & getTimeOfDay(NOON)).not.toBe(0);
      for (const value of [individualValue, traitValue]) {
        // Signed 32-bit by construction: what an integer column holds
        expect(Number.isInteger(value)).toBe(true);
        expect(value).toBeGreaterThanOrEqual(-(2 ** 31));
        expect(value).toBeLessThan(2 ** 31);
      }
    }

    // The first roll is fixed for the snapshot's life
    expect(snapshot.getSpawns(4)).toBe(spawns);

    // Any observer of the same chunk and window sees the same roll
    expect(new ChunkSnapshot(chunk, NOON + 60 * 1000).getSpawns(4)).toEqual(spawns);
  });

  it('places each spawn on its own cell of the 16x16 grid', () => {
    const world = new World('overworld');
    const chunk = world.getChunk(0, 0);
    const NOON = 12 * 60 * 60 * 1000;
    const snapshot = new ChunkSnapshot(chunk, NOON);
    const spawns = snapshot.getSpawns(4);

    // Scanning the grid recovers every spawn exactly once. A spawn
    // shares no cell with a landmark or with scenery, and takes no
    // berth from either — a pokemon is walked through rather than
    // round, so standing beside one costs nothing
    const placed: unknown[] = [];
    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 16; x++) {
        const occupant = snapshot.getSpawnAt(x, y);

        if (occupant != null) {
          placed.push(occupant);
          expect(chunk.getLandmarkAt(x, y)).toBeNull();
          expect(chunk.getDecorationCells().has(y * 16 + x)).toBe(false);
        }
      }
    }
    expect(placed).toHaveLength(4);
    for (const spawn of spawns) {
      expect(placed).toContain(spawn);
    }

    // The same window reproduces the same placement
    const again = new ChunkSnapshot(chunk, NOON);
    again.getSpawns(4);
    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 16; x++) {
        expect(again.getSpawnAt(x, y)).toEqual(snapshot.getSpawnAt(x, y));
      }
    }

    // Asked for more than the chunk can hold, it fills every cell the
    // fixtures are not standing on and stops
    const packed = new ChunkSnapshot(chunk, NOON);
    // Whatever is going on this hour holds its cell too, so the room
    // left is what nothing else is standing on. The water is not room
    // for everybody: a lake in dry country takes swimmers only, so it
    // is what stops this filling the grid corner to corner
    const biomes = chunk.getCellBiomes();
    const room = centeredCells(PLACEMENT_AREA).filter(
      (cell) =>
        !chunk.getLandmarkCells().has(cell) &&
        !chunk.getDecorationCells().has(cell) &&
        !chunk.getRockCells().has(cell) &&
        !packed.getPhenomena().has(cell),
    );
    const dry = room.filter(
      (cell) => chunk.getCellRole(cell) !== 'water' || isWaterBiome(biomes[cell]),
    );

    packed.getSpawns(1000);

    const filled = [...packed.getSpawnCells().keys()];

    expect(filled.length).toBeGreaterThanOrEqual(dry.length);
    expect(filled.length).toBeLessThanOrEqual(room.length);
    for (const cell of dry) {
      expect(filled).toContain(cell);
    }
  });

  it('leaves a lake in dry country to what swims in it or flies over it', () => {
    const world = new World('overworld');
    const NOON = 12 * 60 * 60 * 1000;
    let checked = 0;
    let airborne = 0;

    // A Rhyhorn standing in the middle of a pond is the country's pool
    // answering a question nobody asked it. A country that is itself
    // water is not asked: everything in its pool was chosen knowing so
    for (let x = -12; x < 12; x++) {
      for (let y = -12; y < 12; y++) {
        const chunk = world.getChunk(x, y);
        const biomes = chunk.getCellBiomes();
        const snapshot = new ChunkSnapshot(chunk, NOON);

        snapshot.getSpawns(SPAWN_COUNT);
        for (const [cell, spawn] of snapshot.getSpawnCells()) {
          if (chunk.getCellRole(cell) !== 'water' || isWaterBiome(biomes[cell])) {
            continue;
          }
          checked++;
          expect(swims(spawn[0]) || floats(spawn[0])).toBe(true);
          if (!swims(spawn[0])) {
            airborne++;
          }
        }
      }
    }
    expect(checked).toBeGreaterThan(0);
    // And the water is not the swimmers' alone: a pond with nothing
    // over it would mean the rule was written and never reached
    expect(airborne).toBeGreaterThan(0);
  });

  it('places fixtures right up to the chunk edge, leaving no lattice of bare corridors', () => {
    const world = new World('overworld');
    let onTheRim = 0;
    let looked = 0;

    for (let y = -12; y < 12; y += 3) {
      for (let x = -12; x < 12; x += 3) {
        const chunk = world.getChunk(x, y);

        looked++;
        for (const cell of [
          ...chunk.getLandmarkCells().keys(),
          ...chunk.getDecorationCells().keys(),
        ]) {
          const column = cell % CHUNK_CELLS;
          const row = Math.floor(cell / CHUNK_CELLS);

          if (column === 0 || row === 0 || column === CHUNK_CELLS - 1 || row === CHUNK_CELLS - 1) {
            onTheRim++;
          }
        }
      }
    }

    // The board follows the player rather than the chunk, so a clear
    // rim on every chunk would draw empty corridors across the world
    // every sixteen cells
    expect(looked).toBeGreaterThan(0);
    expect(onTheRim).toBeGreaterThan(looked);
  });

  it('furnishes a chunk with the biome scenery, spaced like everything else', () => {
    const world = new World('overworld');
    let chunks = 0;
    let short = 0;

    for (let y = -20; y < 20; y += 7) {
      for (let x = -20; x < 20; x += 7) {
        const chunk = world.getChunk(x, y);
        const scenery = chunk.getDecorationCells();
        const kinds = new Set(getBiomeDecorations(chunk.biome));

        const dry = [...Array(CELL_COUNT).keys()].filter(
          (cell) => chunk.getCellRole(cell) === 'ground',
        ).length;

        // Nothing grows out of water, so what a chunk can hold is
        // measured against the dry ground it actually has: one a lake
        // or a sea has taken holds less, and one with none holds none
        if (dry > CELL_COUNT / 2) {
          chunks++;
          expect(scenery.size).toBeGreaterThan(0);
          // The roll is 8 to 12, and scenery is placed last of the
          // three: a chunk whose landmarks and rocks left no room
          // takes fewer, which is allowed and should stay rare
          if (scenery.size < 8) {
            short++;
          }
        }
        expect(scenery.size).toBeLessThanOrEqual(12);

        for (const [cell, decoration] of scenery) {
          // Of this biome, and touching nothing of its own chunk's
          expect(kinds.has(decoration)).toBe(true);
          for (const neighbor of neighborCells(cell)) {
            expect(scenery.has(neighbor)).toBe(false);
          }
        }

        // Fixed forever, like the landmarks it was laid down before
        expect([...world.getChunk(x, y).getDecorationCells()]).toEqual([...scenery]);
      }
    }

    // A crowded board is the exception, not the rule
    expect(chunks).toBeGreaterThan(0);
    expect(short / chunks).toBeLessThan(0.05);
  });

  it('leaves a cell of room around every landmark', () => {
    const world = new World('overworld');

    for (let y = -40; y < 40; y += 7) {
      for (let x = -40; x < 40; x += 7) {
        const chunk = world.getChunk(x, y);
        const landmarks = chunk.getLandmarkCells();

        // No two landmarks touch, diagonals included, so each is
        // reachable from every side
        for (const cell of landmarks.keys()) {
          for (const neighbor of neighborCells(cell)) {
            expect(landmarks.has(neighbor)).toBe(false);
          }
        }

        // The open country is thin now: what a chunk holds is a
        // couple of things worth going out for, unless a town has been
        // laid over it, in which case it holds the town's own lots
        expect(landmarks.size).toBeGreaterThanOrEqual(1);
        // The area is the landmarks plus their rings, and a ring
        // inside the placement area is never empty
        expect(chunk.getLandmarkArea().size).toBeGreaterThan(landmarks.size);

        // Nor does anything touch the scenery, which was placed
        // before them
        for (const cell of landmarks.keys()) {
          expect(chunk.getDecorationArea().has(cell)).toBe(false);
        }
      }
    }
  });

  it('opens the hidden ability band on the family’s own day', () => {
    // The ability reads the third of the trait value's four slices
    const ABILITY_SHIFT = 16;
    const SLICES = 256;
    const hidden = (boost: number): number => {
      let found = 0;

      for (let slice = 0; slice < SLICES; slice++) {
        if (
          deriveAbility(Species.Bulbasaur, slice << ABILITY_SHIFT, boost) === Abilities.Chlorophyll
        ) {
          found++;
        }
      }
      return found;
    };
    const ordinary = hidden(1);

    expect(ordinary).toBeGreaterThan(0);
    expect(ordinary).toBeLessThan(SLICES);
    expect(hidden(SPECIES_DAY_HIDDEN_ABILITY_BOOST)).toBe(
      ordinary * SPECIES_DAY_HIDDEN_ABILITY_BOOST,
    );
    // And the day is actually worth something, whatever the boost is
    // set to
    expect(hidden(SPECIES_DAY_HIDDEN_ABILITY_BOOST)).toBeGreaterThan(ordinary);
  });

  it('meets a featured wild pokemon on the wider band', () => {
    const world = new World('overworld');
    // Family 0 is Bulbasaur's, so the first day of the year is its own
    const YEAR_START = Date.UTC(2026, 0, 1);
    const featured = new ChunkSnapshot(world.getChunk(3, -7), YEAR_START);
    const ordinary = new ChunkSnapshot(
      world.getChunk(3, -7),
      YEAR_START + 200 * 24 * 60 * 60 * 1000,
    );
    // A slice inside the widened band but outside the ordinary one:
    // the only thing that decides it is which day the meeting is on
    const trait = ((256 / 8 + 1) << 16) >>> 0;

    expect(deriveEncounter(featured, [Species.Bulbasaur, 0, trait]).ability).toBe(
      Abilities.Chlorophyll,
    );
    expect(deriveEncounter(ordinary, [Species.Bulbasaur, 0, trait]).ability).toBe(
      Abilities.Overgrow,
    );
  });

  it('hands a wild pokemon whatever its species carries', () => {
    const world = new World('overworld');
    const snapshot = new ChunkSnapshot(world.getChunk(3, -7), 12 * 60 * 60 * 1000);

    // A species that carries nothing is met empty-handed whatever it
    // rolled
    for (const trait of [0, 0x4000_0000, 0xffff_ffff]) {
      expect(deriveEncounter(snapshot, [Species.Eevee, 0, trait]).items).toEqual([]);
    }

    // Three slots, three items, and the rarest is the one only that
    // species can use
    const pikachu = new Map<Items, number>();

    for (let trait = 0; trait < 4000; trait++) {
      for (const item of deriveEncounter(snapshot, [Species.Pikachu, 0, trait]).items) {
        pikachu.set(item, (pikachu.get(item) ?? 0) + 1);
      }
    }

    expect(pikachu.get(Items.LightBall)).toBeGreaterThan(0);
    expect(pikachu.get(Items.LightBall)).toBeLessThan(pikachu.get(Items.Magnet) ?? 0);
    expect(pikachu.get(Items.Magnet)).toBeLessThan(pikachu.get(Items.OranBerry) ?? 0);

    // A Paras is either carrying the big mushroom, the small one, or
    // nothing — never two of them
    const carried = new Set<Items>();
    let empty = 0;

    for (let trait = 0; trait < 4000; trait++) {
      const { items } = deriveEncounter(snapshot, [Species.Paras, 0, trait]);

      expect(items.length).toBeLessThanOrEqual(1);

      if (items.length === 0) {
        empty++;
      } else {
        carried.add(items[0]);
      }
    }

    expect(carried).toEqual(new Set([Items.TinyMushroom, Items.BigMushroom]));
    // Roughly the mainline's odds: half carry the common one, a
    // twentieth the rare one, and the rest nothing
    expect(empty / 4000).toBeCloseTo(1 - WILD_HELD_COMMON - WILD_HELD_UNCOMMON, 1);
  });

  it('leaves a raid prize and a hatchling empty-handed', () => {
    const world = new World('overworld');
    const snapshot = new ChunkSnapshot(world.getChunk(3, -7), 12 * 60 * 60 * 1000);

    // The species carries something in the wild, so the type is the
    // only thing deciding this
    for (const type of [EncounterType.LegendaryRaid, EncounterType.Hatched]) {
      for (let trait = 0; trait < 200; trait++) {
        expect(
          deriveEncounter(snapshot, [Species.Paras, 0, trait], undefined, { type }).items,
        ).toEqual([]);
      }
    }
  });

  it('derives concrete encounters from spawn tuples', () => {
    const world = new World('overworld');
    const NOON = 12 * 60 * 60 * 1000;

    // Whichever nearby chunk rolls one: which biomes spawn what is
    // the seed's own business, and this is about deriving, not maps
    let snapshot: ChunkSnapshot | null = null;
    let spawn: Spawn | undefined;

    for (let at = 0; at < 64 && spawn == null; at++) {
      const probe = new ChunkSnapshot(world.getChunk(at % 8, Math.floor(at / 8)), NOON);

      spawn = probe.getSpawns(1).at(0);
      if (spawn != null) {
        snapshot = probe;
      }
    }
    if (snapshot == null || spawn == null) {
      throw new Error('no chunk in the probe area rolled a spawn');
    }

    const instance = deriveEncounter(snapshot, spawn);

    expect(instance.type).toBe(EncounterType.Wild);
    expect(instance.species).toBe(spawn[0]);
    expect(instance.individualValue).toBe(spawn[1]);
    expect(instance.traitValue).toBe(spawn[2]);
    expect(Number.isInteger(instance.level)).toBe(true);
    expect(instance.level).toBeGreaterThanOrEqual(5);
    expect(instance.level).toBeLessThanOrEqual(100);
    for (const iv of Object.values(unpackIVs(instance.ivs))) {
      expect(iv).toBeGreaterThanOrEqual(0);
      expect(iv).toBeLessThanOrEqual(31);
    }
    expect(instance.nature).toBeGreaterThanOrEqual(0);
    expect(instance.nature).toBeLessThan(25);

    const pools = getSpeciesAbilityPools(instance.species);
    expect([...pools.regular, ...pools.hidden]).toContain(instance.ability);

    // Gender follows the species ratio; the moveset is the tail of
    // the level-up learn set
    const data = getSpeciesData(instance.species);
    if (data.genderRatio == null) {
      expect(instance.gender).toBe(Genders.Genderless);
    } else {
      expect([Genders.Male, Genders.Female]).toContain(instance.gender);
    }
    expect(instance.moves.length).toBeGreaterThan(0);
    expect(instance.moves.length).toBeLessThanOrEqual(4);
    const learnable = Object.entries(data.learnSet.level)
      .filter(([threshold]) => Number(threshold) <= instance.level)
      .flatMap(([, moves]) => moves);
    for (const move of instance.moves) {
      expect(learnable).toContain(move);
    }

    expect(instance.timestamp).toBe(snapshot.timestamp);
    expect(instance.x).toBe(snapshot.chunk.x);
    expect(instance.y).toBe(snapshot.chunk.y);
    expect(instance.biome).toBe(snapshot.chunk.biome);

    // Same tuple, same instance
    expect(deriveEncounter(snapshot, spawn)).toEqual(instance);

    // An all-ones individual value maxes every IV slice
    const maxed = deriveEncounter(snapshot, [spawn[0], 0xffffffff, 0]);
    expect(maxed.ivs).toBe(PERFECT_IVS);

    // A zero trait value bottoms out the level and all-ones tops it —
    // within the band the species belongs to, which is what keeps a
    // level 90 Rattata out of the first field somebody walks into
    const [lowest, highest] = getSpawnLevels(spawn[0]);

    expect(maxed.level).toBe(lowest);
    expect(deriveEncounter(snapshot, [spawn[0], 0, 0xffffffff]).level).toBe(highest);

    // Every species, at both ends. A legendary is the exception: one
    // of each exists, and it may be met at any strength at all
    for (const one of getRegisteredSpecies()) {
      const [floor, ceiling] = getSpawnLevels(one);
      const rarity = getSpawnRarity(one);
      const legend = rarity === SpawnRarity.Special || rarity === SpawnRarity.Mythical;

      expect(ceiling, getSpeciesData(one).name).toBeGreaterThan(floor);
      expect(floor).toBeGreaterThanOrEqual(1);
      expect(ceiling).toBeLessThanOrEqual(100);
      expect(legend).toBe(floor === 1 && ceiling === 100);
    }

    // Sex-locked species never roll the other gender, whatever the
    // gender slice (byte 1) holds
    for (const traits of [0 << 8, 128 << 8, 255 << 8]) {
      expect(deriveEncounter(snapshot, [Species.Chansey, 0, traits]).gender).toBe(Genders.Female);
      expect(deriveEncounter(snapshot, [Species.Tauros, 0, traits]).gender).toBe(Genders.Male);
      expect(deriveEncounter(snapshot, [Species.Ditto, 0, traits]).gender).toBe(Genders.Genderless);
    }
  });

  it('sparkles per trainer via the halved XOR resonance', () => {
    // Reproduce the trainer hash and craft a resonant trait value:
    // high half = trainer halves' XOR, low half = 0. Shininess reads
    // the trait value, so the IVs have no say in it
    const trainerValue = new AleaRNG('trainer-red').int32();
    const halves = (trainerValue >>> 16) ^ (trainerValue & 0xffff);
    const shinyValue = (halves << 16) >>> 0;
    const plainValue = (((halves ^ 16) << 16) >>> 0) | 0xffff;

    expect(isShinyFor('trainer-red', shinyValue)).toBe(true);
    expect(isShinyFor('trainer-red', plainValue)).toBe(false);

    // The same pokemon is plain in another trainer's eyes
    expect(isShinyFor('trainer-blue', shinyValue)).toBe(false);

    // The instance carries the personal verdict; anonymous
    // derivations never sparkle
    const world = new World('overworld');
    const snapshot = new ChunkSnapshot(world.getChunk(0, 0), 0);
    const species = snapshot.getSpawns(1)[0][0];

    expect(isShiny(deriveEncounter(snapshot, [species, 0, shinyValue], 'trainer-red'))).toBe(true);
    expect(isShiny(deriveEncounter(snapshot, [species, 0, shinyValue]))).toBe(false);

    // Two pokemon sharing a trait value sparkle alike however their
    // individual values differ
    expect(
      isShiny(deriveEncounter(snapshot, [species, 0xffffffff, shinyValue], 'trainer-red')),
    ).toBe(true);
  });

  it('multiplies the shiny odds by whatever the player carries', () => {
    const world = new World('overworld');
    const snapshot = new ChunkSnapshot(world.getChunk(0, 0), 0);
    // A trait value that misses the plain 1/4096 band but lands
    // inside the eightfold one
    const trainerValue = new AleaRNG('trainer-red').int32();
    const halves = (trainerValue >>> 16) ^ (trainerValue & 0xffff);
    const nearMiss = (((halves ^ 64) << 16) >>> 0) | 0;

    expect(isShinyFor('trainer-red', nearMiss)).toBe(false);
    expect(isShinyFor('trainer-red', nearMiss, SHINY_CHARM_BOOST)).toBe(true);

    // The Shiny Charm rides in as a boost on the derivation
    const spawn = [Species.Magikarp, 0, nearMiss] as const;

    expect(isShiny(deriveEncounter(snapshot, [...spawn], 'trainer-red'))).toBe(false);
    expect(
      isShiny(
        deriveEncounter(snapshot, [...spawn], 'trainer-red', { shinyBoost: SHINY_CHARM_BOOST }),
      ),
    ).toBe(true);
  });

  it('sizes an individual from its trait value', () => {
    const listed = getSpeciesData(Species.Snorlax);

    for (const traitValue of [0, 1, 0x1234, 0xabcdef, 0xffffffff]) {
      const size = deriveSize(Species.Snorlax, traitValue);

      // Inside the band, and the same trait value always measures the
      // same — nothing about size is rolled at read time
      expect(size.height).toBeGreaterThanOrEqual(listed.height * MIN_SIZE_SCALE - 0.01);
      expect(size.height).toBeLessThanOrEqual(listed.height * MAX_SIZE_SCALE + 0.01);
      expect(deriveSize(Species.Snorlax, traitValue)).toEqual(size);
    }

    // Weight follows the cube of the height, the way volume does
    const scale = deriveSizeScale(0xabcdef);

    expect(deriveSize(Species.Snorlax, 0xabcdef).weight).toBeCloseTo(listed.weight * scale ** 3, 1);

    // Individuals actually differ, and most land near the middle: the
    // scale averages two rolls, so the band's edges are rare
    const scales = Array.from({ length: 400 }, (_, seed) => deriveSizeScale(seed * 2654435761));
    const middle = (MIN_SIZE_SCALE + MAX_SIZE_SCALE) / 2;
    const spread = (MAX_SIZE_SCALE - MIN_SIZE_SCALE) / 4;

    expect(new Set(scales).size).toBeGreaterThan(100);
    expect(scales.filter((value) => Math.abs(value - middle) < spread).length).toBeGreaterThan(
      scales.length / 2,
    );
  });

  it('grows a pokemon when it evolves, keeping its proportions', () => {
    // Size is derived, not stored, so the same individual measured
    // against its evolution is bigger — but sits at the same point of
    // its species' band
    const traitValue = 0x5eed1234;
    const charmander = deriveSize(Species.Charmander, traitValue);
    const charizard = deriveSize(Species.Charizard, traitValue);

    expect(charizard.height).toBeGreaterThan(charmander.height);
    expect(charizard.weight).toBeGreaterThan(charmander.weight);
    expect(charmander.height / getSpeciesData(Species.Charmander).height).toBeCloseTo(
      charizard.height / getSpeciesData(Species.Charizard).height,
      2,
    );

    // The lightest species in the dex still weighs something
    expect(deriveSize(Species.Gastly, traitValue).weight).toBeGreaterThan(0);
  });

  it('floors a family-day raid reward at ten in every IV', () => {
    const world = new World('overworld');
    // The first day of the year features Bulbasaur's family
    const day = Date.UTC(2026, 0, 1);
    const snapshot = new ChunkSnapshot(world.getChunk(0, 0), day);
    // Every IV slice zero, so nothing but the floor can lift them
    const spawn = [Species.Bulbasaur, 0, 0] as const;

    const raid = deriveEncounter(snapshot, [...spawn], 'trainer-red', {
      type: EncounterType.LegendaryRaid,
    });

    expect(Object.values(unpackIVs(raid.ivs))).toEqual([
      RAID_FAMILY_DAY_MIN_IV,
      RAID_FAMILY_DAY_MIN_IV,
      RAID_FAMILY_DAY_MIN_IV,
      RAID_FAMILY_DAY_MIN_IV,
      RAID_FAMILY_DAY_MIN_IV,
      RAID_FAMILY_DAY_MIN_IV,
    ]);

    // Only raids on the family's own day get the floor
    const wild = deriveEncounter(snapshot, [...spawn], 'trainer-red');

    // Every slice zero packs to zero, which is the whole point of
    // the packing: six numbers are one
    expect(wild.ivs).toBe(0);

    const offDay = new ChunkSnapshot(world.getChunk(0, 0), day + 200 * 24 * 60 * 60 * 1000);

    expect(
      deriveEncounter(offDay, [...spawn], 'trainer-red', { type: EncounterType.LegendaryRaid }).ivs,
    ).toBe(0);

    // A rolled value above the floor is left alone
    const rolled = deriveEncounter(snapshot, [Species.Bulbasaur, 0xffffffff, 0], 'trainer-red', {
      type: EncounterType.LegendaryRaid,
    });

    expect(rolled.ivs).toBe(PERFECT_IVS);
  });

  it('marks a shadow raid reward as shadowed', () => {
    const world = new World('overworld');
    const snapshot = new ChunkSnapshot(world.getChunk(0, 0), 0);
    const spawn = [Species.Gyarados, 0, 0] as const;

    expect(
      isShadow(
        deriveEncounter(snapshot, [...spawn], 'trainer-red', {
          type: EncounterType.LegendaryRaid,
          shadow: true,
        }),
      ),
    ).toBe(true);

    // Everything else is an ordinary meeting
    expect(isShadow(deriveEncounter(snapshot, [...spawn], 'trainer-red'))).toBe(false);
  });

  it('rolls a raid reward per player from the raid seed', () => {
    const raid = {
      kind: RaidKind.Legendary,
      lair: Lairs.SeafoamIslands,
      species: Species.Articuno,
      traitValue: 0x12345678,
      host: 'red',
      teams: [],
      battle: 'battle-id',
      timestamp: 0,
      offset: 0,
      chunk: { seed: 'chunk', x: 0, y: 0 },
      biome: Biome.PolarOcean,
      cell: 0,
      cleared: true,
    };

    const [redId, red] = deriveRaidReward(raid, 'raid-id', 'red');
    const [blueId, blue] = deriveRaidReward(raid, 'raid-id', 'blue');

    // The same legendary, but a different individual for each player
    expect(red[0]).toBe(Species.Articuno);
    expect(blue[0]).toBe(Species.Articuno);
    expect(red[1]).not.toBe(blue[1]);
    expect(red[2]).not.toBe(blue[2]);

    // The spawn id is the raid's; startEncounter keys the stored
    // encounter by the player
    expect(redId).toBe(blueId);

    // A player's own reward is the same however often it is derived
    expect(deriveRaidReward(raid, 'raid-id', 'red')[1]).toEqual(red);

    // Another raid of the same species pays something else again
    const other = deriveRaidReward({ ...raid, traitValue: 0x87654321 }, 'raid-id', 'red');

    expect(other[1][1]).not.toBe(red[1]);
  });

  it('hands raid rewards over at a fixed level', () => {
    const world = new World('overworld');
    const snapshot = new ChunkSnapshot(world.getChunk(0, 0), 0);
    // A trait value that would otherwise roll a high level
    const spawn = [Species.Gyarados, 0, 0xffffffff] as const;

    const legendary = deriveEncounter(snapshot, [...spawn], 'trainer-red', {
      type: EncounterType.LegendaryRaid,
      level: LEGENDARY_RAID_REWARD_LEVEL,
    });
    const shadow = deriveEncounter(snapshot, [...spawn], 'trainer-red', {
      type: EncounterType.ShadowRaid,
      level: SHADOW_RAID_REWARD_LEVEL,
      shadow: true,
    });

    // The two lobbies hand over different prizes, and a record says
    // which one it came out of
    expect(legendary.type).toBe(EncounterType.LegendaryRaid);
    expect(shadow.type).toBe(EncounterType.ShadowRaid);
    expect(legendary.type).not.toBe(shadow.type);
    expect(ENCOUNTER_TYPE_NAMES[legendary.type]).toBe('Legendary Raid');
    expect(ENCOUNTER_TYPE_NAMES[shadow.type]).toBe('Shadow Raid');

    const mythical = deriveEncounter(snapshot, [...spawn], 'trainer-red', {
      type: EncounterType.MythicalRaid,
      level: MYTHICAL_RAID_REWARD_LEVEL,
    });

    expect(legendary.level).toBe(50);
    expect(shadow.level).toBe(25);
    expect(mythical.level).toBe(30);

    // All three are raids where raids are alike, and none of them is
    // recorded as another
    expect(mythical.type).toBe(EncounterType.MythicalRaid);
    expect(ENCOUNTER_TYPE_NAMES[mythical.type]).toBe('Mythical Raid');
    expect(new Set([legendary.type, shadow.type, mythical.type]).size).toBe(3);
    for (const kind of [legendary.type, shadow.type, mythical.type]) {
      expect(isRaidEncounter(kind)).toBe(true);
    }

    // The moves follow the fixed level, not the rolled one
    expect(legendary.moves).toEqual(deriveMoves(Species.Gyarados, 50));

    // A wild meeting still rolls its level from the trait value, and
    // rolls it inside the band its own line names
    const wild = deriveEncounter(snapshot, [...spawn], 'trainer-red');
    const [floor, ceiling] = getSpawnLevels(Species.Gyarados);

    expect(wild.level).toBeGreaterThanOrEqual(floor);
    expect(wild.level).toBeLessThanOrEqual(ceiling);
  });

  it('drops what a grunt owes at its own level, under its own kind', () => {
    const world = new World('overworld');
    const snapshot = new ChunkSnapshot(world.getChunk(0, 0), 0);
    // A trait value that would otherwise roll a high level
    const spawn = [Species.Gyarados, 0, 0xffffffff] as const;

    const dropped = deriveEncounter(snapshot, [...spawn], 'trainer-red', {
      type: EncounterType.Rocket,
      level: ROCKET_REWARD_LEVEL,
      shadow: true,
    });

    expect(dropped.level).toBe(10);
    expect(dropped.moves).toEqual(deriveMoves(Species.Gyarados, 10));
    expect(isShadow(dropped)).toBe(true);

    // A grunt's drop is its own kind of meeting, not a raid prize:
    // the record says where it actually came from
    expect(dropped.type).toBe(EncounterType.Rocket);
    expect(isRaidEncounter(dropped.type)).toBe(false);
    expect(ENCOUNTER_TYPE_NAMES[dropped.type]).toBe('Taken from a syndicate');
    // Both raids count as raids where they are alike, and neither is
    // what a grunt hands over
    expect(isRaidEncounter(EncounterType.LegendaryRaid)).toBe(true);
    expect(isRaidEncounter(EncounterType.ShadowRaid)).toBe(true);
  });

  it('rolls hidden abilities at their rarer odds', () => {
    const world = new World('overworld');
    const snapshot = new ChunkSnapshot(world.getChunk(0, 0), 0);

    // Lapras: regular Water Absorb/Shell Armor, hidden Hydration and
    // Friend Guard sharing the one rare band
    const species = Species.Lapras;
    const { abilities, hiddenAbilities } = getSpeciesData(species);
    const rare = new Set(hiddenAbilities);

    // Sweep the whole ability slice (byte 2 of the trait value)
    let hidden = 0;
    const SAMPLES = 256;
    for (let slice = 0; slice < SAMPLES; slice++) {
      const instance = deriveEncounter(snapshot, [species, 0, slice << 16]);

      if (rare.has(instance.ability)) {
        hidden += 1;
      } else {
        expect(abilities).toContain(instance.ability);
      }
    }

    // Around 1/8 of spawns carry the hidden ability
    expect(hidden / SAMPLES).toBeGreaterThan(0.08);
    expect(hidden / SAMPLES).toBeLessThan(0.17);
  });
});

describe('terrain spots', () => {
  it('reads the water out of the world rather than growing it in the chunk', () => {
    const world = new World('overworld');

    // A chunk that is sea in every cell is water throughout: nothing
    // in one is the other ground. Asked of every cell rather than of
    // the chunk's own biome, which is only the country in its middle:
    // a chunk on a coast is named for the sea and still holds a beach
    const sea = findChunk(world, (candidate) =>
      [...candidate.getCellBiomes()].every((biome) => isOpenSea(biome)),
    );

    if (sea != null) {
      expect(sea.getSpotCells().size).toBe(0);
    }

    let spotted = 0;
    let crossed = 0;

    for (let x = -20; x < 20; x++) {
      for (let y = -20; y < 20; y++) {
        const chunk = world.getChunk(x, y);

        if (isWaterBiome(chunk.biome)) {
          continue;
        }

        const spots = chunk.getSpotCells();

        if (spots.size > 0) {
          spotted += 1;
        }
        // A lake that reaches the last column runs on into the first
        // column of the chunk beside it: neither of them decided where
        // it began, so neither can end it at the boundary
        const east = world.getChunk(x + 1, y);

        for (let row = 0; row < CHUNK_CELLS; row++) {
          if (
            spots.has(row * CHUNK_CELLS + CHUNK_CELLS - 1) &&
            east.getCellRole(row * CHUNK_CELLS) === 'water'
          ) {
            crossed += 1;
          }
        }
      }
    }
    // Water on land at all, and water that carries over a boundary:
    // the old chunk-grown pools were confined to the placement area
    // and could not touch a rim, let alone cross one
    expect(spotted).toBeGreaterThan(0);
    expect(crossed).toBeGreaterThan(0);

    // Fixed forever: a fresh resolution of the chunk agrees
    const land = findChunk(world, (candidate) => !isWaterBiome(candidate.biome));

    expect(land).not.toBeNull();
    if (land != null) {
      expect([...world.getChunk(land.x, land.y).getSpotCells()]).toEqual([...land.getSpotCells()]);
    }
  });

  it('keeps scenery and the grounded landmarks out of the water', () => {
    const world = new World('overworld');
    let seen = 0;

    for (let x = 0; x < 60 && seen < 12; x++) {
      const chunk = world.getChunk(x, 0);

      if (isWaterBiome(chunk.biome)) {
        continue;
      }
      seen += 1;

      const water = chunk.getSpotCells();

      for (const cell of chunk.getDecorationCells().keys()) {
        expect(water.has(cell)).toBe(false);
      }
      // No landmark stands in a pool now that the phenomenon is not
      // one: something happening is rolled over the chunk instead,
      // and the water is the one thing that can be going on there
      for (const cell of chunk.getLandmarkCells().keys()) {
        expect(water.has(cell)).toBe(false);
      }
    }
    expect(seen).toBeGreaterThan(0);
  });

  it('keeps a happening out of the water where there is ground for it', () => {
    const world = new World('overworld');
    let checked = 0;

    // A pool is not where the interesting four are: a chunk with dry
    // ground puts what is going on onto it, so the pond stays a pond
    for (let x = 0; x < 25 && checked < 8; x++) {
      for (let y = 0; y < 8 && checked < 8; y++) {
        const chunk = world.getChunk(x, y);

        if (isWaterBiome(chunk.biome)) {
          continue;
        }

        const water = chunk.getSpotCells();

        for (let window = 0; window < 6; window++) {
          for (const cell of new ChunkSnapshot(chunk, window * PHENOMENON_INTERVAL)
            .getPhenomena()
            .keys()) {
            expect(water.has(cell)).toBe(false);
            checked += 1;
          }
        }
      }
    }
    expect(checked).toBeGreaterThan(0);
  });

  it('ripples on the open sea, where there is no ground at all', () => {
    const world = new World('overworld');
    let checked = 0;

    // Nothing out there is standing on anything, so the only thing
    // that can be going on is the water
    for (let x = -100; x < 100 && checked < 8; x += 2) {
      for (let y = -100; y < 100 && checked < 8; y += 25) {
        const chunk = world.getChunk(x, y);

        if (!isOpenSea(chunk.biome)) {
          continue;
        }

        for (let window = 0; window < 6; window++) {
          for (const phenomenon of new ChunkSnapshot(chunk, window * PHENOMENON_INTERVAL)
            .getPhenomena()
            .values()) {
            expect(phenomenon).toBe(Phenomenon.RipplingWater);
            checked += 1;
          }
        }
      }
    }
    expect(checked).toBeGreaterThan(0);
  });

  it('never closes the rock round a pocket nothing can walk to', () => {
    const world = new World('overworld');
    // Three chunks square, since a ridge belongs to the world rather
    // than to a chunk: read one chunk at a time, a ridge crossing it
    // cuts it in two and both halves are reached from the next chunk
    // along
    const span = CHUNK_CELLS * 3;
    const rock = (x: number, y: number): boolean =>
      roleAt(world, x - CHUNK_CELLS, y - CHUNK_CELLS) === 'wall';
    const key = (x: number, y: number): number => y * span + x;
    const reached = new Set<number>();
    const queue: [number, number][] = [];

    // In from the rim of the window, which is as far out as the walk
    // can be followed
    for (let at = 0; at < span; at++) {
      for (const [x, y] of [
        [at, 0],
        [at, span - 1],
        [0, at],
        [span - 1, at],
      ]) {
        if (!rock(x, y) && !reached.has(key(x, y))) {
          reached.add(key(x, y));
          queue.push([x, y]);
        }
      }
    }
    for (let at = 0; at < queue.length; at++) {
      const [x, y] = queue[at];

      // Straight steps only, the way the overworld is walked: a
      // diagonal slip past a corner is not a way out
      for (const [dx, dy] of CARDINALS) {
        const nx = x + dx;
        const ny = y + dy;

        if (nx < 0 || ny < 0 || nx >= span || ny >= span || reached.has(key(nx, ny))) {
          continue;
        }
        if (!rock(nx, ny)) {
          reached.add(key(nx, ny));
          queue.push([nx, ny]);
        }
      }
    }

    // Whatever the walk did not reach is shut in. Every such pocket is
    // bigger than the world fills in, since a small one is paved over
    // where it is found
    const shut = new Set<number>();

    for (let y = 0; y < span; y++) {
      for (let x = 0; x < span; x++) {
        if (!rock(x, y) && !reached.has(key(x, y))) {
          shut.add(key(x, y));
        }
      }
    }
    while (shut.size > 0) {
      const [first] = shut;
      const pocket = [first];

      shut.delete(first);
      for (let at = 0; at < pocket.length; at++) {
        const x = pocket[at] % span;
        const y = Math.floor(pocket[at] / span);

        for (const [dx, dy] of CARDINALS) {
          const next = key(x + dx, y + dy);

          if (shut.has(next)) {
            shut.delete(next);
            pocket.push(next);
          }
        }
      }
      expect(pocket.length).toBeGreaterThan(POCKET_LIMIT);
    }
  });
});

describe('what the ground grows', () => {
  it('bears no fruit where nothing can root', () => {
    // Lava, ice and bare sand: a bush there would be a landmark the
    // player walks to and finds impossible
    for (const biome of [
      Biome.Desert,
      Biome.ColdDesert,
      Biome.Badlands,
      Biome.Volcano,
      Biome.Glacier,
      Biome.AlpineTundra,
    ]) {
      expect(growsBerries(biome)).toBe(false);
      expect(growsTrees(biome)).toBe(false);
    }
    // And nothing at all afloat
    expect(growsBerries(Biome.DeepOcean)).toBe(false);
  });

  it('fruits where a bush can stand, and grows a tree only below the line', () => {
    expect(growsBerries(Biome.Grassland)).toBe(true);
    expect(growsTrees(Biome.TemperateForest)).toBe(true);

    // The permafrost and the open steppe carry berries the way the
    // real ones do, but nothing stands tall on either
    for (const biome of [Biome.Tundra, Biome.Steppe, Biome.Mountain]) {
      expect(growsBerries(biome)).toBe(true);
      expect(growsTrees(biome)).toBe(false);
    }
  });

  it('rolls no patch or tree into a chunk that cannot grow one', () => {
    const world = new World('overworld');
    let barren = 0;
    let treeless = 0;
    let growing = 0;

    for (let x = -60; x < 60; x += 3) {
      for (let y = -60; y < 60; y += 3) {
        const chunk = world.getChunk(x, y);
        const landmarks = chunk.getLandmarks();
        const patches = landmarks.filter((kind) => kind === Landmark.BerryPatch).length;
        const trees = landmarks.filter((kind) => kind === Landmark.ApricornTree).length;

        if (!growsBerries(chunk.biome)) {
          barren += 1;
          expect(patches).toBe(0);
        }
        if (!growsTrees(chunk.biome)) {
          treeless += 1;
          expect(trees).toBe(0);
        }
        growing += growsTrees(chunk.biome) ? patches + trees : 0;
      }
    }
    // The sweep has to have crossed both kinds of dead ground, and
    // the living ground still bears
    expect(barren).toBeGreaterThan(0);
    expect(treeless).toBeGreaterThan(barren);
    expect(growing).toBeGreaterThan(0);
  });
});

describe('the open seas', () => {
  it('rolls no berry patch and no wandering npc afloat', () => {
    const world = new World('overworld');
    let seen = 0;

    for (let x = -100; x < 100 && seen < 12; x += 2) {
      for (let y = -100; y < 100 && seen < 12; y += 25) {
        const chunk = world.getChunk(x, y);

        if (!isOpenSea(chunk.biome)) {
          continue;
        }
        seen += 1;
        for (const landmark of chunk.getLandmarks()) {
          expect(landmark).not.toBe(Landmark.BerryPatch);
          expect(landmark).not.toBe(Landmark.WanderingNpc);
          // Nobody keeps a stall, a seat or a notice board out at sea
          expect(landmark).not.toBe(Landmark.Market);
          expect(landmark).not.toBe(Landmark.GymSeat);
          expect(landmark).not.toBe(Landmark.AuctionBoard);
        }
      }
    }
    expect(seen).toBeGreaterThan(0);
  });

  it('puts a duel afloat, and only somebody who could be out there', () => {
    const world = new World('overworld');
    let duels = 0;
    let seen = 0;

    for (let x = -100; x < 100 && seen < 24; x += 2) {
      for (let y = -100; y < 100 && seen < 24; y += 25) {
        const chunk = world.getChunk(x, y);

        if (!isOpenSea(chunk.biome)) {
          continue;
        }
        seen += 1;

        const snapshot = new ChunkSnapshot(chunk, 0);

        for (const [cell, landmark] of chunk.getLandmarkCells()) {
          if (landmark !== Landmark.Trainer) {
            continue;
          }
          duels += 1;

          const trainer = snapshot.getTrainerClass(cell);

          expect(trainer).not.toBeNull();
          if (trainer == null) {
            continue;
          }
          // A swimmer swims and a sailor has a boat. Nobody who needs
          // ground under them is met out here, the Aces included
          expect(new Set(TRAINER_TYPES[trainer]).has(Types.Water)).toBe(true);
          expect(isAceTrainer(trainer)).toBe(false);
        }
      }
    }
    expect(seen).toBeGreaterThan(0);
    // The seas are not empty of them: the landmark rolls out here now
    expect(duels).toBeGreaterThan(0);
  });

  it('keeps everything out of the rocks, and mixes shallows in around them', () => {
    const world = new World('overworld');
    // A sea chunk with rock in it: the stone field runs where it
    // runs, so plenty of open water has none at all
    const chunk = findChunk(
      world,
      (candidate) => isOpenSea(candidate.biome) && candidate.getRockCells().size > 0,
    );

    expect(chunk).not.toBeNull();
    if (chunk == null) {
      return;
    }

    const rocks = chunk.getRockCells();
    const shallows = chunk.getShallowCells();

    // Nothing stands in one, and the answer is the same every time
    // the chunk is resolved
    expect([...world.getChunk(chunk.x, chunk.y).getRockCells()]).toEqual([...rocks]);
    for (const cell of chunk.getDecorationCells().keys()) {
      expect(rocks.has(cell)).toBe(false);
    }
    for (const cell of chunk.getLandmarkCells().keys()) {
      expect(rocks.has(cell)).toBe(false);
    }

    const snapshot = new ChunkSnapshot(chunk, 0);

    snapshot.getSpawns(10);
    expect(snapshot.getSpawnCells().size).toBeGreaterThan(0);
    for (const [cell] of snapshot.getSpawnCells()) {
      expect(rocks.has(cell)).toBe(false);
    }

    // Every outcrop wears a skirt of shelf, and no cell is both
    expect(shallows.size).toBeGreaterThan(0);
    for (const cell of shallows) {
      expect(rocks.has(cell)).toBe(false);
    }
    expect([...world.getChunk(chunk.x, chunk.y).getShallowCells()]).toEqual([...shallows]);

    // Shelf is the seas' and the wetlands' own look: a field with a
    // pond in it draws the pond with its own shoreline instead
    const land = findChunk(world, (candidate) => !isWaterBiome(candidate.biome));

    if (land != null) {
      expect(land.getShallowCells().size).toBe(0);
    }
  });

  it('grows rocks on land too, kept clear of the pools', () => {
    const world = new World('overworld');
    const chunk = findChunk(
      world,
      (candidate) => !isWaterBiome(candidate.biome) && candidate.getRockCells().size > 0,
    );

    expect(chunk).not.toBeNull();
    if (chunk == null) {
      return;
    }

    const rocks = chunk.getRockCells();
    const pools = chunk.getSpotCells();

    for (const cell of rocks) {
      expect(pools.has(cell)).toBe(false);
    }
    // Fixtures keep their ring from the outcrop, bar the one that is
    // cut into it: a cave mouth with no rock beside it would be a way
    // into a hillside that is not there
    for (const [cell, landmark] of chunk.getLandmarkCells()) {
      if (landmark === Landmark.CaveMouth) {
        expect(rocks.has(cell)).toBe(false);
        expect(neighborCells(cell).some((neighbor) => rocks.has(neighbor))).toBe(true);
        continue;
      }
      expect(rocks.has(cell)).toBe(false);
      for (const neighbor of neighborCells(cell)) {
        expect(rocks.has(neighbor)).toBe(false);
      }
    }
    for (const cell of chunk.getDecorationCells().keys()) {
      expect(rocks.has(cell)).toBe(false);
      for (const neighbor of neighborCells(cell)) {
        expect(rocks.has(neighbor)).toBe(false);
      }
    }
  });
});

describe('placement invariants', () => {
  it('keeps every fixture a ring away from the rocks', () => {
    const world = new World('overworld');
    const chunk = findChunk(world, (candidate) => isOpenSea(candidate.biome));

    expect(chunk).not.toBeNull();
    if (chunk == null) {
      return;
    }

    const rocks = chunk.getRockCells();
    const standing = [...chunk.getLandmarkCells().keys(), ...chunk.getDecorationCells().keys()];

    for (const cell of standing) {
      expect(rocks.has(cell)).toBe(false);
      for (const neighbor of neighborCells(cell)) {
        expect(rocks.has(neighbor)).toBe(false);
      }
    }
  });

  it('stands a wetland happening on a bank, where a grotto can be', () => {
    const world = new World('overworld');
    let phenomena = 0;
    let banked = 0;

    for (let x = -200; x < 200; x += 4) {
      for (let y = -200; y < 200 && phenomena < 12; y += 4) {
        const chunk = world.getChunk(x, y);

        if (!isWaterBiome(chunk.biome) || isOpenSea(chunk.biome)) {
          continue;
        }

        const banks = chunk.getSpotCells();

        // Only where the marsh has a bank to stand on: the banks are
        // the world's own dry ground now, and a chunk the water covers
        // outright has none
        if (banks.size === 0) {
          continue;
        }
        for (const cell of new ChunkSnapshot(chunk, 0).getPhenomena().keys()) {
          phenomena += 1;
          banked += banks.has(cell) ? 1 : 0;
        }
      }
    }
    // A marsh that only ever rippled would be a marsh that never hid
    // a grotto, so dry ground is taken first where there is any
    expect(phenomena).toBeGreaterThan(0);
    expect(banked).toBe(phenomena);
  });
});

describe('portal balancing', () => {
  it('never rolls a second of anything a chunk keeps one of', () => {
    const world = new World('overworld');
    const singletons = [
      Landmark.Portal,
      Landmark.GymLeader,
      Landmark.EliteFour,
      Landmark.Champion,
      Landmark.GymSeat,
      Landmark.AuctionBoard,
    ];

    for (let y = 0; y < 8; y++) {
      for (let x = 0; x < 25; x++) {
        const landmarks = world.getChunk(x, y).getLandmarks();

        for (const singleton of singletons) {
          expect(landmarks.filter((kind) => kind === singleton).length).toBeLessThanOrEqual(1);
        }
      }
    }
  });

  it('stations the keeper beside the portal, some windows', () => {
    const world = new World('overworld');
    let stationed = 0;
    let quiet = 0;

    for (let x = 0; x < 25 && stationed === 0; x++) {
      for (let y = 0; y < 8; y++) {
        const chunk = world.getChunk(x, y);
        const portal = getPortalCell(chunk);

        if (portal == null) {
          continue;
        }

        for (let window = 0; window < 64; window++) {
          const snapshot = new ChunkSnapshot(chunk, window * SNAPSHOT_INTERVAL);
          const spawns = snapshot.getSpawns(SPAWN_COUNT + LURE_SPAWN_BONUS);

          // The keeper counts against the window rather than on top
          expect(spawns.length).toBeLessThanOrEqual(SPAWN_COUNT + LURE_SPAWN_BONUS);

          const keepers = [...snapshot.getSpawnCells()].filter(
            ([, spawn]) => spawn[0] === Species.Porygon,
          );

          if (keepers.length === 0) {
            quiet++;
            continue;
          }
          // One keeper, published first, standing in the portal's ring
          expect(keepers.length).toBe(1);
          expect(spawns[0][0]).toBe(Species.Porygon);
          expect(neighborCells(portal)).toContain(keepers[0][0]);
          stationed++;
        }
      }
    }
    expect(stationed).toBeGreaterThan(0);
    expect(quiet).toBeGreaterThan(0);
  });

  it('keeps porygon out of every wild pool', () => {
    for (const biome of Object.keys(BIOME_NAMES).map(Number) as Biome[]) {
      for (const time of [TimeOfDay.Morning, TimeOfDay.Day, TimeOfDay.Evening, TimeOfDay.Night]) {
        const pool = getSpawnPool(biome, time);

        for (const band of [pool.base, pool.uncommon, pool.rare, pool.special]) {
          expect(band.some((entry) => entry.species === Species.Porygon)).toBe(false);
        }
      }
    }
  });
});

describe('buddy copy', () => {
  /**
   * The figure each buddy line prints, against the constant the
   * overworld actually reads. The description is written by hand, so
   * this is what stops it saying one thing while the field does
   * another
   */
  const FIGURES: [Abilities, string, number][] = [
    [Abilities.ArenaTrap, '3 more', LURE_SPAWN_BONUS],
    [Abilities.Illuminate, '3 more', LURE_SPAWN_BONUS],
    [Abilities.NoGuard, '3 more', LURE_SPAWN_BONUS],
    [Abilities.Illuminate, 'lit 3 cells out', ILLUMINATE_LAMP_CELLS],
    [Abilities.Stench, '2 fewer', STENCH_QUIET],
    [Abilities.CompoundEyes, '2.5x', COMPOUND_EYES_HELD_BOOST],
    [Abilities.Pickup, 'every 512 steps', PICKUP_STEP_INTERVAL],
    [Abilities.HoneyGather, 'every 384 steps', HONEY_STEP_INTERVAL],
    [Abilities.Gluttony, '1.5x as long', GLUTTONY_FEAST],
    [Abilities.SuperLuck, 'critical 2x as often', KEEN_CRITICAL_BOOST],
    [Abilities.Sniper, '2 chances', SNIPER_AIMS],
    [Abilities.KeenEye, 'lifts by 3', LEVEL_FLOOR_LIFT],
    [Abilities.Intimidate, 'lifts by 3', LEVEL_FLOOR_LIFT],
    [Abilities.Hustle, 'lifts by 3', LEVEL_CEILING_LIFT],
    [Abilities.Pressure, 'lifts by 3', LEVEL_CEILING_LIFT],
    [Abilities.VitalSpirit, 'lifts by 3', LEVEL_CEILING_LIFT],
    [Abilities.Purified, '1.5x', PURIFIED_SHADOW_RELIEF],
    [Abilities.FlashFire, '1.5x', KINSHIP_CATCH_BOOST],
    [Abilities.SapSipper, '1.5x', KINSHIP_CATCH_BOOST],
    [Abilities.Synchronize, '1/2 of wild', SYNCHRONIZE_CHANCE],
    [Abilities.CuteCharm, '2/3 of wild', CUTE_CHARM_CHANCE],
  ];

  it('prints the figure the field actually uses', () => {
    for (const [ability, said, number] of FIGURES) {
      const data = getAbilityData(ability);
      // The figure in the line, pulled back out of it
      const printed = /(\d+(?:\.\d+)?)(?:\/(\d+))?/.exec(said);

      expect(printed, said).not.toBeNull();

      const value =
        printed?.[2] == null ? Number(printed?.[1]) : Number(printed[1]) / Number(printed[2]);

      expect(value, `${data.name}: ${said}`).toBe(number);
      expect(data.description, data.name).toContain(said);
    }
  });

  it('says what every buddy ability does out of a fight', () => {
    // Every ability the overworld listens for has to say so, or a
    // player choosing who to walk with is reading a battle line about
    // a field effect
    for (const ability of BUDDY_ABILITIES) {
      const data = getAbilityData(ability);

      expect(data.description, `${data.name} says nothing about being a buddy`).toMatch(
        /As a buddy,|while it is the buddy/,
      );
    }
  });

  it('tells Keen Eye and Illuminate apart', () => {
    // The two carry the same battle line and do completely different
    // things beside a player, which is the case that made this worth
    // writing down at all
    expect(getAbilityData(Abilities.KeenEye).description).not.toBe(
      getAbilityData(Abilities.Illuminate).description,
    );
  });
});
