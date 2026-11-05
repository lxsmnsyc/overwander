import fc from 'fast-check';
import type Abilities from '../../../src/data/ids/abilities';
import { ABILITY_IDS, ITEM_IDS, NATURE_IDS, SPECIES_IDS } from '../../../src/data/ids/names';
import type { Items } from '../../../src/data/ids/items';
import type Natures from '../../../src/data/ids/natures';
import { Genders, type Species } from '../../../src/data/ids/species';
import { BUDDY_ABILITIES } from '../../../src/overworld/abilities/__create';
import type { Buddy } from '../../../src/overworld/core';
import '../../../src/overworld/setup';
import getWorld from '../../../src/overworld/current';
import { DEPTHS, type Depth } from '../../../src/overworld/depth';
import { CELL_COUNT } from '../../../src/overworld/grid';
import World, { WORLD_MAX, WORLD_MIN } from '../../../src/overworld/world';
import { MAX_OFFSET, MIN_OFFSET } from '../../../src/model/local-time';

/** A place in the world: a chunk at a depth, and one cell of it */
export interface CellInput {
  depth: Depth;
  chunkX: number;
  chunkY: number;
  /** Row-major inside the chunk */
  cell: number;
}

/** A moment: the server's instant and the zone it is read in */
export interface ClockInput {
  now: number;
  /** Minutes east of UTC */
  zone: number;
}

/** Any world seed, the live one included */
export const seedArbitrary = fc.oneof(
  fc.constant(getWorld().seed),
  fc.string({ minLength: 1, maxLength: 12 }),
);

/**
 * A chunk inside the world. Most draws stay near the origin, where
 * players walk; the rest reach the edge, where the clamps are
 */
const coordinateArbitrary = fc.oneof(
  { weight: 3, arbitrary: fc.integer({ min: -256, max: 256 }) },
  { weight: 1, arbitrary: fc.integer({ min: WORLD_MIN, max: WORLD_MAX }) },
);

export const cellArbitrary: fc.Arbitrary<CellInput> = fc.record({
  depth: fc.constantFrom(...DEPTHS),
  chunkX: coordinateArbitrary,
  chunkY: coordinateArbitrary,
  cell: fc.integer({ min: 0, max: CELL_COUNT - 1 }),
});

/** 2020 to 2040, a zone a quarter hour at a time */
export const clockArbitrary: fc.Arbitrary<ClockInput> = fc.record({
  now: fc.integer({ min: Date.UTC(2020, 0, 1), max: Date.UTC(2040, 0, 1) }),
  zone: fc.integer({ min: MIN_OFFSET / 15, max: MAX_OFFSET / 15 }).map((quarters) => quarters * 15),
});

function readIds<T>(table: Readonly<Record<string, T>>): T[] {
  return Object.values(table);
}

const SPECIES = readIds<Species>(SPECIES_IDS);
const ABILITIES = readIds<Abilities>(ABILITY_IDS);
const ITEMS = readIds<Items>(ITEM_IDS);
const NATURES = readIds<Natures>(NATURE_IDS);

/**
 * The abilities a buddy does anything with in the field, which an
 * ability drawn from all of them would almost never be
 */
const FIELD_ABILITIES = [...BUDDY_ABILITIES];

const abilityArbitrary = fc.oneof(
  fc.constantFrom(...FIELD_ABILITIES),
  fc.constantFrom(...ABILITIES),
);

/** A buddy carrying anything at all, or none walking beside the player */
export const buddyArbitrary: fc.Arbitrary<Buddy | null> = fc.option(
  fc.record({
    species: fc.constantFrom(...SPECIES),
    shiny: fc.boolean(),
    abilities: fc.uniqueArray(abilityArbitrary, { minLength: 1, maxLength: 4 }),
    items: fc.uniqueArray(fc.constantFrom(...ITEMS), { maxLength: 4 }),
    nature: fc.constantFrom(...NATURES),
    gender: fc.constantFrom(Genders.Male, Genders.Female, Genders.Genderless),
  }),
  { freq: 4 },
);

/** A player id, which seeds every per-player roll */
export const playerArbitrary = fc.uuid();

const worlds = new Map<string, World>();

/** The world of a seed at a depth, built once a seed. The live seed is the live world */
export function readWorld(seed: string, depth: Depth): World {
  const live = getWorld();

  if (seed === live.seed) {
    return live.at(depth);
  }

  let world = worlds.get(seed);

  if (world == null) {
    world = new World(seed, live.depth, live.generation);
    worlds.set(seed, world);
  }
  return world.at(depth);
}
