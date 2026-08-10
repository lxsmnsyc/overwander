import { describe, expect, it } from 'vitest';
import AleaRNG from '../../src/core/alea';
import PerlinNoise from '../../src/core/perlin';
import registerBiomeSpawns, { SpawnRarity, getSpawnRarity } from '../../src/data/biome';
import Biome, { TimeOfDay, getTimeOfDay } from '../../src/data/ids/biome';
import { Items } from '../../src/data/ids/items';
import { Genders, Species } from '../../src/data/ids/species';
import { getSpeciesAbilityPools, getSpeciesData, registerSpecies } from '../../src/data/species';
import ChunkSnapshot from '../../src/overworld/chunk-snapshot';
import deriveEncounter, { EncounterType, isShinyFor } from '../../src/overworld/encounter';
import Landmark from '../../src/data/overworld/landmark';
import { resolveHiddenGrotto } from '../../src/overworld/landmarks';
import World from '../../src/overworld/world';

// Spawn rolls read the species registry and the biome spawn pools
registerSpecies();
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

  it('rolls 3-5 fixed landmarks per chunk, each on its own cell', () => {
    const world = new World('overworld');
    const shapes = new Set<string>();

    for (let x = 0; x < 10; x++) {
      const chunk = world.getChunk(x, 0);
      const landmarks = chunk.getLandmarks();

      expect(landmarks.length).toBeGreaterThanOrEqual(3);
      expect(landmarks.length).toBeLessThanOrEqual(5);

      // One cell each: the cell map holds every landmark, all
      // within the central 8x8
      expect(chunk.getLandmarkCells().size).toBe(landmarks.length);
      for (const cell of chunk.getLandmarkCells().keys()) {
        expect(cell % 16).toBeGreaterThanOrEqual(4);
        expect(cell % 16).toBeLessThanOrEqual(11);
        expect(Math.floor(cell / 16)).toBeGreaterThanOrEqual(4);
        expect(Math.floor(cell / 16)).toBeLessThanOrEqual(11);
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

    const WINDOW = 5 * 60 * 1000;
    const caches = new ChunkSnapshot(chunk, 0).getItemCaches();

    // Every reward sits on an ItemCache landmark cell
    expect(caches.size).toBeGreaterThan(0);
    for (const cell of caches.keys()) {
      expect(chunk.getLandmarkCells().get(cell)).toBe(Landmark.ItemCache);
    }

    // The same window agrees for every observer
    expect(new ChunkSnapshot(chunk, 60 * 1000).getItemCaches()).toEqual(caches);

    // Expired windows regenerate: rewards vary across windows
    const shapes = new Set<string>();
    for (let window = 0; window <= 10; window++) {
      shapes.add(JSON.stringify([...new ChunkSnapshot(chunk, window * WINDOW).getItemCaches()]));
    }
    expect(shapes.size).toBeGreaterThan(1);
  });

  it('rolls window-scoped hidden grotto rewards', () => {
    const world = new World('overworld');
    let chunk = world.getChunk(0, 0);

    // Find a chunk hosting at least one hidden grotto landmark
    for (let x = 0; x < 20; x++) {
      const candidate = world.getChunk(x, 0);

      if (new Set(candidate.getLandmarkCells().values()).has(Landmark.HiddenGrotto)) {
        chunk = candidate;
        break;
      }
    }

    const WINDOW = 5 * 60 * 1000;
    const grottos = new ChunkSnapshot(chunk, 0).getHiddenGrottos();

    // Every reward sits on a HiddenGrotto landmark cell
    expect(grottos.size).toBeGreaterThan(0);
    for (const cell of grottos.keys()) {
      expect(chunk.getLandmarkCells().get(cell)).toBe(Landmark.HiddenGrotto);
    }

    // The same window agrees for every observer
    expect(new ChunkSnapshot(chunk, 60 * 1000).getHiddenGrottos()).toEqual(grottos);

    // Expired windows regenerate: rewards vary across windows
    const shapes = new Set<string>();
    for (let window = 0; window <= 10; window++) {
      shapes.add(JSON.stringify([...new ChunkSnapshot(chunk, window * WINDOW).getHiddenGrottos()]));
    }
    expect(shapes.size).toBeGreaterThan(1);
  });

  it('resolves hidden grottos into rare finds', () => {
    const rolls = (values: number[]) => () => values.shift() ?? 0.999;

    // The cache branch rolls the grotto bands: 1/64 special, 1/8
    // rare, uncommon otherwise — the base tier never shows up
    expect(resolveHiddenGrotto(Biome.Grassland, TimeOfDay.Morning, rolls([0.2, 0, 0]))).toEqual({
      kind: 'item',
      item: Items.MasterBall,
    });
    expect(resolveHiddenGrotto(Biome.Grassland, TimeOfDay.Morning, rolls([0.2, 0.05, 0]))).toEqual({
      kind: 'item',
      item: Items.FireStone,
    });
    expect(resolveHiddenGrotto(Biome.Grassland, TimeOfDay.Morning, rolls([0.2, 0.99, 0]))).toEqual({
      kind: 'item',
      item: Items.UltraBall,
    });

    // The pokemon branch is 1/8 rare, the rest uncommon, and never
    // reaches the legendary tier
    const rare = resolveHiddenGrotto(Biome.Grassland, TimeOfDay.Morning, rolls([0.9, 0, 0]));
    const uncommon = resolveHiddenGrotto(Biome.Grassland, TimeOfDay.Morning, rolls([0.9, 0.5, 0]));

    expect(rare?.kind).toBe('pokemon');
    if (rare?.kind === 'pokemon') {
      expect(getSpawnRarity(rare.species)).toBe(SpawnRarity.Rare);
    }
    expect(uncommon?.kind).toBe('pokemon');
    if (uncommon?.kind === 'pokemon') {
      expect(getSpawnRarity(uncommon.species)).toBe(SpawnRarity.Uncommon);
    }
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
        expect(Number.isInteger(value)).toBe(true);
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThan(2 ** 32);
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

    // Scanning the grid recovers every spawn exactly once; no spawn
    // sits on a landmark's cell or outside the central 12x12
    const placed: unknown[] = [];
    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 16; x++) {
        const occupant = snapshot.getSpawnAt(x, y);

        if (occupant != null) {
          placed.push(occupant);
          expect(chunk.getLandmarkAt(x, y)).toBeNull();
          expect(x).toBeGreaterThanOrEqual(2);
          expect(x).toBeLessThanOrEqual(13);
          expect(y).toBeGreaterThanOrEqual(2);
          expect(y).toBeLessThanOrEqual(13);
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

    // A snapshot can never hold more spawns than free cells of the
    // central 12x12
    const packed = new ChunkSnapshot(chunk, NOON);
    expect(packed.getSpawns(1000)).toHaveLength(144 - chunk.getLandmarkCells().size);
  });

  it('derives concrete encounters from spawn tuples', () => {
    const world = new World('overworld');
    const chunk = world.getChunk(3, -7);
    const NOON = 12 * 60 * 60 * 1000;
    const snapshot = new ChunkSnapshot(chunk, NOON);

    const spawn = snapshot.getSpawns(1)[0];
    const instance = deriveEncounter(snapshot, spawn);

    expect(instance.type).toBe(EncounterType.Wild);
    expect(instance.species).toBe(spawn[0]);
    expect(instance.individualValue).toBe(spawn[1]);
    expect(instance.traitValue).toBe(spawn[2]);
    expect(Number.isInteger(instance.level)).toBe(true);
    expect(instance.level).toBeGreaterThanOrEqual(5);
    expect(instance.level).toBeLessThanOrEqual(100);
    for (const iv of Object.values(instance.ivs)) {
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
    expect(instance.x).toBe(3);
    expect(instance.y).toBe(-7);
    expect(instance.biome).toBe(chunk.biome);

    // Same tuple, same instance
    expect(deriveEncounter(snapshot, spawn)).toEqual(instance);

    // An all-ones individual value maxes every IV slice
    const maxed = deriveEncounter(snapshot, [spawn[0], 0xffffffff, 0]);
    expect(Object.values(maxed.ivs)).toEqual([31, 31, 31, 31, 31, 31]);

    // A zero trait value bottoms out the level; all-ones caps it
    expect(maxed.level).toBe(5);
    expect(deriveEncounter(snapshot, [spawn[0], 0, 0xffffffff]).level).toBe(100);

    // Sex-locked species never roll the other gender, whatever the
    // gender slice (byte 1) holds
    for (const traits of [0 << 8, 128 << 8, 255 << 8]) {
      expect(deriveEncounter(snapshot, [Species.Chansey, 0, traits]).gender).toBe(Genders.Female);
      expect(deriveEncounter(snapshot, [Species.Tauros, 0, traits]).gender).toBe(Genders.Male);
      expect(deriveEncounter(snapshot, [Species.Ditto, 0, traits]).gender).toBe(Genders.Genderless);
    }
  });

  it('sparkles per trainer via the halved XOR resonance', () => {
    // Reproduce the trainer hash and craft a resonant individual
    // value: high half = trainer halves' XOR, low half = 0
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

    expect(deriveEncounter(snapshot, [species, shinyValue, 0], 'trainer-red').shiny).toBe(true);
    expect(deriveEncounter(snapshot, [species, shinyValue, 0]).shiny).toBe(false);
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
