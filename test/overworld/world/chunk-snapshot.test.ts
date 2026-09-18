import { registerMoves } from '../../../src/data/moves';
import { describe, expect, it } from 'vitest';
import AleaRNG from '../../../src/core/alea';
import Abilities from '../../../src/data/ids/abilities';
import registerAbilities from '../../../src/data/abilities';
import registerBiomeSpawns, {
  SpawnRarity,
  fitsSurface,
  getSpawnRarity,
  pickSpawn,
} from '../../../src/data/biome';
import Biome, { SpawnSurface, getTimeOfDay, isOpenSea } from '../../../src/data/ids/biome';
import Lairs from '../../../src/data/overworld/lair';
import { Items } from '../../../src/data/ids/items';
import registerItems from '../../../src/data/items';
import { Genders, Species } from '../../../src/data/ids/species';
import {
  SPECIES_DAY_HIDDEN_ABILITY_BOOST,
  getRegisteredSpecies,
  getSpeciesAbilityPools,
  getSpeciesData,
  registerSpecies,
} from '../../../src/data/species';
import { WILD_HELD_COMMON, WILD_HELD_UNCOMMON } from '../../../src/data/species/held-items';
import { RaidKind, deriveRaidReward } from '../../../src/auth/raids';
import { isShadow, isShiny } from '../../../src/auth/caught-record';
import { PERFECT_IVS, unpackIVs } from '../../../src/data/constants/stats';
import {
  CELL_COUNT,
  CHUNK_CELLS,
  PLACEMENT_AREA,
  centeredCells,
  neighborCells,
} from '../../../src/overworld/chunk';
import { getBiomeDecorations, getIslandDecorations } from '../../../src/data/overworld/decoration';
import ChunkSnapshot, {
  LANDMARK_INTERVAL,
  SPAWN_COUNT,
  type Spawn,
} from '../../../src/overworld/chunk-snapshot';
import {
  LEGENDARY_RAID_REWARD_LEVEL,
  MYTHICAL_RAID_REWARD_LEVEL,
  SHADOW_RAID_REWARD_LEVEL,
} from '../../../src/overworld/raid';
import { ROCKET_REWARD_LEVEL } from '../../../src/overworld/stop';
import deriveEncounter, {
  ENCOUNTER_TYPE_NAMES,
  EncounterType,
  MAX_SIZE_SCALE,
  MIN_SIZE_SCALE,
  RAID_FAMILY_DAY_MIN_IV,
  deriveAbility,
  deriveMoves,
  deriveSize,
  deriveSizeScale,
  getSpawnLevels,
  isRaidEncounter,
  isShinyFor,
} from '../../../src/overworld/encounter';
import Landmark from '../../../src/data/overworld/landmark';
import { SHINY_CHARM_BOOST } from '../../../src/overworld/items/key-items';
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
    // left is what nothing else is standing on. A cell whose surface
    // has no pool here, such as a pond with no water pool, stays empty
    const room = centeredCells(PLACEMENT_AREA).filter(
      (cell) =>
        !chunk.getLandmarkCells().has(cell) &&
        !chunk.getDecorationCells().has(cell) &&
        !chunk.getRockCells().has(cell) &&
        !chunk.getFaceCells().has(cell) &&
        !packed.getPhenomena().has(cell),
    );
    const stocked = room.filter((cell) => pickSpawn(packed.getCellPool(cell), () => 0) != null);

    packed.getSpawns(1000);

    const filled = [...packed.getSpawnCells().keys()];

    expect(filled.length).toBeGreaterThanOrEqual(stocked.length);
    expect(filled.length).toBeLessThanOrEqual(room.length);
    for (const cell of stocked) {
      expect(filled).toContain(cell);
    }
  });

  it('stands every spawn on a surface its species lives on', () => {
    const world = new World('overworld');
    const NOON = 12 * 60 * 60 * 1000;
    let swimming = 0;

    // Neither a Rhyhorn in the middle of a pond nor a Magikarp on the sand
    for (let x = -12; x < 12; x++) {
      for (let y = -12; y < 12; y++) {
        const chunk = world.getChunk(x, y);
        const snapshot = new ChunkSnapshot(chunk, NOON);

        snapshot.getSpawns(SPAWN_COUNT);
        for (const [cell, spawn] of snapshot.getSpawnCells()) {
          const surface = chunk.getCellSurface(cell);

          expect(fitsSurface(spawn[0], surface), getSpeciesData(spawn[0]).name).toBe(true);
          if (surface === SpawnSurface.Water) {
            swimming++;
          }
        }
      }
    }
    // A pond with nothing in it would mean the water pools were never reached
    expect(swimming).toBeGreaterThan(0);
  });

  it("keeps a sea's islands to what lives on land", () => {
    const world = new World('overworld');
    const NOON = 12 * 60 * 60 * 1000;
    let ashore = 0;

    for (let y = -80; y <= 80 && ashore === 0; y += 2) {
      for (let x = -80; x <= 80 && ashore === 0; x += 2) {
        const chunk = world.getChunk(x, y);

        if (!isOpenSea(chunk.biome)) {
          continue;
        }

        const snapshot = new ChunkSnapshot(chunk, NOON);

        snapshot.getSpawns(SPAWN_COUNT);
        for (const [cell, spawn] of snapshot.getSpawnCells()) {
          if (chunk.getCellSurface(cell) === SpawnSurface.Land) {
            ashore++;
            expect(fitsSurface(spawn[0], SpawnSurface.Land), getSpeciesData(spawn[0]).name).toBe(
              true,
            );
          }
        }
      }
    }
    expect(ashore).toBeGreaterThan(0);
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
        const sea = isOpenSea(chunk.biome);

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
          // Of this biome, and touching nothing of its own chunk's. Out
          // at sea it stands in the water, and an island grows its own
          const island = sea && chunk.getCellRole(cell) === 'ground';

          expect(
            (island ? getIslandDecorations : getBiomeDecorations)(chunk.biome).includes(decoration),
          ).toBe(true);
          if (!sea) {
            expect(chunk.getCellRole(cell)).toBe('ground');
          }
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
