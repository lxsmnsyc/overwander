import LRUMap from '../core/lru-map';
import { SQUARES } from './grid';
import { plateauAt, townSkirts } from './town';
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
 * The edges of the first generation's bands, in the elevation field's
 * own units. The first sits above the beaches and wetlands (0 to
 * 0.05), so no step splits them
 */
export const TERRACE_STEPS = [0.1, 0.3, 0.55] as const;

/** How many levels the second generation climbs through, a cliff about every ten cells */
export const SECOND_TERRACE_COUNT = 20;

/**
 * Evenly spaced steps from the first one up to the top of the field.
 * The steps are part of what places everything on the ground, so a
 * generation's count never changes once it is live
 */
export function evenTerraceSteps(count: number): number[] {
  const [first] = TERRACE_STEPS;
  const steps: number[] = [];

  for (let step = 0; step < count; step++) {
    steps.push(first + ((1 - first) * step) / count);
  }
  return steps;
}

/** The highest level this world reaches */
export function terraceTop(world: World): number {
  return world.terraceSteps.length;
}

/**
 * The highest level lying wholly below an elevation. For carrying a
 * height written in the first generation's levels into a world with
 * more of them, so it stands at the same place on the ground
 */
export function levelBelow(world: World, elevation: number): number {
  let level = 0;

  for (const step of world.terraceSteps) {
    if (step >= elevation) {
      break;
    }
    level++;
  }
  return level;
}

/** Chunks run to a few thousand either side, so the offset keeps keys whole and apart */
const CHUNK_KEY_OFFSET = 1 << 13;
const CHUNK_KEY_SPAN = 1 << 14;

/** How many chunks of raw levels a world keeps, a board's reach several times over */
const LEVELS_KEPT = 256;

/** Raw levels by chunk, -1 where not read yet. The 2x2 rule reads each cell many times over */
const KEPT = new WeakMap<World, LRUMap<number, Int8Array>>();

/** How high the ground stands at a cell, before the thin parts go */
function rawLevelAt(world: World, x: number, y: number): number {
  let kept = KEPT.get(world);

  if (kept == null) {
    kept = new LRUMap<number, Int8Array>(LEVELS_KEPT);
    KEPT.set(world, kept);
  }
  const key = ((x >> 4) + CHUNK_KEY_OFFSET) * CHUNK_KEY_SPAN + ((y >> 4) + CHUNK_KEY_OFFSET);
  let block = kept.get(key);

  if (block == null) {
    block = new Int8Array(256).fill(-1);
    kept.set(key, block);
  }
  const at = (x & 15) | ((y & 15) << 4);

  if (block[at] < 0) {
    block[at] = readRawLevel(world, x, y);
  }
  return block[at];
}

/** The raw level itself: the field's, eased toward any town that reaches the cell */
function readRawLevel(world: World, x: number, y: number): number {
  let level = elevationLevel(world, x, y);

  if (!world.flattensTowns) {
    return level;
  }
  // A town stands on one level, its middle's, and the ground round it
  // closes on that level a step at a time, so no cliff there is taller
  // than one level. Where two towns reach, it keeps within both
  for (const { town, give } of townSkirts(world, x, y)) {
    const base = elevationLevel(world, town.x, town.y);

    level = Math.min(base + give, Math.max(base - give, level));
  }
  return level;
}

/** The level the elevation field alone puts a cell on */
function elevationLevel(world: World, x: number, y: number): number {
  // The world remembers each cell's climate, so this is a lookup
  const elevation = world.getCellElevation(x, y);
  let level = 0;

  // The steps run lowest first, so the first one above is the last
  for (const step of world.terraceSteps) {
    if (elevation < step) {
      break;
    }
    level++;
  }
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
  for (const [ox, oy] of SQUARES) {
    let whole = true;

    for (let dy = 0; whole && dy < 2; dy += 1) {
      for (let dx = 0; whole && dx < 2; dx += 1) {
        whole = rawLevelAt(world, x + ox + dx, y + oy + dy) >= level;
      }
    }
    if (whole) {
      return true;
    }
  }
  return false;
}

/** How high the ground stands at a cell */
export function levelAt(world: World, x: number, y: number): number {
  // A plateau is all one level whatever lies past it, so the width
  // rule, which would lower its rim toward the slope, is not asked
  if (world.flattensTowns && plateauAt(world, x, y) != null) {
    return rawLevelAt(world, x, y);
  }
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
