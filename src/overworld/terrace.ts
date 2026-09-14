import CellMemo from '../core/cell-memo';
import { SQUARES } from './grid';
import type World from './world';

/**
 * How high the ground stands, in levels.
 *
 * Read off the same warped elevation the biome is classified from, so
 * a mountain is high country because it is mountain country: the two
 * cannot disagree. The sea and the low shore beside it share level 0,
 * so a coast meets the water without a cliff, and the bands above it
 * are where a player climbs.
 *
 * A level is walkable ground like any other. What stops a player is
 * the face between two of them, which is the cliff.
 */

/**
 * The edges of the bands, in the elevation field's own units. The first
 * sits above the beaches and wetlands (0 to 0.05), so no step splits them
 */
export const TERRACE_STEPS = [0.1, 0.3, 0.55] as const;

/** The highest level the world reaches, which is the last step */
export const TERRACE_TOP = TERRACE_STEPS.length;

/**
 * Every raw level read so far, per world.
 *
 * The climate behind it is five noise samples warped through two
 * more, and the opening below asks for sixteen cells to answer one, so
 * a board window would read the field a hundred thousand times over
 * without this. Held against the world rather than beside it, so a
 * world nobody is standing in is collected with its readings
 */
const READ = new WeakMap<World, CellMemo<number>>();

/** How high the ground stands at a cell, before the thin parts go */
function rawLevelAt(world: World, x: number, y: number): number {
  let kept = READ.get(world);

  if (kept == null) {
    kept = new CellMemo<number>();
    READ.set(world, kept);
  }
  const known = kept.get(x, y);

  if (known != null) {
    return known;
  }
  const { elevation } = world.getCellClimate(x, y);
  let level = 0;

  for (const step of TERRACE_STEPS) {
    if (elevation >= step) {
      level++;
    }
  }
  kept.set(x, y, level);
  return level;
}

/**
 * Whether a step up stands two cells wide here.
 *
 * A cliff one cell across has no corner to draw: the art is a ring of
 * edges and corners, and a single cell asks for all four corners at
 * once. So a level only counts where the cell belongs to a 2x2 block
 * of ground standing at least that high, which is the same opening
 * the water is held to
 */
function broad(world: World, x: number, y: number, level: number): boolean {
  return SQUARES.some(([ox, oy]) => {
    for (let dy = 0; dy < 2; dy += 1) {
      for (let dx = 0; dx < 2; dx += 1) {
        if (rawLevelAt(world, x + ox + dx, y + oy + dy) < level) {
          return false;
        }
      }
    }
    return true;
  });
}

/** How high the ground stands at a cell */
export function levelAt(world: World, x: number, y: number): number {
  for (let level = rawLevelAt(world, x, y); level > 0; level -= 1) {
    if (broad(world, x, y, level)) {
      return level;
    }
  }
  return 0;
}

/**
 * Whether a step between two cells crosses a face. The two have to be
 * on the same level to be walked between, which is what makes a
 * terrace somewhere to be rather than somewhere to pass through
 */
export function crossesFace(
  world: World,
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
): boolean {
  return levelAt(world, fromX, fromY) !== levelAt(world, toX, toY);
}
