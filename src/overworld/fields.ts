import Biome, { BIOME_CONFIGS, isOpenSea, isWaterBiome } from '../data/ids/biome';
import { ORTHOGONAL, SQUARES } from './grid';
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

/**
 * Where the stone breaks the surface. Nothing is walled off by it: it
 * says where a hillside is, which is where a cave has its way in,
 * which water may not stand on and where the shelf is drawn
 */
const ROCK_LEVEL = 0.5;
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

/**
 * How long a vein runs and how wide it is.
 *
 * The rock field read at a coarser step and a different corner of
 * itself, so a cave needs no channel of its own. Read as a ridge, the
 * way a river is: what is **near** the field's zero is the passage, so
 * a vein is a thin winding line rather than a blob.
 *
 * These two numbers are what stops a cave being a second overworld,
 * and they are tuned against what a player can actually **walk**,
 * counting only orthogonal steps. Measured over the most mountainous
 * country the world grows, in a 300 cell square:
 *
 *     chambers alone   16.5% open   biggest    195   reach  34
 *     0.008            21.3% open   biggest  1,562   reach 115
 *     0.02             23.8% open   biggest  2,771   reach 220
 *     0.03             25.8% open   biggest 16,518   reach 299
 *
 * The chambers alone run nowhere. Anything from 0.02 up joins the
 * whole country into one cave, which is a second overworld with the
 * lights off. This width is a network worth walking, about seven
 * chunks end to end, that still stops and has to be left
 */
const VEIN_FREQUENCY = 1 / 24;
const VEIN_WIDTH = 0.008;

/** Where the vein is read, so it is not the rock over again */
const VEIN_OFFSET = 11.5;

/** The rock and the veins cut through it, before the shore is walled off */
function isCarved(world: World, x: number, y: number, biome: Biome): boolean {
  if (isRock(world, x, y, biome)) {
    return true;
  }
  return (
    Math.abs(
      world.stone.noise(x * VEIN_FREQUENCY + VEIN_OFFSET, y * VEIN_FREQUENCY + VEIN_OFFSET),
    ) < VEIN_WIDTH
  );
}

/** Whether the shore runs through this cell, which is solid underground */
function isShoreWall(world: World, x: number, y: number, biome: Biome): boolean {
  const sea = isOpenSea(biome);

  for (const [dx, dy] of ORTHOGONAL) {
    if (isOpenSea(world.getCellBiome(x + dx, y + dy)) !== sea) {
      return true;
    }
  }
  return false;
}

/** The carved space, once the shore has been walled off */
function isHollow(world: World, x: number, y: number): boolean {
  const biome = world.getCellBiome(x, y);

  // Carved first: it is a noise sample, where the shore is four more
  // readings of the country. Three cells in four are solid, and this
  // is asked of every one of their neighbours
  return isCarved(world, x, y, biome) && !isShoreWall(world, x, y, biome);
}

/**
 * Whether a cave runs under this cell.
 *
 * Three things joined. The **chambers**, which are where the surface
 * has rock, so a cave is inside the crags and the ranges a player can
 * see and nowhere else; the **veins** that link them; and the
 * **elbows** that make the veins walkable.
 *
 * An elbow is the fix for a passage that steps diagonally. A vein is a
 * line through a noise field and it corners wherever it likes, but
 * nothing in this game moves diagonally: two cells touching only at
 * their corners are two dead ends. So where a diagonal pair has both
 * of its connecting cells solid, one of them is opened. The westerly
 * one always, which is why the two cells that could serve agree on
 * which of them does without either having to ask.
 *
 * Walled along every shore. A cave under the open sea is its own
 * network with its own way in, rather than a tunnel from the hills out
 * under the water, so the cell where the surface crosses between sea
 * and land is solid
 */
export function isCaveFloor(world: World, x: number, y: number, biome: Biome): boolean {
  if (isShoreWall(world, x, y, biome)) {
    return false;
  }
  if (isCarved(world, x, y, biome)) {
    return true;
  }

  // The corner a diagonal step needs squared off. Only the westerly of
  // the two candidates opens, so exactly one does: the other sees the
  // same pair with both offsets negated and stands down
  if (!isHollow(world, x + 1, y)) {
    return false;
  }
  for (const dy of [-1, 1]) {
    if (isHollow(world, x, y + dy) && !isHollow(world, x + 1, y + dy)) {
      return true;
    }
  }
  return false;
}

/** Whether a river runs through this cell */
function isRiver(world: World, x: number, y: number): boolean {
  return Math.abs(world.lakes.noise(x * RIVER_FREQUENCY, y * RIVER_FREQUENCY + 0.5)) < RIVER_WIDTH;
}

/**
 * The islands out in the open sea: the sea floor's own rock breaking
 * the surface.
 *
 * Read off the stone field at a corner of its own and cut high, so an
 * island is a few cells with a long way of water round it rather than
 * an archipelago. Measured over an 800 cell square of sea: about one
 * island every twelve hundred cells, nine cells across the middling
 * one, and the largest found was 57
 */
const ISLAND_FREQUENCY = 1 / 11;
const ISLAND_LEVEL = 0.62;
const ISLAND_OFFSET = 43.5;

/** Whether the field stands out of the water here, before it is opened */
function isIslandField(world: World, x: number, y: number): boolean {
  return (
    world.stone.noise(x * ISLAND_FREQUENCY + ISLAND_OFFSET, y * ISLAND_FREQUENCY + ISLAND_OFFSET) >
    ISLAND_LEVEL
  );
}

/**
 * Whether an island covers this cell.
 *
 * Two cells wide at the narrowest, the rule everything drawn with a
 * rim is held to: the shore is a ring of edges and corners, and one
 * cell of sand asks for all four corners of it at once. So the land is
 * laid in 2x2 blocks of open sea, the way the water is: a block that
 * reaches into another country would leave a cell of it alone, since
 * the island field says nothing about what the coast next door does
 */
export function isIslandAt(world: World, x: number, y: number): boolean {
  // The cell's own reading first: every cell of the sea asks this, and
  // a cell the field does not stand out of is in no block of them
  if (!isIslandField(world, x, y)) {
    return false;
  }
  return SQUARES.some(([ox, oy]) => {
    for (let dy = 0; dy < 2; dy += 1) {
      for (let dx = 0; dx < 2; dx += 1) {
        const cx = x + ox + dx;
        const cy = y + oy + dy;

        if (!isOpenSea(world.getCellBiome(cx, cy)) || !isIslandField(world, cx, cy)) {
          return false;
        }
      }
    }
    return true;
  });
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
    // Land out there is the islands and nothing else
    return !isIslandAt(world, x, y);
  }
  if (isWaterBiome(biome)) {
    // A bank is where the field runs dry, which is the pool's own
    // rule read backwards
    return pooled > -BANK_LEVEL;
  }
  return pooled > LAKE_LEVEL || isRiver(world, x, y);
}
