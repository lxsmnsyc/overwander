import Biome, { BIOME_CONFIGS, isOpenSea, isWaterBiome } from '../data/ids/biome';
import type World from './world';

/**
 * The fields the world's ground is read out of, before anything is
 * made of them.
 *
 * Kept apart from what a cell ends up being because two things ask
 * about them and neither may wait on the other: the ground, which
 * turns them into what a player walks on, and the towns, which are
 * sited by looking for somewhere the fields leave dry and flat.
 */

/**
 * How wide the standing water is, and how much of the land it takes.
 *
 * A lake wants to be worth walking round rather than stepped over, so
 * the field is read at about a lake every twenty cells and cut high
 * enough that most of the country is still country
 */
const LAKE_FREQUENCY = 1 / 16;
const LAKE_LEVEL = 0.34;

/**
 * The same field read the other way for the wetlands: a swamp is
 * water with banks in it rather than land with pools, so what stands
 * out of it is where the field runs dry
 */
const BANK_LEVEL = 0.3;

/**
 * The rivers: a long, slow field taken where it crosses zero, which
 * is a line rather than an area. It is what the fields cannot draw,
 * since a threshold on a smooth field only ever gives blobs
 */
const RIVER_FREQUENCY = 1 / 150;
const RIVER_WIDTH = 0.012;

/**
 * Where the rock comes through. Tighter than the water, since an
 * outcrop is a feature of a hillside rather than of a country, and
 * cut against the biome's own height: the same field is a crag in the
 * mountains and a boulder or two on the plain
 */
export const STONE_FREQUENCY = 1 / 8;
const ROCK_LEVEL = 0.42;
const ROCK_LIFT = 0.18;

/** How high the biome stands, for the rock that comes through it */
function heightOf(biome: Biome): number {
  // Beyond is the portal world, which has no climate and no ground of
  // its own to bring rock through
  return biome === Biome.Beyond ? 0 : BIOME_CONFIGS[biome].elevation;
}

/** How high the stone has to stand here to break the surface */
export function rockLevel(biome: Biome): number {
  // Against the country's own height: a mountain is mostly rock and a
  // meadow has a boulder in it
  return ROCK_LEVEL - ROCK_LIFT * Math.max(0, heightOf(biome));
}

/** Whether the rock breaks the surface here, before the gaps are filled */
export function isRock(world: World, x: number, y: number, biome: Biome): boolean {
  return world.stone.noise(x * STONE_FREQUENCY, y * STONE_FREQUENCY) > rockLevel(biome);
}

/** Whether a river runs through this cell */
function isRiver(world: World, x: number, y: number): boolean {
  return Math.abs(world.lakes.noise(x * RIVER_FREQUENCY, y * RIVER_FREQUENCY + 0.5)) < RIVER_WIDTH;
}

/**
 * Whether a player swims here rather than walks.
 *
 * The biome answers first, since a sea is water wherever you stand in
 * it. On land it is the lakes and the rivers; in a wetland it is
 * everything the banks have not taken
 */
export function isWaterAt(world: World, x: number, y: number, biome: Biome): boolean {
  const pooled = world.lakes.noise(x * LAKE_FREQUENCY, y * LAKE_FREQUENCY);

  if (isOpenSea(biome)) {
    return true;
  }
  if (isWaterBiome(biome)) {
    // A bank is where the field runs dry, which is the pool's own
    // rule read backwards
    return pooled > -BANK_LEVEL;
  }
  return pooled > LAKE_LEVEL || isRiver(world, x, y);
}
