import { CHUNK_CELLS } from './grid';
import { TOWN_RADIUS, type Town, regionOfCell, townOfRegion } from './town';
import type World from './world';
import { Depth } from './depth';
import { isOpenSea } from '../data/ids/biome';
import { type GroundRole, roleAt } from './ground';

/**
 * The roads between towns.
 *
 * A road is derived rather than searched: a curve from one plaza to
 * the next, and a cell asks how near it is. A route long enough to
 * matter is 130 cells, which is more ground than any pathfinder here
 * could cover for a board that only ever draws 43 cells of it.
 */

/** How wide the paving is, in cells either side of the line */
export const ROUTE_WIDTH = 1.5;

/** How far a road may reach for its far end, in regions */
const ROUTE_REACH = 1;

/** How far a road may be pushed off the straight line, in cells */
const ROUTE_BEND = 26;

/** How many waypoints it bends through, so it meanders rather than arcs */
const ROUTE_JOINTS = 3;

/** How coarsely the curve is sampled, in cells between points */
const ROUTE_STEP = 2;

/** The noise the bend is read from, which is the climate's own warp */
const BEND_FREQUENCY = 1 / 160;

/**
 * How much open sea a road may cross, in cells. A river or a bay is
 * bridged; nobody has paved the ocean, so two towns either side of it
 * are joined by boat or not at all
 */
const ROUTE_FORD = 12;

/**
 * How many ways round a road is tried, and the one that stays on dry
 * ground wins. A bridge and a cutting are both fine, and a road that
 * is half of each was not routed by anybody
 */
const ROUTE_TRIES = 5;

/** What a cell of water and a cell of rock cost a candidate line */
const WATER_COST = 3;
const ROCK_COST = 2;

/** One road, as the line it runs along */
export interface Route {
  from: Town;
  to: Town;
  /** The curve, sampled into points about `ROUTE_STEP` cells apart */
  line: [x: number, y: number][];
}

const laid = new WeakMap<World, Map<string, Route[]>>();

function regionKey(regionX: number, regionY: number): string {
  return `${regionX},${regionY}`;
}

/**
 * A line from one plaza to the next, bending through waypoints pushed
 * off the straight run by the world's own warp. `sway` scales the
 * push, so the same pair can be offered several ways round
 */
function curve(world: World, from: Town, to: Town, sway: number): [x: number, y: number][] {
  const span = Math.hypot(to.x - from.x, to.y - from.y);
  const awayX = -(to.y - from.y) / span;
  const awayY = (to.x - from.x) / span;
  const joints: [x: number, y: number][] = [[from.x, from.y]];

  for (let joint = 1; joint <= ROUTE_JOINTS; joint++) {
    const held = joint / (ROUTE_JOINTS + 1);
    const alongX = from.x + (to.x - from.x) * held;
    const alongY = from.y + (to.y - from.y) * held;
    // Read at the waypoint rather than at the middle, so the line
    // wanders with the country instead of arcing once
    const lean =
      world.warpX.noise(alongX * BEND_FREQUENCY, alongY * BEND_FREQUENCY) * ROUTE_BEND * sway;

    joints.push([alongX + awayX * lean, alongY + awayY * lean]);
  }
  joints.push([to.x, to.y]);

  const line: [x: number, y: number][] = [];
  const steps = Math.max(2, Math.round(span / ROUTE_STEP));

  // Catmull-Rom through the waypoints, so the joins are smooth and the
  // road passes through each of them rather than near it
  for (let step = 0; step <= steps; step++) {
    const at = (step / steps) * (joints.length - 1);
    const leg = Math.min(joints.length - 2, Math.floor(at));
    const held = at - leg;
    const before = joints[Math.max(0, leg - 1)];
    const start = joints[leg];
    const end = joints[leg + 1];
    const after = joints[Math.min(joints.length - 1, leg + 2)];

    line.push([
      spline(before[0], start[0], end[0], after[0], held),
      spline(before[1], start[1], end[1], after[1], held),
    ]);
  }
  return line;
}

/** One axis of a Catmull-Rom, at the usual half tension */
function spline(before: number, start: number, end: number, after: number, held: number): number {
  const square = held * held;
  const cube = square * held;

  return (
    0.5 *
    (2 * start +
      (end - before) * held +
      (2 * before - 5 * start + 4 * end - after) * square +
      (-before + 3 * start - 3 * end + after) * cube)
  );
}

/** What a cell of each role costs a candidate line */
const ROLE_COST: Record<GroundRole, number> = { ground: 0, water: WATER_COST, wall: ROCK_COST };

/** What a line costs to walk: the water and the rock it has to cross */
function roughness(world: World, line: [x: number, y: number][]): number {
  let cost = 0;

  for (const [x, y] of line) {
    cost += ROLE_COST[roleAt(world, Math.round(x), Math.round(y))];
  }
  return cost;
}

/** How much open sea a line runs over, in cells */
function crossesSea(world: World, line: [x: number, y: number][]): number {
  let over = 0;

  for (const [x, y] of line) {
    if (isOpenSea(world.getCellBiome(Math.round(x), Math.round(y)))) {
      over += ROUTE_STEP;
    }
  }
  return over;
}

/**
 * The best way round for a pair: the candidate that crosses the least
 * water and rock, or null where every one of them puts to sea
 */
