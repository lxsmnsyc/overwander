import CellMemo from '../core/cell-memo';
import { SURROUNDING } from './grid';
import { levelAt } from './terrace';
import type World from './world';

/**
 * How standing water lies, wherever it stands.
 *
 * Two rules, and both layers of the world keep them. Water is laid in
 * 3x3 blocks rather than cell by cell: a shore is drawn as a ring of
 * edges and corners, and at anything narrower the ring meets itself
 * and the water is all bank. And a pool's surface is level, so it may
 * not sit at the lip of a step with dry ground below it: drawn there
 * the water would end in mid-air and the cliff would be wearing it as
 * a hat.
 *
 * What differs between a lake and an aquifer is only which cells the
 * fields call wet, which is what the caller passes in.
 */

/** A rule about a cell, answered once per world and remembered */
export type CellRule = (world: World, x: number, y: number) => boolean;

/**
 * The same rule, remembering what it has answered for each world.
 *
 * The water rules read one another across four neighbours and nine
 * cells at a time, so one reading of one cell is thousands of the
 * cheapest one without this. Held against the world, so a world nobody
 * is standing in is collected with its answers
 */
export function remembered(read: CellRule): CellRule {
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

/** How wide a block of water has to be to stand at all */
const BLOCK = 3;

/** Whether every cell of one block-sized square answers to something. */
function fitsSquare(ox: number, oy: number, is: (x: number, y: number) => boolean): boolean {
  for (let dy = 0; dy < BLOCK; dy += 1) {
    for (let dx = 0; dx < BLOCK; dx += 1) {
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
 * Where the ground below is water too, the two are one fall and the
 * board runs them together, so only a dry drop dries the lip up.
 * Diagonals count, since a cliff's inside corner is as much its edge
 * as a side.
 *
 * `holds` is what stops the water leaving even though it stands lower:
 * underground that is the rock, which is a wall rather than a drop. A
 * pool in a cave is held in by the stone around it, and without this
 * every chamber dried back from its own walls
 */
function spills(
  world: World,
  x: number,
  y: number,
  below: (cx: number, cy: number) => boolean,
  holds: CellRule | null,
): boolean {
  const here = levelAt(world, x, y);

  for (const [dx, dy] of SURROUNDING) {
    const lower = levelAt(world, x + dx, y + dy) < here;

    if (lower && !below(x + dx, y + dy) && !(holds?.(world, x + dx, y + dy) ?? false)) {
      return true;
    }
  }
  return false;
}

/**
 * Where water actually stands, given the cells the fields call wet and,
 * where there are any, the cells that hold it in from below.
 *
 * A block stands on one level, so water only ever depends on the water
 * below it and the lip rule can ask this finished answer of the step
 * below without asking about itself
 */
export default function poolsWhere(isWet: CellRule, holds: CellRule | null = null): CellRule {
  const stands: CellRule = remembered((world, x, y) => {
    const level = levelAt(world, x, y);
    // Water may stand on a cell of this level where the fields put it
    // and every lower cell beside it is water too
    const pools = (cx: number, cy: number): boolean =>
      levelAt(world, cx, cy) === level &&
      isWet(world, cx, cy) &&
      !spills(world, cx, cy, (bx, by) => stands(world, bx, by), holds);

    // Every block this cell could belong to, which for a 3x3 is the
    // nine with it at each of their nine places
    for (let oy = 1 - BLOCK; oy <= 0; oy += 1) {
      for (let ox = 1 - BLOCK; ox <= 0; ox += 1) {
        if (fitsSquare(ox, oy, (cx, cy) => pools(x + cx, y + cy))) {
          return true;
        }
      }
    }
    return false;
  });

  return stands;
}
