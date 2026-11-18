import AleaRNG from '../../core/alea';
import { toZoneKey } from '../../model/local-time';
import { fitsSurface } from '../../data/biome';
import { SpawnSurface } from '../../data/ids/biome';
import type Chunk from '../chunk';
import { CHUNK_CELLS, SURROUNDING } from '../grid';
import { HOUR, type LiveSpawn } from './index';
import ChunkSnapshot from '../chunk-snapshot';

/** A pokemon picks a new waypoint this often */
export const WAYPOINT_MS = 5_000;

/** How far, in steps from its start cell, a pokemon of the country strays */
export const LEASH_CELLS = 4;

/** The same for a pokemon of a town's streets */
export const TOWN_LEASH_CELLS = 2;

/** How long one step takes: twice a player's */
export const STEP_MS = 500;

/** A pause before the walk of each waypoint, at most */
export const WALK_DELAY_MAX = 1_000;

/** Waypoints looked back through for the way a standing pokemon last faced */
const HEADING_LOOKBACK = 6;

/** Where a pokemon stands, and heads, at one instant */
export interface RoamPosition {
  /** The chunk cell it is nearest */
  cell: number;
  /** How far it is from that cell's middle, in cells, each between -0.5 and 0.5 */
  dx: number;
  dy: number;
  /** The step it last took or is taking, each of -1, 0 and 1; null before its first */
  heading: [x: number, y: number] | null;
  /** Whether it is between two cells */
  moving: boolean;
  /** How long into this walk it is in milliseconds, 0 while it stands */
  walked: number;
}

/** The cells a pokemon may walk, with the routes between them kept once found */
export interface RoamArea {
  /** The start cell first, then the rest in the order they were reached */
  cells: number[];
  /** Whether a cell is in the area */
  open: Set<number>;
  /** Shortest routes by `from * CELL_COUNT + to`, each with both ends */
  routes: Map<number, number[]>;
}

/** The most the areas, memoised, may hold before they start over */
const AREA_LIMIT = 1024;
const ROUTE_LIMIT = 256;

const areas = new Map<string, RoamArea>();
const walks = new Map<string, { target: number; delay: number }>();

const hours = new Map<string, Set<number>>();

/**
 * The cells an hour holds closed in a chunk: its furniture, rock, face,
 * lava and the hour's phenomena. Memoised per chunk key and hour
 */
export function getHourClosed(chunk: Chunk, offset: number, hour: number): Set<number> {
  const memo = `${chunk.seed}${toZoneKey(offset)}@${hour}`;
  const held = hours.get(memo);

  if (held != null) {
    return held;
  }
  if (hours.size >= AREA_LIMIT) {
    hours.clear();
  }

  // The phenomena that hold ground are the hour's own, so the hour's start is asked
  const closed = new ChunkSnapshot(chunk, hour * HOUR, offset).getClosedCells();

  hours.set(memo, closed);
  return closed;
}

/** The chunk's key, which a spawn id starts with */
function getChunkKey(live: LiveSpawn): string {
  return live.id.slice(0, live.id.lastIndexOf('@'));
}

const SURFACES = [SpawnSurface.Land, SpawnSurface.Water, SpawnSurface.Ice];

/** Which of the three surfaces a species stands on, as bits */
function getHabitat(live: LiveSpawn): number {
  let habitat = 0;

  for (const surface of SURFACES) {
    if (fitsSurface(live.spawn[0], surface)) {
      habitat |= 1 << surface;
    }
  }
  return habitat;
}

/** The cell one step on, or null when that leaves the chunk */
function stepFrom(cell: number, dx: number, dy: number): number | null {
  const x = (cell % CHUNK_CELLS) + dx;
  const y = Math.floor(cell / CHUNK_CELLS) + dy;

  return x < 0 || y < 0 || x >= CHUNK_CELLS || y >= CHUNK_CELLS ? null : y * CHUNK_CELLS + x;
}

