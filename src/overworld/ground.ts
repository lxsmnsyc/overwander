import type Biome from '../data/ids/biome';
import { isOpenSea, isWaterBiome } from '../data/ids/biome';
import { STONE_FREQUENCY, isRock, isWaterAt, rockLevel } from './fields';
import { isTownAt } from './town';
import type World from './world';

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

export type GroundRole = 'ground' | 'water' | 'wall';

/**
 * How far under the rock level the ground is still shelf: the lighter
 * tiles the deep is drawn to meet, which is why they gather round the
 * outcrops rather than sitting in patches of their own
 */
const SHELF_REACH = 0.1;

/** The four cells straight out of one */
const ORTHOGONAL: [dx: number, dy: number][] = [
  [0, -1],
  [1, 0],
  [0, 1],
  [-1, 0],
];

/**
 * How near the rock level a cell has to be to count as a gap in an
 * outcrop rather than as open country beside one. The field is smooth,
 * so a cell with rock on all four sides is all but at the level
 * itself; the reach is what keeps the test off the other 99 cells in
 * a hundred
 */
const HOLE_REACH = 0.08;

/**
 * How big a hollow in the rock may be before it is country rather
 * than a hole. A pocket this size is a few cells nobody can reach;
 * anything larger is a valley with a way into it somewhere
 */
export const POCKET_LIMIT = 12;

/**
 * Whether the rock stands here, before the pockets are filled. A town
 * has levelled its own ground, so nothing walls a cell inside one
 */
function isRawWall(world: World, x: number, y: number): boolean {
  const biome = world.getCellBiome(x, y);

  if (!isOpenSea(biome) && isTownAt(world, x, y)) {
    return false;
  }
  return isRock(world, x, y, biome);
}

/**
 * Whether the rock has closed round this cell.
 *
 * A hole in an outcrop is worse than the outcrop: nothing can walk
 * into it, and a spawn that lands there is a spawn nobody reaches. It
 * is asked of the world rather than of the chunk, so two chunks
 * sharing a hole fill it the same way, and it is asked in three steps,
 * cheapest first: the field has to be near the rock level here, the
 * rock has to be on two sides at least, and only then is the hollow
 * walked to see whether it runs anywhere
 */
function isPocket(world: World, x: number, y: number, biome: Biome): boolean {
  if (
    world.stone.noise(x * STONE_FREQUENCY, y * STONE_FREQUENCY) <=
    rockLevel(biome) - HOLE_REACH
  ) {
    return false;
  }

  let walls = 0;

  for (const [dx, dy] of ORTHOGONAL) {
    if (isRawWall(world, x + dx, y + dy)) {
      walls += 1;
    }
  }
  if (walls < 2) {
    return false;
  }

  const seen = new Set([`${x},${y}`]);
  const queue: [number, number][] = [[x, y]];

  for (let at = 0; at < queue.length; at++) {
    const [px, py] = queue[at];

    for (const [dx, dy] of ORTHOGONAL) {
      const nx = px + dx;
      const ny = py + dy;
      const key = `${nx},${ny}`;

      if (seen.has(key) || isRawWall(world, nx, ny)) {
        continue;
      }
      if (seen.size >= POCKET_LIMIT) {
        return false;
      }
      seen.add(key);
      queue.push([nx, ny]);
    }
  }
  return true;
}

/**
 * What one cell of the world is: the country it belongs to and what
 * a player finds underfoot there
 */
export function readGround(world: World, x: number, y: number): { biome: Biome; role: GroundRole } {
  const biome = world.getCellBiome(x, y);

  // A town is levelled ground: whatever the fields left there, people
  // have since drained it, cleared it and built on it. The sea is the
  // one thing they have not, so a town on a coast ends at the shore
  if (!isOpenSea(biome) && isTownAt(world, x, y)) {
    return { biome, role: 'ground' };
  }
  if (isRock(world, x, y, biome)) {
    return { biome, role: 'wall' };
  }
  if (isWaterAt(world, x, y, biome)) {
    return { biome, role: 'water' };
  }
  // Water in a hollow is left alone: it is not something to pave over
  return { biome, role: isPocket(world, x, y, biome) ? 'wall' : 'ground' };
}

/** What a player finds underfoot at one cell */
export function roleAt(world: World, x: number, y: number): GroundRole {
  return readGround(world, x, y).role;
}

/**
 * Whether this water is drawn with the lighter shelf tiles: the water
 * at the foot of a wall, where the rip's own art fades into ground,
 * and the water shallow enough for the shelf to show through.
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
  // The skirt: a wall's fringe is painted fading into ground, so the
  // ring around every outcrop is drawn as shelf
  for (const [dx, dy] of ORTHOGONAL) {
    if (roleAt(world, x + dx, y + dy) === 'wall') {
      return true;
    }
  }
  return (
    world.stone.noise(x * STONE_FREQUENCY, y * STONE_FREQUENCY) > rockLevel(biome) - SHELF_REACH
  );
}

/**
 * The ground a board draws, read once for the window it shows.
 *
 * The window is a square of world cells with an apron round it, and
 * nothing about it is aligned to a chunk: the board follows the
 * player rather than the grid, so its corner is wherever they are
 * standing. Read once because a frame asks every cell what it is
 * several times over, and the fields do not change between frames
 */
export interface BoardGround {
  /** How far past the board the window reaches, in cells */
  margin: number;
  role: (x: number, y: number) => GroundRole;
  biome: (x: number, y: number) => Biome;
  /** Whether the water here is drawn with the lighter shelf tiles */
  shelf: (x: number, y: number) => boolean;
}

const ROLE_ORDER: GroundRole[] = ['ground', 'water', 'wall'];

/**
 * The ground under a board window, in board coordinates: `0, 0` is
 * the cell at `originX, originY` of the world
 */
export function readBoardGround(
  world: World,
  originX: number,
  originY: number,
  margin: number,
  cells: number,
): BoardGround {
  const span = cells + margin * 2;
  const roles = new Uint8Array(span * span);
  const biomes = new Uint8Array(span * span);
  const shelves = new Uint8Array(span * span);
  const inside = (x: number, y: number): boolean =>
    x >= -margin && y >= -margin && x < cells + margin && y < cells + margin;
  const key = (x: number, y: number): number => (y + margin) * span + (x + margin);

  for (let y = -margin; y < cells + margin; y++) {
    for (let x = -margin; x < cells + margin; x++) {
      const { biome, role } = readGround(world, originX + x, originY + y);

      roles[key(x, y)] = ROLE_ORDER.indexOf(role);
      biomes[key(x, y)] = biome;
    }
  }
  for (let y = -margin; y < cells + margin; y++) {
    for (let x = -margin; x < cells + margin; x++) {
      if (roles[key(x, y)] === ROLE_ORDER.indexOf('water')) {
        shelves[key(x, y)] = isShelfAt(world, originX + x, originY + y) ? 1 : 0;
      }
    }
  }

  return {
    margin,
    // Past the window the world is asked directly: a frame reaches
    // one cell further than it draws when it works out an edge
    role: (x, y) =>
      inside(x, y) ? ROLE_ORDER[roles[key(x, y)]] : roleAt(world, originX + x, originY + y),
    biome: (x, y) =>
      inside(x, y) ? biomes[key(x, y)] : world.getCellBiome(originX + x, originY + y),
    shelf: (x, y) =>
      inside(x, y) ? shelves[key(x, y)] === 1 : isShelfAt(world, originX + x, originY + y),
  };
}
