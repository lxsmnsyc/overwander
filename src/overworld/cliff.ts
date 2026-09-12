import { ORTHOGONAL } from './grid';
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

/**
 * Whether the cell stands higher than the ground beside it, which is
 * where the face of the cliff is drawn and so what a player cannot
 * walk on to
 */
export function isFace(world: World, x: number, y: number): boolean {
  const level = levelAt(world, x, y);

  return ORTHOGONAL.some(([dx, dy]) => levelAt(world, x + dx, y + dy) < level);
}

/**
 * Whether water runs over the step here rather than spilling off a
 * corner of it.
 *
 * Water seams itself: a pool never sits at a dry drop, so a wet cell
 * standing over a step stands over more water, the two levels are one
 * fall, and nothing there stops whatever swims.
 *
 * The exception is a cell at the corner of a terrace, where the ground
 * falls away on two sides at once. A fall runs one way, and a cell
 * pouring off two sides of itself is the corner of the cliff rather
 * than a way down it, so the step stays shut there. Two opposite sides
 * are a chute rather than a corner, and water does run through one
 */
function falls(world: World, x: number, y: number): boolean {
  if (roleAt(world, x, y) !== 'water') {
    return false;
  }
  const here = levelAt(world, x, y);
  const under = ORTHOGONAL.filter(([dx, dy]) => levelAt(world, x + dx, y + dy) < here);

  // Perpendicular sides, which is what a corner is: the dot product of
  // two of the four offsets is zero only where they turn
  return !under.some(([ax, ay]) => under.some(([bx, by]) => ax * bx + ay * by === 0));
}

/**
 * Whether a way through the face runs here.
 *
 * A road is cut through what it crosses, so where one meets a step up
 * it is the climb: the cliff opens and the walk carries on. Water
 * carries a walk over a step of its own accord, which `falls` states
 */
export function isSeam(world: World, x: number, y: number): boolean {
  return falls(world, x, y) || isRoadAt(world, x, y) || isRouteAt(world, x, y);
}

/** Whether the step up here stops a walk. */
export function blocksWalk(world: World, x: number, y: number): boolean {
  return isFace(world, x, y) && !isSeam(world, x, y);
}
