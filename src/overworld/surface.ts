import CellMemo from '../core/cell-memo';
import Biome, { isOpenSea } from '../data/ids/biome';
import { isRock, isWaterAt } from './fields';
import { SQUARES, SURROUNDING } from './grid';
import { isTownAt } from './town';
import { levelAt } from './terrace';
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
 * The same rule, remembering what it has answered for each world.
 *
 * The water rules below read one another across four neighbours and
 * nine cells at a time, so one reading of one cell is thousands of the
 * cheapest one without this. Held against the world, so a world nobody
 * is standing in is collected with its answers
 */
function remembered(
  read: (world: World, x: number, y: number) => boolean,
): (world: World, x: number, y: number) => boolean {
  const held = new WeakMap<World, CellMemo<boolean>>();

  return (world, x, y) => {
    let kept = held.get(world);

    if (kept == null) {
      kept = new CellMemo<boolean>();
      held.set(world, kept);
    }
    const known = kept.get(x, y);

    if (known != null) {
      return known;
    }
    const answer = read(world, x, y);

    kept.set(x, y, answer);
    return answer;
  };
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
  if (biome !== Biome.Volcano) {
    return true;
  }
  for (const [dx, dy] of SURROUNDING) {
    if (world.getCellBiome(x + dx, y + dy) !== Biome.Volcano) {
      return false;
    }
  }
  return true;
});

/** Whether all four cells of one 2x2 square answer to something. */
function fitsSquare(ox: number, oy: number, is: (x: number, y: number) => boolean): boolean {
  for (let dy = 0; dy < 2; dy += 1) {
    for (let dx = 0; dx < 2; dx += 1) {
      if (!is(ox + dx, oy + dy)) {
        return false;
      }
    }
  }
  return true;
}

/**
 * Whether the water here hangs over a cliff, read against whatever the
 * caller counts as water below the step.
 *
 * A pool's surface is level, so it cannot sit at the lip of a step
 * with open country below it: drawn there, the water would end in
 * mid-air and the cliff would be wearing it as a hat. Where the ground
 * below is water too, the two are one fall and the board runs them
 * together, so only a dry drop dries the lip up. Diagonals count, since
 * a cliff's inside corner is as much its edge as a side
 */
function spills(
  world: World,
  x: number,
  y: number,
  below: (cx: number, cy: number) => boolean,
): boolean {
  const here = levelAt(world, x, y);

  for (const [dx, dy] of SURROUNDING) {
    if (levelAt(world, x + dx, y + dy) < here && !below(x + dx, y + dy)) {
      return true;
    }
  }
  return false;
}

/**
 * Whether water covers this cell.
 *
 * Water is laid in 2x2 blocks rather than cell by cell: the shore is
 * drawn as a ring of edges and corners, and a single cell asks for
 * all four corners at once. A block stands on one level, so water only
 * ever depends on the water below it and the lip rule can ask this
 * finished answer of the step below without asking about itself
 */
const isWater = remembered((world: World, x: number, y: number): boolean => {
  const level = levelAt(world, x, y);
  // water may stand on a cell of this level where the fields put it and
  // every lower cell beside it is water too
  const pools = (cx: number, cy: number): boolean =>
    levelAt(world, cx, cy) === level &&
    isWetField(world, cx, cy) &&
    !spills(world, cx, cy, (bx, by) => isWater(world, bx, by));

  for (const [ox, oy] of SQUARES) {
    if (fitsSquare(ox, oy, (cx, cy) => pools(x + cx, y + cy))) {
      return true;
    }
  }
  return false;
});

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
