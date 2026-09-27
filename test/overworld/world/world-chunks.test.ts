import { registerMoves } from '../../../src/data/moves';
import { describe, expect, it } from 'vitest';
import { MAX_OFFSET, MIN_OFFSET, asOffset } from '../../../src/auth/local-time';
import Abilities from '../../../src/data/ids/abilities';
import registerAbilities from '../../../src/data/abilities';
import registerBiomeSpawns, {
  BIOME_NAMES,
  SpawnRarity,
  getBiomeRoster,
  getSpawnPool,
  getSpawnRarity,
  spawnRanks,
} from '../../../src/data/biome';
import Biome, {
  BIOME_CONFIGS,
  TimeOfDay,
  getTimeOfDay,
  isWaterBiome,
} from '../../../src/data/ids/biome';
import Lairs, {
  getBiomeLairs,
  getLairResidents,
  getLairTitle,
  getSpeciesLairs,
} from '../../../src/data/overworld/lair';
import { Items } from '../../../src/data/ids/items';
import registerItems from '../../../src/data/items';
import { Genders, Species } from '../../../src/data/ids/species';
import { getRegisteredSpecies, getSpeciesData, registerSpecies } from '../../../src/data/species';
import { MAX_LEVEL } from '../../../src/data/constants/levels';
import { RaidKind, getRaidTitle } from '../../../src/auth/raids';
import {
  BANNED_BOSS_MOVES,
  BOSS_HEALTH_SCALE,
  getBannedBossMoves,
} from '../../../src/battle/abilities/special';
import { EffectType } from '../../../src/battle/events';
import { getMaxHealth } from '../../../src/auth/health';
import { MAX_EFFORT_PER_STAT, PERFECT_IVS, Stats } from '../../../src/data/constants/stats';
import { Statuses, packStatuses } from '../../../src/data/ids/status';
import ChunkSnapshot, {
  LANDMARK_INTERVAL,
  MAX_PHENOMENA,
  PHENOMENON_INTERVAL,
  RAID_INTERVAL,
  SNAPSHOT_INTERVAL,
  SPAWN_COUNT,
} from '../../../src/overworld/chunk-snapshot';
import {
  BANNED_BOSS_SPECIES,
  BOSS_ALLIANCE,
  PLAYER_ALLIANCE,
  RAID_BOSS_LEVEL,
  canStageBoss,
  createRaidBossSnapshot,
  getBossMoves,
} from '../../../src/overworld/raid';
import { collectAftermath, createRaidBattle } from '../../../src/overworld/raid-battle';
import { Moves } from '../../../src/data/ids/moves';
import deriveEncounter, {
  EncounterType,
  MOVE_LIMIT,
  deriveAbility,
  deriveMoves,
  deriveNature,
  deriveSize,
} from '../../../src/overworld/encounter';
import Landmark from '../../../src/data/overworld/landmark';
import Phenomenon, { BIOME_PHENOMENA } from '../../../src/data/overworld/phenomenon';
import World from '../../../src/overworld/world';
import findChunk from './helpers';

// Spawn rolls read the species registry and the biome spawn pools;
// the berry patch reads the item registry to name what it grew, and
// the machines that registry generates read the move data
registerMoves();
registerSpecies();
registerItems();
registerAbilities();
registerBiomeSpawns();

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

    // ...and every zone reads its own ground, the way it reads its own
    // spawns: one stash and one claim marker per real zone
    const NOW = 1_700_000_000_000;
    const zones = new Set<number>();
    const markers = new Set<string>();

    for (let offset = MIN_OFFSET; offset <= MAX_OFFSET; offset++) {
      const zoned = new ChunkSnapshot(chunk, NOW + asOffset(offset) * 60 * 1000, offset);

      zones.add(asOffset(offset));
      markers.add(`${zoned.groundKey}@${zoned.landmarkTimestamp}`);
    }
    expect(markers.size).toBe(zones.size);
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
    expect(getSpeciesLairs(Species.Mew)).toEqual([Lairs.FarawayIsland]);
    for (const key of Object.keys(BIOME_NAMES)) {
      expect(getBiomeLairs(Number(key))).not.toContain(Lairs.FarawayIsland);
    }

    const chunk = findChunk(world, (candidate) => candidate.biome === Biome.TropicalRainforest);

    expect(chunk).not.toBeNull();
    expect(chunk == null ? -1 : new ChunkSnapshot(chunk, 0).getLegendaryLairs().size).toBe(0);
  });

  it('lets a legendary be at home in more than one lair', () => {
    // The golems keep their Hoenn chambers and turn up again in
    // Sinnoh's ruins, and the world stages either
    expect(getSpeciesLairs(Species.Regirock)).toEqual([Lairs.DesertRuins, Lairs.RockPeakRuins]);
    expect(getSpeciesLairs(Species.Regice)).toEqual([Lairs.IslandCave, Lairs.IcebergRuins]);
    expect(getSpeciesLairs(Species.Registeel)).toEqual([Lairs.AncientTomb, Lairs.IronRuins]);
    // The tower duo each keep their Johto home and share the rock
    expect(getSpeciesLairs(Species.Lugia)).toEqual([Lairs.WhirlIslands, Lairs.NavelRock]);
    expect(getSpeciesLairs(Species.HoOh)).toEqual([Lairs.BellTower, Lairs.NavelRock]);
    expect(getBiomeLairs(Biome.DeepOcean)).toContain(Lairs.NavelRock);
    // And the weather trio share the tower in the sea cliffs
    expect(getSpeciesLairs(Species.Kyogre)).toEqual([Lairs.MarineCave, Lairs.EmbeddedTower]);
    expect(getSpeciesLairs(Species.Groudon)).toEqual([Lairs.TerraCave, Lairs.EmbeddedTower]);
    expect(getSpeciesLairs(Species.Rayquaza)).toEqual([Lairs.SkyPillar, Lairs.EmbeddedTower]);
    expect(getBiomeLairs(Biome.Beach)).toEqual([Lairs.EmbeddedTower]);
    expect(getBiomeLairs(Biome.Badlands)).toContain(Lairs.RockPeakRuins);
    expect(getBiomeLairs(Biome.Tundra)).toContain(Lairs.IcebergRuins);
    expect(getBiomeLairs(Biome.Ocean)).toContain(Lairs.IronRuins);
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

    // A mountain holds six: the volcano, the cave under it, the tower
    // on it, the tomb cut into it and the two chambers the swords keep.
    // Every window stages one of them, and whoever is at home in it
    const hosted = new Set(getBiomeLairs(Biome.Mountain));

    expect(hosted).toEqual(
      new Set([
        Lairs.MtEmber,
        Lairs.CeruleanCave,
        Lairs.BellTower,
        Lairs.AncientTomb,
        Lairs.GuidanceChamber,
        Lairs.TrialChamber,
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
      Moves.GuardSplit,
      Moves.PowerSplit,
      // The whole pool thrown at every enemy at once
      Moves.FinalGambit,
      // Every enemy's wind-up sent back to the start at once
      Moves.Quash,
      Moves.AfterYou,
      Moves.AllySwitch,
      Moves.Bestow,
      // A teammate a lone boss does not have, or nothing it can use
      Moves.HoldHands,
      Moves.AromaticMist,
      Moves.Celebrate,
      Moves.HappyHour,
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
    const pool = getBiomeRoster(chunk.biome, time);
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
});
