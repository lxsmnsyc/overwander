import Biome, { isOpenSea, isWaterBiome } from '../data/ids/biome';
import { STONE_FREQUENCY, isCaveFloor, isRock, isWaterAt, rockLevel } from './fields';
import { ORTHOGONAL, SQUARES, SURROUNDING } from './grid';
import { isTownAt } from './town';
import { levelAt } from './terrace';
import type World from './world';
import { Depth } from './depth';

/**
 * What one cell of the world is made of.
 *
 * The ground used to be grown inside a chunk: a few blobs of water
 * and rock started from the chunk's own seed and kept inside its
 * placement area, which drew every chunk as a framed board with a
 * clear rim. It is read out of world-space fields instead, so a lake
 * runs off one chunk and into the next because neither of them ever
 * knew where it began.
 *
 * Everything here is a pure function of the world and a cell, so two
 * clients standing either side of a border draw the same shore.
 */

/** Rock is a cave's alone: above ground nothing is walled off. */
export type GroundRole = 'ground' | 'water' | 'wall';

/**
 * How far under the rock level the water is still shelf: the lighter
 * tiles the deep is drawn to meet, so they gather where the stone is
 * about to break the surface rather than sitting in patches of their
 * own
 */
const SHELF_REACH = 0.1;

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

/** How many columns of one answer are kept before the lot is dropped */
const KEPT = 1 << 11;

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
  const held = new WeakMap<World, Map<number, Map<number, boolean>>>();

  return (world, x, y) => {
    let kept = held.get(world);

    if (kept == null) {
      kept = new Map<number, Map<number, boolean>>();
      held.set(world, kept);
    }
    let column = kept.get(x);

    if (column == null) {
      if (kept.size >= KEPT) {
        kept.clear();
      }
      column = new Map<number, boolean>();
      kept.set(x, column);
    }
    const known = column.get(y);

    if (known != null) {
      return known;
    }
    const answer = read(world, x, y);

    column.set(y, answer);
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
  return !SURROUNDING.some(([dx, dy]) => world.getCellBiome(x + dx, y + dy) !== Biome.Volcano);
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
 * Whether a 2x2 block of water fits somewhere over this cell, as the
 * field alone sees it. What the lip rule asks about the cell below a
 * step, which cannot ask the finished answer without asking about
 * itself
 */
function isBroadField(world: World, x: number, y: number): boolean {
  return SQUARES.some(([ox, oy]) =>
    fitsSquare(ox, oy, (cx, cy) => isWetField(world, x + cx, y + cy)),
  );
}

/**
 * Whether the water here hangs over a cliff, read against whatever the
 * caller counts as water below the step.
 *
 * A pool's surface is level, so it cannot sit at the lip of a step
 * with open country below it: drawn there, the water would end in
 * mid-air and the cliff would be wearing it as a hat. Where the ground
 * below is water too, the two are one fall and the board runs them
 * together, so only a dry drop dries the lip up
 */
function spills(
  world: World,
  x: number,
  y: number,
  below: (cx: number, cy: number) => boolean,
): boolean {
  const here = levelAt(world, x, y);

  return ORTHOGONAL.some(
    ([dx, dy]) => levelAt(world, x + dx, y + dy) < here && !below(x + dx, y + dy),
  );
}

/**
 * Whether the fields would leave water here, read one step short of
 * the answer: the lip rule against the water the fields alone put
 * below the step.
 *
 * Two readings of the same rule rather than one because the finished
 * answer cannot be asked of the cell below without asking about this
 * cell in turn. This is the rougher of the two, and it is what the
 * finished one reads below a step
 */
const poolsAsField = remembered(
  (world: World, x: number, y: number): boolean =>
    isWetField(world, x, y) &&
    !spills(world, x, y, (cx, cy) => isWetField(world, cx, cy) && isBroadField(world, cx, cy)),
);

/** Whether a 2x2 block of that rougher water fits over this cell */
function isBroadPool(world: World, x: number, y: number): boolean {
  return SQUARES.some(([ox, oy]) =>
    fitsSquare(ox, oy, (cx, cy) => poolsAsField(world, x + cx, y + cy)),
  );
}

/**
 * Whether water may stand on this cell: the fields put it here, and
 * the step below it, if there is one, falls into more water
 */
const pools = remembered(
  (world: World, x: number, y: number): boolean =>
    isWetField(world, x, y) &&
    !spills(world, x, y, (cx, cy) => poolsAsField(world, cx, cy) && isBroadPool(world, cx, cy)),
);

/**
 * Whether water covers this cell.
 *
 * Water is laid in 2x2 blocks rather than cell by cell: the shore is
 * drawn as a ring of edges and corners, and a single cell asks for
 * all four corners at once. Read as blocks, every water cell has three
 * others square with it whatever else has dried up, which drying cells
 * one at a time and measuring afterwards cannot promise
 */
function isWater(world: World, x: number, y: number): boolean {
  return SQUARES.some(([ox, oy]) => fitsSquare(ox, oy, (cx, cy) => pools(world, x + cx, y + cy)));
}

/**
 * What one cell of the world is: the country it belongs to and what
 * a player finds underfoot there
 */
export function readGround(world: World, x: number, y: number): { biome: Biome; role: GroundRole } {
  const biome = world.getCellBiome(x, y);

  // Underground there is only stone and the space in it. The country
  // overhead still decides what lives down there, so the biome is the
  // surface's, but nothing else about the cell is
  if (world.depth === Depth.Cave) {
    return { biome, role: isCaveFloor(world, x, y, biome) ? 'ground' : 'wall' };
  }

  // A town is levelled ground: whatever the fields left there, people
  // have since drained it, cleared it and built on it. The sea is the
  // one thing they have not, so a town on a coast ends at the shore
  if (!isOpenSea(biome) && isTownAt(world, x, y)) {
    return { biome, role: 'ground' };
  }
  if (isWater(world, x, y)) {
    return { biome, role: 'water' };
  }
  // Everything else is walked on. The stone field still says where a
  // hillside is, for the caves and for the shelf, but it walls nothing
  // off up here: what used to be an outcrop is open country
  return { biome, role: 'ground' };
}

/** What a player finds underfoot at one cell */
export function roleAt(world: World, x: number, y: number): GroundRole {
  return readGround(world, x, y).role;
}

/**
 * Whether this water is drawn with the lighter shelf tiles: the water
 * shallow enough for the shoal under it to show through.
 *
 * Purely a look. A shelf cell is swum exactly like the deep beside it
 */
export function isShelfAt(world: World, x: number, y: number): boolean {
  const { biome, role } = readGround(world, x, y);

  // The seas and the wetlands only: a lake in a field is drawn with
  // the shoreline its own edge gives it, and shelf laid over that
  // would rub the shore out
  if (role !== 'water' || !isWaterBiome(biome)) {
    return false;
  }
  // Where the stone field is close to breaking the surface, which is
  // a shoal rather than an island now that nothing is walled off
  return (
    world.stone.noise(x * STONE_FREQUENCY, y * STONE_FREQUENCY) > rockLevel(biome) - SHELF_REACH
  );
}