/**
 * The cells one step from `cell` that `open` allows, in a fixed order.
 * A diagonal does not cut a corner: both cells beside it must be open
 */
function findNeighbors(cell: number, open: (cell: number) => boolean): number[] {
  const found: number[] = [];

  for (const [dx, dy] of SURROUNDING) {
    const next = stepFrom(cell, dx, dy);

    if (next == null || !open(next)) {
      continue;
    }
    if (dx !== 0 && dy !== 0) {
      const across = stepFrom(cell, dx, 0);
      const along = stepFrom(cell, 0, dy);

      if (across == null || along == null || !open(across) || !open(along)) {
        continue;
      }
    }
    found.push(next);
  }
  return found;
}

/**
 * The cells a pokemon may walk: a flood fill from its start cell, at
 * most the leash away, over cells that its hour's ground leaves open
 * and that its species stands on. Memoised per chunk key, hour, home and
 * habitat. It stays inside its own chunk
 */
export function getRoamArea(chunk: Chunk, offset: number, live: LiveSpawn): RoamArea {
  const chunkKey = getChunkKey(live);
  const street = live.kind === 'street';
  const habitat = getHabitat(live);
  const hour = Math.floor(live.cycle.start / HOUR);
  const memo = `${chunkKey}@${hour}:${live.home}:${habitat}:${street ? 1 : 0}`;
  const held = areas.get(memo);

  if (held != null) {
    return held;
  }

  // The ground the start cell was drawn from, cut to the species' own
  // surfaces and to the streets or the country
  const closed = getHourClosed(chunk, offset, hour);
  const isOpen = (cell: number): boolean =>
    !closed.has(cell) &&
    chunk.isTownCell(cell) === street &&
    fitsSurface(live.spawn[0], chunk.getCellSurface(cell));

  // Breadth first, so the order is by distance and then by the fixed
  // neighbour order
  const leash = street ? TOWN_LEASH_CELLS : LEASH_CELLS;
  const cells = [live.home];
  const open = new Set(cells);
  let depth = 0;
  let frontier = [live.home];

  while (depth < leash && frontier.length > 0) {
    const next: number[] = [];

    for (const cell of frontier) {
      for (const found of findNeighbors(cell, isOpen)) {
        if (!open.has(found)) {
          open.add(found);
          cells.push(found);
          next.push(found);
        }
      }
    }
    frontier = next;
    depth++;
  }

  if (areas.size >= AREA_LIMIT) {
    areas.clear();
  }

  const area = { cells, open, routes: new Map<number, number[]>() };

  areas.set(memo, area);
  return area;
}

/** The shortest route inside the area, both ends included */
function findRoute(area: RoamArea, from: number, to: number): number[] {
  const memo = from * CHUNK_CELLS * CHUNK_CELLS + to;
  const held = area.routes.get(memo);

  if (held != null) {
    return held;
  }

  // Breadth first from `from`, the first way found to a cell being kept
  const parents = new Map<number, number>();
  const queue = [from];

  parents.set(from, from);
  for (let at = 0; at < queue.length && !parents.has(to); at++) {
    for (const found of findNeighbors(queue[at], (cell) => area.open.has(cell))) {
      if (!parents.has(found)) {
        parents.set(found, queue[at]);
        queue.push(found);
      }
    }
  }

  const route = [to];

  while (route[0] !== from && parents.has(route[0])) {
    route.unshift(parents.get(route[0]) ?? from);
  }
  // A cell the area cannot reach is stood on rather than walked to
  const found = route[0] === from ? route : [from];

  if (area.routes.size >= ROUTE_LIMIT) {
    area.routes.clear();
  }
  area.routes.set(memo, found);
  return found;
}

