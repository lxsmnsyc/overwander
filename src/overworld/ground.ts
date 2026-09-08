import Biome, { BIOME_CONFIGS, isOpenSea, isWaterBiome } from '../data/ids/biome';
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
const STONE_FREQUENCY = 1 / 8;
const ROCK_LEVEL = 0.42;
const ROCK_LIFT = 0.18;

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

/** How high the biome stands, for the rock that comes through it */
function heightOf(biome: Biome): number {
  // Beyond is the portal world, which has no climate and no ground of
  // its own to bring rock through
  return biome === Biome.Beyond ? 0 : BIOME_CONFIGS[biome].elevation;
}

/** How high the stone has to stand here to break the surface */
function rockLevel(biome: Biome): number {
  // Against the country's own height: a mountain is mostly rock and a
  // meadow has a boulder in it
  return ROCK_LEVEL - ROCK_LIFT * Math.max(0, heightOf(biome));
}

/** Whether the rock breaks the surface here, before the gaps are filled */
function isRock(world: World, x: number, y: number, biome: Biome): boolean {
  return world.stone.noise(x * STONE_FREQUENCY, y * STONE_FREQUENCY) > rockLevel(biome);
}

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

/** Whether the rock stands here, before the pockets are filled */
function isRawWall(world: World, x: number, y: number): boolean {
  return isRock(world, x, y, world.getCellBiome(x, y));
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

/**
 * What one cell of the world is: the country it belongs to and what
 * a player finds underfoot there
 */
export function readGround(world: World, x: number, y: number): { biome: Biome; role: GroundRole } {
  const biome = world.getCellBiome(x, y);

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
