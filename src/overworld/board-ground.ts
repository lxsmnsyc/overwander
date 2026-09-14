import type Biome from '../data/ids/biome';
import { isFace, isSeam } from './cliff';
import { type GroundRole, isShelfAt, readGround, roleAt } from './ground';
import { isRouteAt } from './route';
import { levelAt } from './terrace';
import { isPlotAt, isRoadAt, isTownAt } from './town';
import type World from './world';

/**
 * One window of ground, read for the board that draws it.
 *
 * Apart from `ground.ts` because a seam is a fact about roads and
 * routes, and a route is planned over the ground, which cannot then
 * ask the route about itself
 */

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
  /**
   * Whether a town's street or a building's plot is paved here. It is drawn over the
   * ground rather than being a kind of ground, so nothing about
   * walking, spawning or building reads it
   */
  road: (x: number, y: number) => boolean;
  /** Whether a route between towns runs through here, drawn as a trail */
  route: (x: number, y: number) => boolean;
  /** Whether a town stands here, whose open ground is drawn worn */
  town: (x: number, y: number) => boolean;
  /**
   * How high the ground stands, in terrace levels. The face between
   * two of them is where a cliff is drawn, so the board wants it per
   * cell rather than as a rule about the world
   */
  level: (x: number, y: number) => number;
  /**
   * Whether a dry way through a step runs here: a road, a route or a
   * natural pass. The board draws one as a ramp between the levels rather
   * than as a wall, so a step a player can climb looks like one
   */
  seam: (x: number, y: number) => boolean;
  /** Dev overlay only: a face nobody passes, a face with a way through, or neither. Read on demand */
  step?: (x: number, y: number) => 'cliff' | 'seam' | null;
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
  const roads = new Uint8Array(span * span);
  const routes = new Uint8Array(span * span);
  const towns = new Uint8Array(span * span);
  const seams = new Uint8Array(span * span);
  const levels = new Uint8Array(span * span);
  const inside = (x: number, y: number): boolean =>
    x >= -margin && y >= -margin && x < cells + margin && y < cells + margin;
  const key = (x: number, y: number): number => (y + margin) * span + (x + margin);

  for (let y = -margin; y < cells + margin; y++) {
    for (let x = -margin; x < cells + margin; x++) {
      const { biome, role } = readGround(world, originX + x, originY + y);

      roles[key(x, y)] = ROLE_ORDER.indexOf(role);
      biomes[key(x, y)] = biome;
      roads[key(x, y)] =
        isRoadAt(world, originX + x, originY + y) || isPlotAt(world, originX + x, originY + y)
          ? 1
          : 0;
      routes[key(x, y)] = isRouteAt(world, originX + x, originY + y) ? 1 : 0;
      towns[key(x, y)] = isTownAt(world, originX + x, originY + y) ? 1 : 0;
      seams[key(x, y)] = role !== 'water' && isSeam(world, originX + x, originY + y) ? 1 : 0;
      levels[key(x, y)] = levelAt(world, originX + x, originY + y);
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
    road: (x, y) =>
      inside(x, y)
        ? roads[key(x, y)] === 1
        : isRoadAt(world, originX + x, originY + y) || isPlotAt(world, originX + x, originY + y),
    route: (x, y) =>
      inside(x, y) ? routes[key(x, y)] === 1 : isRouteAt(world, originX + x, originY + y),
    town: (x, y) =>
      inside(x, y) ? towns[key(x, y)] === 1 : isTownAt(world, originX + x, originY + y),
    level: (x, y) => (inside(x, y) ? levels[key(x, y)] : levelAt(world, originX + x, originY + y)),
    seam: (x, y) =>
      inside(x, y)
        ? seams[key(x, y)] === 1
        : roleAt(world, originX + x, originY + y) !== 'water' &&
          isSeam(world, originX + x, originY + y),
    step: (x, y) => {
      if (!isFace(world, originX + x, originY + y)) {
        return null;
      }
      return isSeam(world, originX + x, originY + y) ? 'seam' : 'cliff';
    },
  };
}
