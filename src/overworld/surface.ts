import type Biome from '../data/ids/biome';
import { isOpenSea } from '../data/ids/biome';
import { isRock, isSealedVolcano, isWaterAt } from './fields';
import { isRouteAt } from './route';
import { isTownAt } from './town';
import poolsWhere, { remembered } from './pooling';
import type World from './world';

/**
 * The ground above: where water stands and where a hillside is.
 *
 * Apart from `ground.ts` so the caves can ask it: what is open floor
 * underground depends on the mouths, and a mouth is read off this.
 */

/**
 * Whether the rock stands here, as far as anything above ground is
 * concerned: the stone field breaking the surface somewhere nobody
 * has built. Nothing is walled off by it any more, so this is only
 * asked about where a hillside is, which is where a cave has a way in
 */
export function isHillside(world: World, x: number, y: number): boolean {
  const biome = world.getCellBiome(x, y);

  if (!isOpenSea(biome) && isTownAt(world, x, y)) {
    return false;
  }
  return isRock(world, x, y, biome);
}

/**
 * Whether the fields put water here at all: water nobody has built on
 * that is not about to run into water of another kind.
 *
 * A volcano's water is lava, and lava reaching into the lake next door
 * reads as one pool of two liquids. So lava dries wherever the volcano
 * ends within a cell, which leaves bare ground between the crater and
 * whatever is beyond it. Only the lava is held back: water on the far
 * side of the border can then never be touching any, and a cell that
 * is not in a volcano pays nothing for the rule
 */
const isWetField = remembered((world: World, x: number, y: number): boolean => {
  const biome = world.getCellBiome(x, y);

  // Cheapest first, and asked of several cells for every one the board
  // draws: the water is a sample or two, the town is a search of the
  // region round it, and the border is eight more readings of the
  // country
  if (!isWaterAt(world, x, y, biome)) {
    return false;
  }
  if (!isOpenSea(biome) && isTownAt(world, x, y)) {
    return false;
  }
  // And a route crosses on made ground: the road between two towns is
  // built over what it has to cross, so a stream or the edge of a lake
  // is a causeway rather than a gap in the paving. The open sea is the
  // one thing nobody has built over
  if (!isOpenSea(biome) && isRouteAt(world, x, y)) {
    return false;
  }
  return isSealedVolcano(world, x, y, biome);
});

/**
 * Where the lakes, the rivers and the seas actually stand, under the
 * rules every pool keeps
 */
const isWater = poolsWhere(isWetField);

/**
 * Whether a surface cell is water rather than ground. A town is
 * levelled ground: whatever the fields left there, people have since
 * drained it, cleared it and built on it. The sea is the one thing they
 * have not, so a town on a coast ends at the shore
 */
export function isSurfaceWater(world: World, x: number, y: number, biome: Biome): boolean {
  if (!isOpenSea(biome) && isTownAt(world, x, y)) {
    return false;
  }
  return isWater(world, x, y);
}
