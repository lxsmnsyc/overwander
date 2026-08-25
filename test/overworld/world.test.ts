import { registerMoves } from '../../src/data/moves';
import { describe, expect, it } from 'vitest';
import AleaRNG from '../../src/core/alea';
import Abilities from '../../src/data/ids/abilities';
import PerlinNoise from '../../src/core/perlin';
import registerBiomeSpawns, {
  BIOME_NAMES,
  SpawnRarity,
  getSpawnPool,
  getSpawnRarity,
} from '../../src/data/biome';
import Biome, {
  BIOME_CONFIGS,
  TimeOfDay,
  getTimeOfDay,
  isOpenSea,
  isWaterBiome,
} from '../../src/data/ids/biome';
import Lairs, {
  EVERY_LAIR,
  getBiomeLairs,
  getLairSpecies,
  getLairTitle,
  getSpeciesLair,
} from '../../src/data/overworld/lair';
import Natures from '../../src/data/ids/natures';
import { ItemTypes, Items } from '../../src/data/ids/items';
import registerItems, { getItemData } from '../../src/data/items';
import EggGroups from '../../src/data/ids/egg-groups';
import { Genders, Species } from '../../src/data/ids/species';
import {
  SPECIES_DAY_HIDDEN_ABILITY_BOOST,
  getBaseSpecies,
  getRegisteredSpecies,
  getSpeciesAbilityPools,
  getSpeciesData,
  registerSpecies,
} from '../../src/data/species';
import { MAX_LEVEL } from '../../src/data/constants/levels';
import { WILD_HELD_COMMON, WILD_HELD_UNCOMMON } from '../../src/data/species/held-items';
import { RaidKind, deriveRaidReward, getRaidTitle } from '../../src/auth/raids';
import { BANNED_BOSS_MOVES, BOSS_BASE_HEALTH } from '../../src/battle/abilities/special';
import { EffectType } from '../../src/battle/events';
import { getMaxHealth } from '../../src/auth/health';
import { isShadow, isShiny } from '../../src/auth/caught-record';
import { PERFECT_IVS, Stats, unpackIVs } from '../../src/data/constants/stats';
import { Statuses, packStatuses } from '../../src/data/ids/status';
import { type RocketRecord, deriveRocketReward } from '../../src/auth/rocket-record';
import type Chunk from '../../src/overworld/chunk';
import { PLACEMENT_AREA, centeredCells, neighborCells } from '../../src/overworld/chunk';
import { getBiomeDecorations } from '../../src/data/overworld/decoration';
import ChunkSnapshot, {
  LANDMARK_INTERVAL,
  NEST_INTERVAL,
  NPC_INTERVAL,
  PHENOMENON_INTERVAL,
  RAID_INTERVAL,
  SNAPSHOT_INTERVAL,
  SPAWN_COUNT,
  type Spawn,
} from '../../src/overworld/chunk-snapshot';
import {
  BANNED_BOSS_SPECIES,
  BOSS_ALLIANCE,
  LEGENDARY_RAID_REWARD_LEVEL,
  MYTHICAL_RAID_REWARD_LEVEL,
  PLAYER_ALLIANCE,
  RAID_BOSS_LEVEL,
  SHADOW_RAID_REWARD_LEVEL,
  canStageBoss,
  collectAftermath,
  createRaidBattle,
  createRaidBossSnapshot,
  getBossMoves,
} from '../../src/overworld/raid';
import {
  GIOVANNI_GOLD_MAX,
  GIOVANNI_GOLD_MIN,
  GIOVANNI_PARTY_LEVEL,
  ROCKET_PARTY_LEVEL,
  ROCKET_REWARD_LEVEL,
  STOP_GOLD_MAX,
  STOP_GOLD_MIN,
  createRocketParty,
  rollStopGold,
} from '../../src/overworld/rocket';
import pickStartPosition, { START_AREA } from '../../src/overworld/start';
import { Moves } from '../../src/data/ids/moves';
import deriveEncounter, {
  ENCOUNTER_TYPE_NAMES,
  EncounterType,
  MAX_SIZE_SCALE,
  MIN_SIZE_SCALE,
  MOVE_LIMIT,
  SPAWN_LEVELS,
  deriveAbility,
  deriveMoves,
  deriveNature,
  deriveSize,
  deriveSizeScale,
  isRaidEncounter,
  isShinyFor,
} from '../../src/overworld/encounter';
import { encounterKey, encounterWindow } from '../../src/overworld/safari';
import { FOSSIL_OFFER_KINDS, getFossilPrice } from '../../src/data/overworld/fossil';
import { isFossil } from '../../src/data/items/fossils';
import Landmark from '../../src/data/overworld/landmark';
import { findPortal, findPortals, getPortalCell } from '../../src/overworld/portal';
import Npc, { GIOVANNI_CHARSETS, NPCS, npcSheets } from '../../src/data/overworld/npc';
import Phenomenon, {
  BIOME_PHENOMENA,
  getPhenomenonItems,
} from '../../src/data/overworld/phenomenon';
import { VENDOR_STAPLES, VENDOR_STOCK_KINDS, isMarketable } from '../../src/data/overworld/vendor';
import {
  MAX_BERRY_PICK,
  MIN_BERRY_PICK,
  resolveBerryPatch,
  resolveNest,
  resolvePhenomenon,
} from '../../src/overworld/landmarks';
import { LURE_SPAWN_BONUS } from '../../src/overworld/abilities/__create';
import { FLAME_BODY_FACTOR, PICKUP_STEP_INTERVAL } from '../../src/overworld/abilities/gen-1';
import { EGG_HATCH_STEPS } from '../../src/auth/egg';
import type Overworld from '../../src/overworld/core';
import type { Buddy } from '../../src/overworld/core';
import { CANDY_ITEM_BONUS } from '../../src/overworld/items/candy-items';
import { LUCK_INCENSE_BONUS, PURE_INCENSE_QUIET } from '../../src/overworld/items/incenses';
import { AMULET_COIN_BONUS, CLEANSE_TAG_QUIET } from '../../src/overworld/items/trinkets';
import { SHINY_CHARM_BOOST } from '../../src/overworld/items/key-items';
import createOverworld from '../../src/overworld/setup';
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
function findChunk(world: World, matches: (chunk: Chunk) => boolean): Chunk | null {
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

  it('rolls 5-7 fixed landmarks per chunk, each on its own cell', () => {
    const world = new World('overworld');
    const shapes = new Set<string>();

    for (let x = 0; x < 10; x++) {
      const chunk = world.getChunk(x, 0);
      const landmarks = chunk.getLandmarks();

      expect(landmarks.length).toBeGreaterThanOrEqual(8);
      expect(landmarks.length).toBeLessThanOrEqual(12);

      // One cell each: the cell map holds every landmark, all
      // within the central 15x15
      expect(chunk.getLandmarkCells().size).toBe(landmarks.length);
      for (const cell of chunk.getLandmarkCells().keys()) {
        expect(cell % 16).toBeGreaterThanOrEqual(1);
        expect(cell % 16).toBeLessThanOrEqual(14);
        expect(Math.floor(cell / 16)).toBeGreaterThanOrEqual(1);
        expect(Math.floor(cell / 16)).toBeLessThanOrEqual(14);
      }

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
  });

  it('shows one of the biome\u2019s own phenomena, an hour at a time', () => {
    const world = new World('overworld');
    const chunk = findChunk(world, (candidate) =>
      new Set(candidate.getLandmarkCells().values()).has(Landmark.Phenomenon),
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

      expect(chunk.getLandmarkCells().get(cell)).toBe(Landmark.Phenomenon);
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
    const beyond = findChunk(
      world,
      (candidate) =>
        candidate.biome === Biome.Beyond &&
        new Set(candidate.getLandmarkCells().values()).has(Landmark.Phenomenon),
    );

    if (beyond != null) {
      expect(new ChunkSnapshot(beyond, 0).getPhenomena().size).toBe(0);
    }
  });

  it('stages legendary raids on the raid window', () => {
    const world = new World('overworld');
    // Alpine tundra stages Articuno; the raid roll only reads the
    // A lair is a place: the polar ocean holds the Seafoam Islands,
    // and what is at home there is Articuno
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
    for (const [cell, roll] of raids) {
      expect(chunk.getLandmarkCells().get(cell)).toBe(Landmark.LegendaryLair);
      expect(roll.lair).toBe(Lairs.SeafoamIslands);
      expect(roll.species).toBe(Species.Articuno);
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

    // A mountain holds two: the volcano and the cave under it. Every
    // window stages one of them, and whoever is at home in it
    const hosted = new Set(getBiomeLairs(Biome.Mountain));

    expect(hosted).toEqual(new Set([Lairs.MtEmber, Lairs.CeruleanCave]));

    for (let window = 0; window < 12; window++) {
      for (const roll of new ChunkSnapshot(chunk, window * RAID_INTERVAL)
        .getLegendaryLairs()
        .values()) {
        expect(roll.lair).not.toBeNull();
        expect(hosted.has(roll.lair ?? Lairs.FarawayIsland)).toBe(true);
        expect(roll.species).toBe(getLairSpecies(roll.lair ?? Lairs.FarawayIsland));
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

  it('builds the raid boss with perfect IVs and no items', () => {
    const boss = createRaidBossSnapshot(Species.Articuno, 0x12345678);

    expect(boss.level).toBe(RAID_BOSS_LEVEL);
    expect(boss.ivs).toBe(PERFECT_IVS);
    expect(Object.values(boss.effortValues)).toEqual([0, 0, 0, 0, 0, 0]);
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
    // away the raid-sized pool the whole fight is built around; the
    // three copying moves are banned because each is a way back to it
    for (const move of [Moves.Transform, Moves.Metronome, Moves.MirrorMove, Moves.Mimic]) {
      expect(BANNED_BOSS_MOVES.has(move)).toBe(true);
    }

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
    // the pool it actually fights with — a boss at full is at full,
    // not at a tenth of itself
    const pool = bossUnits[0].checkStat(Stats.HP, 0);

    expect(pool).toBeGreaterThan(BOSS_BASE_HEALTH);
    expect(pool).toBeGreaterThan(getMaxHealth(boss) * 2);
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

  it('stands a Team Rocket grunt on one band of each rarity', () => {
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

      if (snapshot.isRocketBoss(cell)) {
        // The boss fields six: five rares and a legendary at the end
        expect(party).toHaveLength(6);
        continue;
      }
      // Three pokemon, weakest first: one from each of the biome's
      // base, uncommon and rare bands — a band the window leaves empty
      // borrows from the commonest one that is not
      expect(party).toHaveLength(3);
      for (const [at, band] of [pool.base, pool.uncommon, pool.rare].entries()) {
        const drawn = band.length > 0 ? band : [pool.base, pool.uncommon, pool.rare].flat();

        expect(new Set(drawn.map((entry) => entry.species)).has(party[at][0])).toBe(true);
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
    const party = createRocketParty(snapshot, spawns);

    expect(party).toHaveLength(3);
    for (const [at, member] of party.entries()) {
      // Every one of them stands at the same level whatever its
      // trait value would have rolled, and every one is a shadow
      expect(member.level).toBe(ROCKET_PARTY_LEVEL);
      expect(new Set(member.abilities).has(Abilities.Shadow)).toBe(true);
      expect(member.species).toBe(spawns[at][0]);
      // It belongs to no catch record, and never sparkles
      expect(member.caught).toBe('');
      expect(isShiny(member)).toBe(false);
      expect(member.items).toEqual([]);
    }

    // The traits are the spawn's own, so the three are not clones of
    // one build
    expect(new Set(party.map((member) => member.nature)).size).toBeGreaterThanOrEqual(1);
    expect(party.map((member) => member.ivs)).not.toEqual([]);

    // A duelling trainer fields the same three as their ordinary
    // selves: same species and level, nothing shadowed
    const duel = createRocketParty(snapshot, spawns, false);

    for (const [at, member] of duel.entries()) {
      expect(member.level).toBe(ROCKET_PARTY_LEVEL);
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

    for (const [cell, party] of snapshot.getTrainerStops()) {
      expect(chunk.getLandmarkCells().get(cell)).toBe(Landmark.Trainer);
      expect(party).toHaveLength(3);
      // Dressed from the trainer's wardrobe, not the grunt's
      expect(npcSheets(Npc.Trainer)).toContain(snapshot.getWandererCoats().get(cell));
    }
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
    const legendaries = new Set(EVERY_LAIR.map((lair) => getLairSpecies(lair)));

    // Six strong: five of the biome's rares and a legendary at the end
    expect(party).toHaveLength(6);
    expect(legendaries.has(party[5][0])).toBe(true);

    // Dressed as the boss himself
    expect(GIOVANNI_CHARSETS).toContain(staged.snapshot.getWandererCoats().get(staged.cell));

    // Fielded at his own level, all shadows
    const fielded = createRocketParty(staged.snapshot, party);

    for (const member of fielded) {
      expect(member.level).toBe(GIOVANNI_PARTY_LEVEL);
      expect(member.shadow).toBe(true);
    }
  });

  it('rolls a purse in the stop’s own range, the same on every ask', () => {
    for (let winner = 0; winner < 32; winner++) {
      const seed = `stop:purse:player-${winner}`;
      const purse = rollStopGold(seed, 3);
      const bounty = rollStopGold(seed, 6);

      expect(purse).toBeGreaterThanOrEqual(STOP_GOLD_MIN);
      expect(purse).toBeLessThanOrEqual(STOP_GOLD_MAX);
      expect(bounty).toBeGreaterThanOrEqual(GIOVANNI_GOLD_MIN);
      expect(bounty).toBeLessThanOrEqual(GIOVANNI_GOLD_MAX);
      // Seeded: asking again answers the same
      expect(rollStopGold(seed, 3)).toBe(purse);
    }
  });

  it('offers any of the boss’ six as the reward', () => {
    const record: RocketRecord = {
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
      const [, spawn] = deriveRocketReward(record, 'stop-id', `player-${winner}`);

      met.add(spawn[0]);
    }
    // Not the commoner pair alone: the back of the party is on offer,
    // the legendary included
    expect(met.size).toBeGreaterThan(2);
    expect(
      [...met].some((species) => record.party.slice(2).some((entry) => entry.species === species)),
    ).toBe(true);
  });

  it('pays a beaten grunt out in one of its two commoner species', () => {
    const record: RocketRecord = {
      player: 'red',
      party: [
        { species: Species.Rattata, individualValue: 1, traitValue: 2 },
        { species: Species.Pidgey, individualValue: 3, traitValue: 4 },
        { species: Species.Kangaskhan, individualValue: 5, traitValue: 6 },
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
      const [id, [species, individualValue, traitValue]] = deriveRocketReward(
        record,
        'stop-id',
        uid,
      );

      // Never the rare one: a grunt does not hand over its best
      expect(species).not.toBe(Species.Kangaskhan);
      offered.add(species);
      expect(id).toBe('stop-id$reward');
      // Each winner meets their own individual of it
      expect(individualValue).not.toBe(traitValue);
    }

    // Both commoners come up across enough winners
    expect(offered.size).toBe(2);

    // A player's own reward is the same however often it is derived
    expect(deriveRocketReward(record, 'stop-id', 'red')).toEqual(
      deriveRocketReward(record, 'stop-id', 'red'),
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
        // rare species and it is called after the ground
        expect(pool.rare.some((entry) => entry.species === roll.species)).toBe(true);
        expect(getLairTitle(roll.lair, chunk.biome, true)).toBe(
          `Shadow ${BIOME_NAMES[chunk.biome]} Lair`,
        );
        continue;
      }

      // Otherwise it has taken over one of the biome's own lairs, and
      // is called that place with a word in front of it
      expect(hosted.has(roll.lair)).toBe(true);
      expect(roll.species).toBe(getLairSpecies(roll.lair));
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

    // Never on a landmark: nobody opens the game already standing on
    // a raid
    const chunk = world.getChunk(start.chunkX, start.chunkY);

    expect(chunk.getLandmarkAt(start.cellX, start.cellY)).toBeNull();

    // The same player lands in the same place every time, and
    // different players spread out
    expect(pickStartPosition(world, 'player-uid')).toEqual(start);
    expect(pickStartPosition(world, 'other-uid')).not.toEqual(start);
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

  it('warms an egg picked up beside a Flame Body buddy', () => {
    const warm = createOverworld('player-uid', buddyWith([Abilities.FlameBody]));
    const plain = createOverworld('player-uid', buddyWith([Abilities.Overgrow]));

    expect(warm.checkEggSteps('egg', EGG_HATCH_STEPS)).toBe(EGG_HATCH_STEPS * FLAME_BODY_FACTOR);
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

    expect(finder.checkWalkPickup('buddy', 0, far)).toBe(3);
    expect(plain.checkWalkPickup('buddy', 0, far)).toBe(0);
    // Short of the first mark is nothing at all
    expect(finder.checkWalkPickup('buddy', 0, PICKUP_STEP_INTERVAL - 1)).toBe(0);

    // It counts marks crossed rather than steps reported, so walking
    // the same distance in handfuls finds exactly as much
    let piecemeal = 0;

    for (let at = 0; at < far; at += 64) {
      piecemeal += finder.checkWalkPickup('buddy', at, Math.min(far, at + 64));
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
    expect(NPC_INTERVAL).toBe(6 * 60 * 60 * 1000);
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
    expect(snapshot.raidTimestamp).toBe(RAID_INTERVAL * 2);
    expect(snapshot.npcTimestamp).toBe(NPC_INTERVAL);
    expect(snapshot.nestTimestamp).toBe(0);
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

    // Whoever it is stands for six hours — twice a raid, so a raid
    // rolling over does not change who is at the cell — and the
    // windows are not all the same person
    expect(new ChunkSnapshot(chunk, RAID_INTERVAL).getWanderingNpcs()).toEqual(wanderers);
    expect(new ChunkSnapshot(chunk, NPC_INTERVAL - 1).getWanderingNpcs()).toEqual(wanderers);
    expect(new ChunkSnapshot(chunk, NPC_INTERVAL).npcTimestamp).toBe(NPC_INTERVAL);

    const shapes = new Set<string>();
    const met = new Set<Npc>();

    for (let window = 0; window < 24; window++) {
      const standing = new ChunkSnapshot(chunk, window * NPC_INTERVAL).getWanderingNpcs();

      shapes.add(JSON.stringify([...standing]));
      for (const npc of standing.values()) {
        met.add(npc);
      }
    }
    expect(shapes.size).toBeGreaterThan(1);
    // Everyone who wanders turns up: the nurse and the groomer are
    // drawn from the same pool as the two who came first
    expect(met.has(Npc.NurseJoy)).toBe(true);
    expect(met.has(Npc.Groomer)).toBe(true);
    expect(met.has(Npc.Vendor)).toBe(true);
    expect(met.has(Npc.MoveReminder)).toBe(true);
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

  it('fills a vendor’s crate from the window he was drawn in', () => {
    const world = new World('overworld');
    const chunk = findChunk(world, (candidate) =>
      new Set(candidate.getLandmarkCells().values()).has(Landmark.WanderingNpc),
    );

    expect(chunk).not.toBeNull();
    if (chunk == null) {
      return;
    }

    const crates = new Set<string>();
    let found = 0;

    for (let window = 0; window < 24; window++) {
      const at = window * NPC_INTERVAL;
      const snapshot = new ChunkSnapshot(chunk, at);

      for (const [cell, npc] of snapshot.getWanderingNpcs()) {
        const stock = snapshot.getVendorStock(cell);

        // Anybody else's cell holds no crate at all
        if (npc !== Npc.Vendor) {
          expect(stock).toEqual([]);
          continue;
        }
        found++;
        crates.add(JSON.stringify(stock));

        // Six kinds, none of them twice, and the two staples always
        // among them — a vendor with neither balls nor potions is one
        // a player cannot plan a walk around
        expect(stock.length).toBe(VENDOR_STOCK_KINDS);
        expect(new Set(stock).size).toBe(stock.length);
        for (const staple of VENDOR_STAPLES) {
          expect(new Set(stock).has(staple)).toBe(true);
        }
        // Priced goods only, which is what keeps the Master Ball out
        // of the crate without naming it
        for (const item of stock) {
          expect(isMarketable(item)).toBe(true);
          expect(getItemData(item).buy).toBeGreaterThan(0);
        }
        expect(new Set(stock).has(Items.MasterBall)).toBe(false);

        // Everybody who walks up to the same vendor is shown the same
        // crate: it is derived, not stored
        expect(new ChunkSnapshot(chunk, at + 1).getVendorStock(cell)).toEqual(stock);
      }
    }

    expect(found).toBeGreaterThan(0);
    // And the crates are not all the same crate
    expect(crates.size).toBeGreaterThan(1);
  });

  it('gives the fossil maniac two of the three, drawn with his window', () => {
    const world = new World('overworld');
    const chunk = findChunk(world, (candidate) =>
      new Set(candidate.getLandmarkCells().values()).has(Landmark.WanderingNpc),
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

  it('opens a portal onto the nearest portal of the biome asked for', () => {
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

    const destinations = findPortals(world, chunk.x, chunk.y);

    expect(destinations.size).toBeGreaterThan(0);

    for (const [biome, destination] of destinations) {
      // Every destination is a portal, of the biome it was filed
      // under, and somewhere other than here
      expect(destination.biome).toBe(biome);
      expect(world.getChunkBiome(destination.x, destination.y)).toBe(biome);
      expect(getPortalCell(world.getChunk(destination.x, destination.y))).toBe(destination.cell);
      expect(destination.x === chunk.x && destination.y === chunk.y).toBe(false);
      expect(destination.distance).toBeGreaterThan(0);

      // ...and it is the *nearest* one: nothing of that biome inside
      // its ring has a portal
      for (let radius = 1; radius < destination.distance; radius++) {
        for (let dy = -radius; dy <= radius; dy++) {
          for (let dx = -radius; dx <= radius; dx++) {
            if (Math.max(Math.abs(dx), Math.abs(dy)) !== radius) {
              continue;
            }

            const x = chunk.x + dx;
            const y = chunk.y + dy;

            if (isInWorld(x, y) && world.getChunkBiome(x, y) === biome) {
              expect(getPortalCell(world.getChunk(x, y))).toBeNull();
            }
          }
        }
      }
    }

    // Asked one biome at a time, the answer is the same one
    for (const [biome, destination] of destinations) {
      expect(findPortal(world, chunk.x, chunk.y, biome)).toEqual(destination);
    }
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

    // The pokemon branch is 1/8 rare, the rest uncommon, and never
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
      expect(getSpawnRarity(rare.species)).toBe(SpawnRarity.Rare);
    }
    expect(uncommon?.kind).toBe('pokemon');
    if (uncommon?.kind === 'pokemon') {
      expect(getSpawnRarity(uncommon.species)).toBe(SpawnRarity.Uncommon);
    }

    // The other three are half a meeting and half a find, and what
    // they leave behind is their own: dust turns up anything the
    // ground held, water only what it keeps, a shadow only wings
    for (const phenomenon of [
      Phenomenon.DustCloud,
      Phenomenon.RipplingWater,
      Phenomenon.FlyingShadow,
    ]) {
      const found = resolvePhenomenon(
        phenomenon,
        Biome.Grassland,
        TimeOfDay.Morning,
        rolls([0, 0.5]),
      );

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
        resolvePhenomenon(phenomenon, Biome.Grassland, TimeOfDay.Morning, rolls([0.9, 0.5, 0]))
          ?.kind,
      ).toBe('pokemon');
    }

    // A wing is the whole of what a shadow drops, and a ripple never
    // turns up a stone
    expect(new Set(getPhenomenonItems(Phenomenon.FlyingShadow)).has(Items.HealthWing)).toBe(true);
    expect(new Set(getPhenomenonItems(Phenomenon.RipplingWater)).has(Items.FireStone)).toBe(false);
    expect(new Set(getPhenomenonItems(Phenomenon.DustCloud)).has(Items.FireStone)).toBe(true);
    expect(getPhenomenonItems(Phenomenon.HiddenGrotto)).toEqual([]);
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

    // A biome with nothing that fits still answers from the plain band
    const landlocked = resolvePhenomenon(
      Phenomenon.RipplingWater,
      Biome.Grassland,
      TimeOfDay.Morning,
      (() => {
        const values = [0.9, 0.5, 0];
        return () => values.shift() ?? 0.999;
      })(),
    );

    expect(landlocked?.kind).toBe('pokemon');
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
          expect(x).toBeGreaterThanOrEqual(1);
          expect(x).toBeLessThanOrEqual(14);
          expect(y).toBeGreaterThanOrEqual(1);
          expect(y).toBeLessThanOrEqual(14);
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
    const room = centeredCells(PLACEMENT_AREA).filter(
      (cell) =>
        !chunk.getLandmarkCells().has(cell) &&
        !chunk.getDecorationCells().has(cell) &&
        !chunk.getRockCells().has(cell),
    );

    expect(packed.getSpawns(1000)).toHaveLength(room.length);
  });

  it('furnishes a chunk with the biome scenery, spaced like everything else', () => {
    const world = new World('overworld');

    for (let y = -20; y < 20; y += 7) {
      for (let x = -20; x < 20; x += 7) {
        const chunk = world.getChunk(x, y);
        const scenery = chunk.getDecorationCells();
        const kinds = new Set(getBiomeDecorations(chunk.biome));

        expect(scenery.size).toBeGreaterThanOrEqual(8);
        expect(scenery.size).toBeLessThanOrEqual(12);

        for (const [cell, decoration] of scenery) {
          // Of this biome, inside the placement area, and touching
          // nothing
          expect(kinds.has(decoration)).toBe(true);
          expect(cell % 16).toBeGreaterThanOrEqual(1);
          expect(cell % 16).toBeLessThanOrEqual(14);
          expect(Math.floor(cell / 16)).toBeGreaterThanOrEqual(1);
          expect(Math.floor(cell / 16)).toBeLessThanOrEqual(14);
          for (const neighbor of neighborCells(cell)) {
            expect(scenery.has(neighbor)).toBe(false);
          }
        }

        // Fixed forever, like the landmarks it was laid down before
        expect([...world.getChunk(x, y).getDecorationCells()]).toEqual([...scenery]);
      }
    }
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

        // Nine cells at most per landmark, out of the central 15x15's
        // two hundred and twenty-five: the ring never costs a chunk
        // one of its eight to twelve
        expect(landmarks.size).toBeGreaterThanOrEqual(8);
        expect(landmarks.size).toBeLessThanOrEqual(12);
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
    const [lowest, highest] = SPAWN_LEVELS[getSpawnRarity(spawn[0])];

    expect(maxed.level).toBe(lowest);
    expect(deriveEncounter(snapshot, [spawn[0], 0, 0xffffffff]).level).toBe(highest);

    // Every band, at both ends. A special is the exception: one of
    // each exists, and it may be met at any strength at all
    for (const rarity of [
      SpawnRarity.Base,
      SpawnRarity.Uncommon,
      SpawnRarity.Rare,
      SpawnRarity.Prized,
      SpawnRarity.Special,
    ]) {
      const [floor, ceiling] = SPAWN_LEVELS[rarity];

      expect(ceiling).toBeGreaterThan(floor);
      expect(floor).toBeGreaterThanOrEqual(1);
      expect(ceiling).toBeLessThanOrEqual(100);
      // The specials alone are the whole range: one of each exists,
      // and a legendary with a known strength is a solved one
      expect(rarity === SpawnRarity.Special).toBe(floor === 1 && ceiling === 100);
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

  it('floors a family-day raid reward at six in every IV', () => {
    const world = new World('overworld');
    // The first day of the year features Bulbasaur's family
    const day = Date.UTC(2026, 0, 1);
    const snapshot = new ChunkSnapshot(world.getChunk(0, 0), day);
    // Every IV slice zero, so nothing but the floor can lift them
    const spawn = [Species.Bulbasaur, 0, 0] as const;

    const raid = deriveEncounter(snapshot, [...spawn], 'trainer-red', {
      type: EncounterType.LegendaryRaid,
    });

    expect(Object.values(unpackIVs(raid.ivs))).toEqual([6, 6, 6, 6, 6, 6]);

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

    // A wild meeting still rolls its level from the trait value
    expect(deriveEncounter(snapshot, [...spawn], 'trainer-red').level).not.toBe(50);
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
    expect(ENCOUNTER_TYPE_NAMES[dropped.type]).toBe('Team Rocket');
    // Both raids count as raids where they are alike, and neither is
    // what a grunt hands over
    expect(isRaidEncounter(EncounterType.LegendaryRaid)).toBe(true);
    expect(isRaidEncounter(EncounterType.ShadowRaid)).toBe(true);
  });

  it('rolls hidden abilities at their rarer odds', () => {
    const world = new World('overworld');
    const snapshot = new ChunkSnapshot(world.getChunk(0, 0), 0);

    // Lapras: regular Water Absorb/Shell Armor, hidden Hydration
    const species = Species.Lapras;
    const { abilities, hiddenAbility } = getSpeciesData(species);

    // Sweep the whole ability slice (byte 2 of the trait value)
    let hidden = 0;
    const SAMPLES = 256;
    for (let slice = 0; slice < SAMPLES; slice++) {
      const instance = deriveEncounter(snapshot, [species, 0, slice << 16]);

      if (instance.ability === hiddenAbility) {
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
  it('grows 1-3 seeded patches on land and in the wetlands', () => {
    const world = new World('overworld');

    // The open seas have no spots at all: their variation is the
    // rocks and the shallows
    const sea = findChunk(world, (candidate) => isOpenSea(candidate.biome));

    if (sea != null) {
      expect(sea.getSpotCells().size).toBe(0);
    }

    for (const chunk of [
      findChunk(world, (candidate) => !isWaterBiome(candidate.biome)),
      findChunk(world, (candidate) => isWaterBiome(candidate.biome) && !isOpenSea(candidate.biome)),
    ]) {
      expect(chunk).not.toBeNull();
      if (chunk == null) {
        continue;
      }

      const spots = chunk.getSpotCells();

      // One grown patch at least, three at most, all confined inside
      // the placement area's own ring
      expect(spots.size).toBeGreaterThanOrEqual(5);
      expect(spots.size).toBeLessThanOrEqual(27);
      for (const cell of spots) {
        expect(cell % 16).toBeGreaterThanOrEqual(2);
        expect(cell % 16).toBeLessThanOrEqual(13);
        expect(Math.floor(cell / 16)).toBeGreaterThanOrEqual(2);
        expect(Math.floor(cell / 16)).toBeLessThanOrEqual(13);
      }

      // Grown, not scattered: every cell continues its patch
      for (const cell of spots) {
        const joined = [cell - 1, cell + 1, cell - 16, cell + 16].some((next) => spots.has(next));

        expect(joined).toBe(true);
      }

      // Fixed forever: a fresh resolution of the chunk agrees
      expect([...world.getChunk(chunk.x, chunk.y).getSpotCells()]).toEqual([...spots]);
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
      // Only a phenomenon may stand in a pool
      for (const [cell, landmark] of chunk.getLandmarkCells()) {
        if (landmark !== Landmark.Phenomenon) {
          expect(water.has(cell)).toBe(false);
        }
      }
    }
    expect(seen).toBeGreaterThan(0);
  });

  it('always shows rippling water on a phenomenon standing in a pool', () => {
    const world = new World('overworld');
    const chunk = findChunk(world, (candidate) => {
      if (isWaterBiome(candidate.biome)) {
        return false;
      }

      const water = candidate.getSpotCells();

      return [...candidate.getLandmarkCells()].some(
        ([cell, kind]) => kind === Landmark.Phenomenon && water.has(cell),
      );
    });

    expect(chunk).not.toBeNull();
    if (chunk == null) {
      return;
    }

    const water = chunk.getSpotCells();
    const wet = [...chunk.getLandmarkCells()]
      .filter(([cell, kind]) => kind === Landmark.Phenomenon && water.has(cell))
      .map(([cell]) => cell);

    // Whatever the hour, the water is what is going on there
    for (let window = 0; window < 6; window++) {
      const showing = new ChunkSnapshot(chunk, window * PHENOMENON_INTERVAL).getPhenomena();

      for (const cell of wet) {
        expect(showing.get(cell)).toBe(Phenomenon.RipplingWater);
      }
    }
  });

  it('always ripples at sea off the banks, whatever the biome hosts', () => {
    const world = new World('overworld');
    const chunk = findChunk(world, (candidate) => {
      if (!isWaterBiome(candidate.biome)) {
        return false;
      }

      const banks = candidate.getSpotCells();

      return [...candidate.getLandmarkCells()].some(
        ([cell, kind]) => kind === Landmark.Phenomenon && !banks.has(cell),
      );
    });

    expect(chunk).not.toBeNull();
    if (chunk == null) {
      return;
    }

    const banks = chunk.getSpotCells();
    const afloat = [...chunk.getLandmarkCells()]
      .filter(([cell, kind]) => kind === Landmark.Phenomenon && !banks.has(cell))
      .map(([cell]) => cell);

    for (let window = 0; window < 6; window++) {
      const showing = new ChunkSnapshot(chunk, window * PHENOMENON_INTERVAL).getPhenomena();

      for (const cell of afloat) {
        expect(showing.get(cell)).toBe(Phenomenon.RipplingWater);
      }
    }
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
        }
      }
    }
    expect(seen).toBeGreaterThan(0);
  });

  it('keeps everything out of the rocks, and mixes shallows in around them', () => {
    const world = new World('overworld');
    const chunk = findChunk(world, (candidate) => isOpenSea(candidate.biome));

    expect(chunk).not.toBeNull();
    if (chunk == null) {
      return;
    }

    const rocks = chunk.getRockCells();
    const shallows = chunk.getShallowCells();

    // At least one grown outcrop, confined inside the placement
    // area's own ring, and nothing stands in one
    expect(rocks.size).toBeGreaterThanOrEqual(5);
    expect(rocks.size).toBeLessThanOrEqual(27);
    for (const cell of rocks) {
      expect(cell % 16).toBeGreaterThanOrEqual(2);
      expect(cell % 16).toBeLessThanOrEqual(13);
      expect(Math.floor(cell / 16)).toBeGreaterThanOrEqual(2);
      expect(Math.floor(cell / 16)).toBeLessThanOrEqual(13);
    }
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

    // Shallow patches exist, keep clear of the rock, and hold still
    expect(shallows.size).toBeGreaterThan(0);
    for (const cell of shallows) {
      expect(rocks.has(cell)).toBe(false);
    }
    expect([...world.getChunk(chunk.x, chunk.y).getShallowCells()]).toEqual([...shallows]);

    // A land chunk has no shallows, and 0-2 outcrops of its own
    const land = findChunk(world, (candidate) => !isWaterBiome(candidate.biome));

    if (land != null) {
      expect(land.getShallowCells().size).toBe(0);
      expect(land.getRockCells().size).toBeLessThanOrEqual(18);
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
    // Fixtures keep their ring from the outcrop
    for (const cell of [...chunk.getLandmarkCells().keys(), ...chunk.getDecorationCells().keys()]) {
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

  it('stands a wetland phenomenon on a bank, where a grotto can be', () => {
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

        for (const [cell, kind] of chunk.getLandmarkCells()) {
          if (kind === Landmark.Phenomenon) {
            phenomena += 1;
            banked += banks.has(cell) ? 1 : 0;
          }
        }
      }
    }
    // The preference holds unless a chunk had no bank cell free,
    // which the sample should not be dominated by
    expect(phenomena).toBeGreaterThan(0);
    expect(banked).toBeGreaterThan(phenomena / 2);
  });
});

describe('portal balancing', () => {
  it('never rolls a second portal into a chunk', () => {
    const world = new World('overworld');

    for (let y = 0; y < 8; y++) {
      for (let x = 0; x < 25; x++) {
        const landmarks = world.getChunk(x, y).getLandmarks();

        expect(landmarks.filter((kind) => kind === Landmark.Portal).length).toBeLessThanOrEqual(1);
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
