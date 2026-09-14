import { Depth } from './depth';
import { ORTHOGONAL, SURROUNDING } from './grid';
import { roleAt } from './ground';
import { isRouteAt } from './route';
import { levelAt } from './terrace';
import { isRoadAt } from './town';
import type World from './world';

/**
 * What a step between two levels does to a walk.
 *
 * A cliff is the only thing above ground that stops a walk: the stone
 * field walls nothing off any more. The face cannot be walked on to,
 * so the ground a player reaches is the level they are already on,
 * unless something cuts a way through.
 *
 * It lives apart from `terrace.ts` because a seam is a fact about
 * roads and water, and those know about the ground, which knows about
 * the levels.
 */

/** How far apart the natural passes up a cliff are, in cells along it */
const PASS_SPACING = 20;

/** How wide a pass is where it crosses a cliff, so a staircase of rock still opens */
const PASS_WIDTH = 3;

/**
 * Whether the cell stands higher than any ground around it, diagonals
 * included. The cliff art takes this whole tile, an inside corner as
 * much as a side, so nobody walks on it and nothing is placed on it
 */
export function isFace(world: World, x: number, y: number): boolean {
  const level = levelAt(world, x, y);

  return SURROUNDING.some(([dx, dy]) => levelAt(world, x + dx, y + dy) < level);
}

/** Whether lower ground lies straight beside the cell, since a walk never steps across a diagonal */
function descends(world: World, x: number, y: number): boolean {
  const here = levelAt(world, x, y);

  return ORTHOGONAL.some(([dx, dy]) => levelAt(world, x + dx, y + dy) < here);
}

const SEEDS = new WeakMap<World, number>();

/** The world seed folded to an integer once, for the pass offsets */
function seedOf(world: World): number {
  let seed = SEEDS.get(world);

  if (seed == null) {
    seed = 2166136261;
    for (let at = 0; at < world.seed.length; at += 1) {
      seed = Math.imul(seed ^ world.seed.charCodeAt(at), 16777619);
    }
    SEEDS.set(world, seed);
  }
  return seed;
}

/** A well-mixed non-negative integer from three */
function mix(a: number, b: number, c: number): number {
  let h = Math.imul(a ^ Math.imul(b, 0x9e3779b1), 0x85ebca6b) ^ Math.imul(c, 0xc2b2ae35);

  h = Math.imul(h ^ (h >>> 16), 0x85ebca6b);
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35);
  return (h ^ (h >>> 16)) >>> 0;
}

/**
 * Whether a natural pass crosses the cliff here, so a walk beside a terrace
 * is never far from a way up it. Passes are bands across the run of the
 * cliff, shifted per stretch and per level so they never line up
 */
export function isPassAt(world: World, x: number, y: number): boolean {
  const here = levelAt(world, x, y);
  const lower = (dx: number, dy: number): boolean => levelAt(world, x + dx, y + dy) < here;
  const crosses = (along: number, across: number, axis: number): boolean => {
    const offset = mix(seedOf(world), Math.floor(across / PASS_SPACING), axis * 8 + here);

    return (((along - offset) % PASS_SPACING) + PASS_SPACING) % PASS_SPACING < PASS_WIDTH;
  };

  return (
    ((lower(0, 1) || lower(0, -1)) && crosses(x, y, 0)) ||
    ((lower(1, 0) || lower(-1, 0)) && crosses(y, x, 1))
  );
}

/** Whether a road or a route runs over the cell, which always cuts its way through a step */
function isStreetAt(world: World, x: number, y: number): boolean {
  return isRoadAt(world, x, y) || isRouteAt(world, x, y);
}

/**
 * Whether something cuts a way through the face here on its own account,
 * before asking what is beside it. Water pours over any step it stands on,
 * since a pool never sits at a dry drop, and a road or route is graded through
 * whatever step it meets
 */
function cuts(world: World, x: number, y: number): boolean {
  if (roleAt(world, x, y) === 'water' || isStreetAt(world, x, y)) {
    return true;
  }
  return isPassAt(world, x, y) && descends(world, x, y);
}

/**
 * Whether a dry way through the face here leads anywhere. It needs lower
 * ground straight beside it, and where the faces beside it turn a corner
 * every one of them has to be a way through too: a corner joined to a
 * single other seam reaches the high ground only diagonally
 */
export function leadsThrough(world: World, x: number, y: number): boolean {
  if (!descends(world, x, y)) {
    return false;
  }
  const faces = ORTHOGONAL.filter(([dx, dy]) => isFace(world, x + dx, y + dy));
  // Perpendicular sides: the dot product of two of the four offsets is zero only where they turn
  const turns = faces.some(([ax, ay]) => faces.some(([bx, by]) => ax * bx + ay * by === 0));

  return !turns || faces.every(([dx, dy]) => cuts(world, x + dx, y + dy));
}

/**
 * Whether a way through the face runs here.
 *
 * Water on a step is always a fall into more water, so nothing stops
 * whatever swims. A road or route is always the climb, corners too, so
 * no street is ever cut by a cliff. A natural pass is the climb wherever
 * it leads somewhere
 */
export function isSeam(world: World, x: number, y: number): boolean {
  // Underground every step is a way, corners too: a cliff across a
  // passage reads as a wall the walls already make hard enough
  if (world.depth === Depth.Cave || roleAt(world, x, y) === 'water' || isStreetAt(world, x, y)) {
    return true;
  }
  return isPassAt(world, x, y) && leadsThrough(world, x, y);
}

/** Whether the step up here stops a walk. */
export function blocksWalk(world: World, x: number, y: number): boolean {
  return isFace(world, x, y) && !isSeam(world, x, y);
}