/** Where waypoint `epoch` is, and how long the pokemon waits before walking to it */
function drawWalk(
  area: RoamArea,
  live: LiveSpawn,
  epoch: number,
): { target: number; delay: number } {
  const memo = `${live.id}:${epoch}`;
  const held = walks.get(memo);

  if (held != null) {
    return held;
  }

  // The target never depends on the one before it, so there is no chain to replay
  const rng = new AleaRNG(
    `${getChunkKey(live)}slot${live.slot}cycle${live.cycle.cycle}walk${epoch}`,
  );
  const target = area.cells[Math.floor(rng.random() * area.cells.length)];
  const delay = Math.floor(rng.random() * WALK_DELAY_MAX);

  if (walks.size >= AREA_LIMIT * 4) {
    walks.clear();
  }

  const drawn = { target, delay };

  walks.set(memo, drawn);
  return drawn;
}

/** The step between two neighbouring cells, each of -1, 0 and 1 */
function getStep(from: number, to: number): [x: number, y: number] {
  return [
    Math.sign((to % CHUNK_CELLS) - (from % CHUNK_CELLS)),
    Math.sign(Math.floor(to / CHUNK_CELLS) - Math.floor(from / CHUNK_CELLS)),
  ];
}

/** The target of waypoint `epoch`, the start cell before the first */
function getTarget(area: RoamArea, live: LiveSpawn, epoch: number): number {
  return epoch < 0 ? live.home : drawWalk(area, live, epoch).target;
}

/**
 * The way the last step of the walks up to `epoch` went, looking back a
 * few waypoints when a walk was no step at all
 */
function findHeading(
  area: RoamArea,
  live: LiveSpawn,
  epoch: number,
  taken: number,
): [x: number, y: number] | null {
  for (let at = epoch; at >= Math.max(0, epoch - HEADING_LOOKBACK); at--) {
    const route = findRoute(area, getTarget(area, live, at - 1), getTarget(area, live, at));
    // The current walk counts only the steps already taken
    const upTo = at === epoch ? Math.min(taken, route.length - 1) : route.length - 1;

    if (upTo > 0) {
      return getStep(route[upTo - 1], route[upTo]);
    }
  }
  return null;
}

/**
 * Where a pokemon stands at `time`, a pure function of its cycle: the
 * waypoint of the 5 s epoch is drawn from the cycle's own seed, and the
 * pokemon walks the shortest route from the last waypoint to it,
 * one step every 500 ms after a pause. A walk is at most 8 steps and
 * 1 s of pause, so it ends inside its epoch
 */
export function positionAt(area: RoamArea, live: LiveSpawn, time: number): RoamPosition {
  // Before its cycle begins, and in the drift after it ends, it stays where it was
  const epoch = Math.floor((time - live.cycle.start) / WAYPOINT_MS);

  if (epoch < 0) {
    return { cell: live.home, dx: 0, dy: 0, heading: null, moving: false, walked: 0 };
  }

  // The walk of this epoch, from the last waypoint to this one
  const from = getTarget(area, live, epoch - 1);
  const route = findRoute(area, from, getTarget(area, live, epoch));
  const waited = time - live.cycle.start - epoch * WAYPOINT_MS - drawWalk(area, live, epoch).delay;
  const steps = route.length - 1;
  const taken = waited < 0 ? 0 : Math.min(steps, Math.floor(waited / STEP_MS));

  // Standing: before the walk starts, or at its end
  if (waited < 0 || taken >= steps) {
    const heading = findHeading(area, live, epoch, taken);

    return { cell: route[taken], dx: 0, dy: 0, heading, moving: false, walked: 0 };
  }

  // Between two cells: it belongs to the nearer one, and is drawn off its middle
  const fraction = (waited - taken * STEP_MS) / STEP_MS;
  const [sx, sy] = getStep(route[taken], route[taken + 1]);
  const heading: [number, number] = [sx, sy];

  if (fraction < 0.5) {
    return {
      cell: route[taken],
      dx: sx * fraction,
      dy: sy * fraction,
      heading,
      moving: true,
      walked: waited,
    };
  }
  return {
    cell: route[taken + 1],
    dx: -sx * (1 - fraction),
    dy: -sy * (1 - fraction),
    heading,
    moving: true,
    walked: waited,
  };
}