function kindestLine(world: World, from: Town, to: Town): [x: number, y: number][] | null {
  let best: [x: number, y: number][] | null = null;
  let cheapest = Number.POSITIVE_INFINITY;

  for (let a = 0; a < ROUTE_TRIES; a++) {
    // Both ways round, since the warp only pushes one of them
    const sway = ((a / (ROUTE_TRIES - 1)) * 2 - 1) * 2;
    const line = curve(world, from, to, sway);

    if (crossesSea(world, line) > ROUTE_FORD) {
      continue;
    }

    const cost = roughness(world, line);

    if (cost < cheapest) {
      cheapest = cost;
      best = line;
    }
  }
  return best;
}

/**
 * The roads a region lays: east and south, so each pair is laid once
 * by the region on one side of it
 */
function routesFrom(world: World, regionX: number, regionY: number): Route[] {
  const from = townOfRegion(world, regionX, regionY);

  if (from == null) {
    return [];
  }

  const routes: Route[] = [];

  for (const [dx, dy] of [
    [ROUTE_REACH, 0],
    [0, ROUTE_REACH],
  ]) {
    const to = townOfRegion(world, regionX + dx, regionY + dy);

    if (to == null) {
      continue;
    }

    const line = kindestLine(world, from, to);

    if (line != null) {
      routes.push({ from, to, line });
    }
  }
  return routes;
}

/** Every road that could pass near a cell: this region's, and its neighbours' */
export function routesNear(world: World, x: number, y: number): Route[] {
  if (world.depth !== Depth.Surface) {
    return [];
  }

  const held = laid.get(world) ?? new Map<string, Route[]>();

  laid.set(world, held);

  const regionX = regionOfCell(x);
  const regionY = regionOfCell(y);
  const found: Route[] = [];

  // A road laid by the region west or north of this one still crosses
  // it, so both sides are asked
  for (let dy = -1; dy <= 0; dy++) {
    for (let dx = -1; dx <= 0; dx++) {
      const key = regionKey(regionX + dx, regionY + dy);
      const known = held.get(key) ?? routesFrom(world, regionX + dx, regionY + dy);

      held.set(key, known);
      found.push(...known);
    }
  }
  return found;
}

/**
 * How far a cell is from a leg of the line. Measured against the leg
 * rather than its ends, since the curve is sampled evenly in its own
 * parameter and not in cells: points alone left gaps in the paving
 * wherever two of them fell more than a width apart
 */
function nearSegment(
  x: number,
  y: number,
  from: [x: number, y: number],
  to: [x: number, y: number],
): number {
  const runX = to[0] - from[0];
  const runY = to[1] - from[1];
  const length = runX * runX + runY * runY;
  const along =
    length === 0
      ? 0
      : Math.max(0, Math.min(1, ((x - from[0]) * runX + (y - from[1]) * runY) / length));

  return Math.hypot(from[0] + runX * along - x, from[1] + runY * along - y);
}

/** One leg of a road, and the road it belongs to */
interface Leg {
  from: [x: number, y: number];
  to: [x: number, y: number];
  route: Route;
}

const legged = new WeakMap<World, Map<string, Leg[]>>();

/**
 * The legs that pass through a chunk, kept against it. Without this a
 * cell tests every leg of every road near it, which is five hundred
 * measurements to be told it is standing in a field
 */
function legsIn(world: World, chunkX: number, chunkY: number): Leg[] {
  const held = legged.get(world) ?? new Map<string, Leg[]>();

  legged.set(world, held);

  const key = `${chunkX},${chunkY}`;
  const known = held.get(key);

  if (known != null) {
    return known;
  }

  const left = chunkX * CHUNK_CELLS - ROUTE_WIDTH;
  const top = chunkY * CHUNK_CELLS - ROUTE_WIDTH;
  const right = left + CHUNK_CELLS + ROUTE_WIDTH * 2;
  const bottom = top + CHUNK_CELLS + ROUTE_WIDTH * 2;
  const legs: Leg[] = [];

  for (const route of routesNear(world, chunkX * CHUNK_CELLS, chunkY * CHUNK_CELLS)) {
    for (let at = 1; at < route.line.length; at++) {
      const from = route.line[at - 1];
      const to = route.line[at];

      // Its own box against the chunk's, which keeps a leg running
      // diagonally past a corner out of it
      if (
        Math.max(from[0], to[0]) >= left &&
        Math.min(from[0], to[0]) <= right &&
        Math.max(from[1], to[1]) >= top &&
        Math.min(from[1], to[1]) <= bottom
      ) {
        legs.push({ from, to, route });
      }
    }
  }
  held.set(key, legs);
  return legs;
}

/**
 * Whether a road runs over this cell. A town's own streets answer for
 * the ground inside it, so a route stops at the town's edge
 */
export function isRouteAt(world: World, x: number, y: number): boolean {
  if (world.depth !== Depth.Surface) {
    return false;
  }
  for (const leg of legsIn(world, Math.floor(x / CHUNK_CELLS), Math.floor(y / CHUNK_CELLS))) {
    if (nearSegment(x, y, leg.from, leg.to) > ROUTE_WIDTH) {
      continue;
    }
    // Inside either plaza the town's own streets take over
    if (
      Math.hypot(x - leg.route.from.x, y - leg.route.from.y) > TOWN_RADIUS &&
      Math.hypot(x - leg.route.to.x, y - leg.route.to.y) > TOWN_RADIUS
    ) {
      return true;
    }
  }
  return false;
}

/** How far a route's line reaches past its own region, in chunks */
export const ROUTE_MARGIN = Math.ceil(ROUTE_BEND / CHUNK_CELLS) + 1;
