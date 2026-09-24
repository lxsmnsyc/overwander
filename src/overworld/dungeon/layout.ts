import AleaRNG from '../../core/alea';
import DungeonKind, {
  DUNGEON_FLOORS,
  FLOOR_GIMMICKS,
  FLOOR_GIMMICK_WEIGHTS,
  FLOOR_SIGHTS,
  FLOOR_SIGHT_WEIGHTS,
  FloorGate,
  FloorGimmick,
  OBSTACLE_MOVES,
  floorSize,
} from '../../data/overworld/dungeon';
import {
  DIRECTIONS,
  type Door,
  DoorKind,
  type DungeonFloor,
  type FloorPlan,
  type Room,
  RoomKind,
  neighbour,
} from './floor';
import { canFinish, explore, reachableRooms, startFloor } from './walk';
import { type CellGrid, Thing, Tile, hasObstacles, lineOfSight, rasterize } from './grid';
import { solvable } from './tread';

/** A whole run's floors, first to last */
export interface DungeonLayout {
  kind: DungeonKind;
  floors: DungeonFloor[];
}

type Random = () => number;

function int(random: Random, count: number): number {
  return Math.floor(random() * count);
}

function pick<T>(random: Random, list: T[]): T {
  return list[int(random, list.length)];
}

function shuffled<T>(random: Random, list: T[]): T[] {
  const copy = [...list];

  for (let at = copy.length - 1; at > 0; at--) {
    const swap = int(random, at + 1);

    [copy[at], copy[swap]] = [copy[swap], copy[at]];
  }
  return copy;
}

function weighted<K extends number>(random: Random, keys: K[], weights: Record<K, number>): K {
  let total = 0;

  for (const key of keys) {
    total += weights[key];
  }

  let roll = random() * total;

  for (const key of keys) {
    roll -= weights[key];
    if (roll < 0) {
      return key;
    }
  }
  return keys[keys.length - 1];
}

/** The list without one entry */
function except<T>(list: Iterable<T>, left: T): T[] {
  const kept: T[] = [];

  for (const entry of list) {
    if (entry !== left) {
      kept.push(entry);
    }
  }
  return kept;
}

/** The rooms of `list` nothing has claimed yet, in order */
function unclaimed(list: Iterable<number>, claimed: Set<number>): number[] {
  const kept: number[] = [];

  for (const room of list) {
    if (!claimed.has(room)) {
      kept.push(room);
    }
  }
  return kept;
}

function openDoor(a: number, b: number): Door {
  return { a, b, kind: DoorKind.Open };
}

/** Every pair of side-by-side rooms among `rooms` */
function adjacencies(size: number, rooms: Set<number>): [number, number][] {
  const pairs: [number, number][] = [];

  for (const room of rooms) {
    for (const direction of DIRECTIONS) {
      const other = neighbour(size, room, direction);

      if (other > room && rooms.has(other)) {
        pairs.push([room, other]);
      }
    }
  }
  return pairs;
}

/** A spanning tree over `rooms`, carved by a random depth-first walk */
function maze(random: Random, size: number, rooms: Set<number>): Door[] {
  const doors: Door[] = [];
  const start = pick(random, [...rooms]);
  const seen = new Set([start]);
  const stack = [start];

  while (stack.length > 0) {
    const at = stack[stack.length - 1];
    const open: number[] = [];

    for (const direction of DIRECTIONS) {
      const other = neighbour(size, at, direction);

      if (other >= 0 && rooms.has(other) && !seen.has(other)) {
        open.push(other);
      }
    }
    if (open.length === 0) {
      stack.pop();
      continue;
    }

    const next = pick(random, open);

    seen.add(next);
    doors.push(openDoor(at, next));
    stack.push(next);
  }
  return doors;
}

/** A few extra doors on top of a tree, so there is more than one way round */
function addLoops(random: Random, size: number, doors: Door[], count: number): Door[] {
  const taken = new Set<number>();

  for (const door of doors) {
    taken.add(Math.min(door.a, door.b) * 64 + Math.max(door.a, door.b));
  }

  const all = new Set<number>();

  for (let room = 0; room < size * size; room++) {
    all.add(room);
  }

  const spare: [number, number][] = [];

  for (const [a, b] of adjacencies(size, all)) {
    if (!taken.has(a * 64 + b)) {
      spare.push([a, b]);
    }
  }

  const extra: Door[] = [];

  for (const [a, b] of shuffled(random, spare).slice(0, count)) {
    extra.push(openDoor(a, b));
  }
  return [...doors, ...extra];
}

/** Doors from each room, ignoring what kind of door they are */
function links(rooms: number, doors: Door[]): number[][] {
  const out: number[][] = [];

  for (let room = 0; room < rooms; room++) {
    out.push([]);
  }
  for (const door of doors) {
    out[door.a].push(door.b);
    out[door.b].push(door.a);
  }
  return out;
}

/** Door-count distance from `from` to every room, -1 where none leads */
function distances(rooms: number, doors: Door[], from: number): number[] {
  const graph = links(rooms, doors);
  const out: number[] = [];

  for (let room = 0; room < rooms; room++) {
    out.push(-1);
  }
  out[from] = 0;

  const queue = [from];

  for (let at = 0; at < queue.length; at++) {
    for (const other of graph[queue[at]]) {
      if (out[other] < 0) {
        out[other] = out[queue[at]] + 1;
        queue.push(other);
      }
    }
  }
  return out;
}

/** The rooms on the way from `from` to `to`, both included */
function pathBetween(rooms: number, doors: Door[], from: number, to: number): number[] {
  const back = distances(rooms, doors, to);
  const graph = links(rooms, doors);
  const path = [from];
  let at = from;

  while (at !== to && back[at] > 0) {
    let next = at;

    for (const other of graph[at]) {
      if (back[other] === back[at] - 1) {
        next = other;
        break;
      }
    }
    path.push(next);
    at = next;
  }
  return path;
}

/** The room farthest from `from`, which is where the stairs go */
function farthest(rooms: number, doors: Door[], from: number): number {
  const reach = distances(rooms, doors, from);
  let best = from;

  for (let room = 0; room < rooms; room++) {
    if (reach[room] > reach[best]) {
      best = room;
    }
  }
  return best;
}

/** Rooms a tree door leads to on the side away from `root` */
function subtree(rooms: number, doors: Door[], root: number, door: Door): Set<number> {
  const from = distances(rooms, doors, root);
  const child = from[door.a] > from[door.b] ? door.a : door.b;
  const graph = links(rooms, doors);
  const out = new Set([child]);
  const queue = [child];

  for (let at = 0; at < queue.length; at++) {
    for (const other of graph[queue[at]]) {
      if (from[other] > from[queue[at]] && !out.has(other)) {
        out.add(other);
        queue.push(other);
      }
    }
  }
  return out;
}

interface Draft {
  size: number;
  doors: Door[];
  rooms: Room[];
  entry: number;
  exit: number;
  /** Rooms a gimmick has claimed, which get no content */
  claimed: Set<number>;
}

function emptyRooms(count: number): Room[] {
  const rooms: Room[] = [];

  for (let room = 0; room < count; room++) {
    rooms.push({ kind: RoomKind.Empty });
  }
  return rooms;
}

function allRooms(size: number): Set<number> {
  const rooms = new Set<number>();

  for (let room = 0; room < size * size; room++) {
    rooms.add(room);
  }
  return rooms;
}

/** A tree, an entry on the bottom row and the stairs as far away as it gets */
function treeDraft(random: Random, size: number, loops: number): Draft {
  const count = size * size;
  const doors = addLoops(random, size, maze(random, size, allRooms(size)), loops);
  const entry = (size - 1) * size + int(random, size);

  return {
    size,
    doors,
    rooms: emptyRooms(count),
    entry,
    exit: farthest(count, doors, entry),
    claimed: new Set(),
  };
}

/** A free room off the way through, falling back to any free room */
function sideRoom(random: Random, draft: Draft, among: Iterable<number>): number | null {
  const path = new Set(pathBetween(draft.rooms.length, draft.doors, draft.entry, draft.exit));
  const free: number[] = [];
  const off: number[] = [];

  for (const room of among) {
    if (room === draft.entry || room === draft.exit || draft.claimed.has(room)) {
      continue;
    }
    free.push(room);
    if (!path.has(room)) {
      off.push(room);
    }
  }
  if (off.length > 0) {
    return pick(random, off);
  }
  return free.length > 0 ? pick(random, free) : null;
}

/** The rooms reachable from the entry without crossing `door` */
function entrySide(draft: Draft, door: Door): Set<number> {
  const kept = except(draft.doors, door);
  const reach = distances(draft.rooms.length, kept, draft.entry);
  const side = new Set<number>();

  for (let room = 0; room < reach.length; room++) {
    if (reach[room] >= 0) {
      side.add(room);
    }
  }
  return side;
}

function doorOnPath(draft: Draft, path: number[], at: number): Door {
  return draft.doors[doorBetweenDraft(draft, path[at], path[at + 1])];
}

function doorBetweenDraft(draft: Draft, a: number, b: number): number {
  for (let at = 0; at < draft.doors.length; at++) {
    const door = draft.doors[at];

    if ((door.a === a && door.b === b) || (door.a === b && door.b === a)) {
      return at;
    }
  }
  return -1;
}

function spinners(random: Random, size: number): Draft {
  const draft = treeDraft(random, size, Math.ceil(size * size * 0.2));
  const graph = links(draft.rooms.length, draft.doors);
  const count = Math.max(2, Math.floor(draft.rooms.length / 4));

  for (const room of shuffled(random, [...draft.rooms.keys()]).slice(0, count)) {
    if (room === draft.entry || room === draft.exit) {
      continue;
    }

    const ways = [];

    for (const direction of DIRECTIONS) {
      if (graph[room].includes(neighbour(size, room, direction))) {
        ways.push(direction);
      }
    }
    if (ways.length > 0) {
      draft.rooms[room].arrow = pick(random, ways);
      draft.claimed.add(room);
    }
  }
  return draft;
}

/** Islands of columns joined only by pads, entry in the first, stairs in the last */
function warps(random: Random, size: number): Draft | null {
  const islands = size >= 4 ? 3 : 2;
  const cuts: number[] = [0];

  for (let island = 1; island < islands; island++) {
    cuts.push(Math.round((island * size) / islands));
  }
  cuts.push(size);

  const bands: Set<number>[] = [];
  let doors: Door[] = [];

  for (let band = 0; band < islands; band++) {
    const rooms = new Set<number>();

    for (let y = 0; y < size; y++) {
      for (let x = cuts[band]; x < cuts[band + 1]; x++) {
        rooms.add(y * size + x);
      }
    }
    bands.push(rooms);
    doors = [...doors, ...maze(random, size, rooms)];
  }

  const count = size * size;
  const entry = pick(random, [...bands[0]]);
  const draft: Draft = {
    size,
    doors,
    rooms: emptyRooms(count),
    entry,
    exit: pick(random, [...bands[islands - 1]]),
    claimed: new Set(),
  };
  const pad = (room: number, to: number): void => {
    draft.rooms[room].warp = to;
    draft.rooms[to].warp = room;
    draft.claimed.add(room).add(to);
  };

  for (let band = 0; band < islands - 1; band++) {
    const from = sideRoom(random, draft, bands[band]);
    const to = sideRoom(random, draft, bands[band + 1]);

    if (from == null || to == null) {
      return draft;
    }
    pad(from, to);
  }

  // One pair that leads nowhere new, so a pad is not always progress
  const decoyBand = pick(random, bands);
  const decoy = sideRoom(random, draft, decoyBand);

  if (decoy != null) {
    const partner = sideRoom(random, draft, except(decoyBand, decoy));

    if (partner != null) {
      pad(decoy, partner);
    }
  }
  // The stairs sit as far as their island allows from the pad into it
  let landing = draft.exit;

  for (const room of bands[islands - 1]) {
    if (draft.claimed.has(room)) {
      landing = room;
    }
  }
  draft.exit = farthest(count, draft.doors, landing);
  return draft.claimed.has(draft.exit) ? null : draft;
}

/** An open floor with a few walls, and rough ground that stops a slide */
function ice(random: Random, size: number): Draft {
  const count = size * size;
  let doors: Door[] = [];

  for (const [a, b] of adjacencies(size, allRooms(size))) {
    doors.push(openDoor(a, b));
  }
  for (const door of shuffled(random, doors).slice(0, Math.floor(doors.length * 0.3))) {
    const kept = except(doors, door);

    if (!distances(count, kept, 0).includes(-1)) {
      doors = kept;
    }
  }

  const entry = (size - 1) * size + int(random, size);
  const draft: Draft = {
    size,
    doors,
    rooms: emptyRooms(count),
    entry,
    exit: farthest(count, doors, entry),
    claimed: new Set(),
  };

  for (let room = 0; room < count; room++) {
    if (room === draft.exit || random() < 0.25) {
      draft.rooms[room].rough = true;
    }
  }
  return draft;
}

function obstacles(random: Random, size: number): Draft {
  const draft = treeDraft(random, size, 0);
  const count = draft.rooms.length;
  const path = new Set(pathBetween(count, draft.doors, draft.entry, draft.exit));
  const leaving: Door[] = [];

  for (const door of draft.doors) {
    if (path.has(door.a) !== path.has(door.b)) {
      leaving.push(door);
    }
  }

  const branches = shuffled(random, leaving);

  // Off the way through, so the stairs never need a move
  for (const door of branches.slice(0, Math.max(1, Math.floor(size / 2)))) {
    door.kind = DoorKind.Obstacle;
    door.move = pick(random, [...OBSTACLE_MOVES]);

    const behind = subtree(count, draft.doors, draft.entry, door);
    const prize = sideRoom(random, draft, behind);

    if (prize != null) {
      draft.rooms[prize].kind = RoomKind.Stash;
      draft.claimed.add(prize);
    }
  }
  return draft;
}

function lockedDoors(random: Random, size: number): Draft {
  const draft = treeDraft(random, size, 0);
  const path = pathBetween(draft.rooms.length, draft.doors, draft.entry, draft.exit);

  if (path.length < 3) {
    return draft;
  }

  const door = doorOnPath(draft, path, 1 + int(random, path.length - 2));
  const key = sideRoom(random, draft, entrySide(draft, door));

  door.kind = DoorKind.Locked;
  if (key != null) {
    draft.rooms[key].key = true;
    draft.claimed.add(key);
  }
  return draft;
}

function barriers(random: Random, size: number): Draft {
  const draft = treeDraft(random, size, 0);
  const path = pathBetween(draft.rooms.length, draft.doors, draft.entry, draft.exit);

  if (path.length < 3) {
    return draft;
  }

  const first = 1 + int(random, path.length - 2);
  const closed = doorOnPath(draft, path, first);
  const flip = sideRoom(random, draft, entrySide(draft, closed));

  closed.kind = DoorKind.Barrier;
  closed.set = 1;
  if (flip != null) {
    draft.rooms[flip].switch = true;
    draft.claimed.add(flip);
  }

  // A second barrier further on, open until the first flip closes it,
  // with its own switch between the two
  if (first + 2 < path.length - 1) {
    const second = first + 1 + int(random, path.length - first - 2);
    const later = doorOnPath(draft, path, second);
    const between = unclaimed(path.slice(first + 1, second + 1), draft.claimed);

    if (between.length > 0) {
      later.kind = DoorKind.Barrier;
      later.set = 0;

      const room = pick(random, between);

      draft.rooms[room].switch = true;
      draft.claimed.add(room);
    }
  }
  return draft;
}

function ledges(random: Random, size: number): Draft {
  const draft = treeDraft(random, size, Math.ceil(size * size * 0.2));
  const down = distances(draft.rooms.length, draft.doors, draft.exit);

  // Always falling towards the stairs, so no drop strands anybody
  for (const door of draft.doors) {
    if (down[door.a] !== down[door.b] && random() < 0.4) {
      door.kind = DoorKind.Ledge;
      door.to = down[door.a] < down[door.b] ? door.a : door.b;
    }
  }
  return draft;
}

const BUILDERS: Record<FloorGimmick, (random: Random, size: number) => Draft | null> = {
  [FloorGimmick.Spinner]: spinners,
  [FloorGimmick.Warp]: warps,
  [FloorGimmick.Ice]: ice,
  [FloorGimmick.Cracked]: (random, size) => treeDraft(random, size, 1),
  [FloorGimmick.FieldMoves]: obstacles,
  [FloorGimmick.LockedDoors]: lockedDoors,
  [FloorGimmick.Barriers]: barriers,
  [FloorGimmick.Ledges]: ledges,
};

const GATE_WEIGHTS: Record<FloorGate.Guard | FloorGate.Pass, number> = {
  [FloorGate.Guard]: 2,
  [FloorGate.Pass]: 1,
};

/** Foes and stashes in the rooms nothing else took */
function furnish(random: Random, floor: FloorPlan, claimed: Set<number>): boolean {
  const reach = reachableRooms(floor);
  const free = shuffled(
    random,
    unclaimed(except(except(floor.rooms.keys(), floor.entry), floor.exit), claimed),
  );
  const reachable: number[] = [];

  for (const room of free) {
    if (reach.has(room)) {
      reachable.push(room);
    }
  }

  const take = (list: number[]): number | null => {
    const open = unclaimed(list, claimed);

    if (open.length === 0) {
      return null;
    }

    const room = open[0];
    claimed.add(room);
    return room;
  };

  if (floor.gate === FloorGate.Pass) {
    const room = take(reachable);

    if (room == null) {
      return false;
    }
    floor.rooms[room].pass = true;
  }
  const count = floor.rooms.length;

  for (let trainer = 0; trainer < Math.floor(count / 4); trainer++) {
    const room = take(free);

    if (room != null) {
      floor.rooms[room].kind = RoomKind.Trainer;
    }
  }
  for (let stash = 0; stash < Math.max(1, Math.floor(count / 6)); stash++) {
    const room = take(free);

    if (room != null) {
      floor.rooms[room].kind = RoomKind.Stash;
    }
  }
  return true;
}

/** A drop between rooms can cost rooms, never the stairs */
function ledgesNeverStrand(floor: FloorPlan): boolean {
  for (const state of explore(floor, startFloor(floor)) ?? []) {
    if (!canFinish(floor, state)) {
      return false;
    }
  }
  return true;
}

function mappedFloor(
  kind: DungeonKind.Hideout | DungeonKind.Dungeon,
  random: Random,
  depth: number,
  last: boolean,
): DungeonFloor | null {
  const gimmick = weighted(random, FLOOR_GIMMICKS, FLOOR_GIMMICK_WEIGHTS[kind]);
  const sight = weighted(random, FLOOR_SIGHTS, FLOOR_SIGHT_WEIGHTS[kind]);
  const draft = BUILDERS[gimmick](random, floorSize(depth));

  if (draft == null) {
    return null;
  }
  draft.rooms[draft.entry].kind = RoomKind.Entry;
  draft.rooms[draft.exit].kind = last ? RoomKind.Boss : RoomKind.Stairs;

  const floor: FloorPlan = {
    depth,
    size: draft.size,
    rooms: draft.rooms,
    doors: draft.doors,
    entry: draft.entry,
    exit: draft.exit,
    gimmick,
    sight,
    gate: last ? FloorGate.Boss : weighted(random, [FloorGate.Guard, FloorGate.Pass], GATE_WEIGHTS),
  };

  if (!furnish(random, floor, draft.claimed)) {
    return null;
  }

  const grid = lineOfSight(rasterize(floor, kind));

  return solvable(grid, floor.gate === FloorGate.Pass) && gridHolds(floor, grid)
    ? { ...floor, grid }
    : null;
}

/** The grid with every one of a thing gone, or every pad taken up */
function stripped(grid: CellGrid, what: Thing | 'pads'): CellGrid {
  if (what === 'pads') {
    return { ...grid, pads: new Map() };
  }

  const things = new Map<number, Thing>();

  for (const [cell, thing] of grid.things) {
    if (thing !== what) {
      things.set(cell, thing);
    }
  }
  return { ...grid, things };
}

function hasTile(grid: CellGrid, tile: Tile): boolean {
  for (const one of grid.tiles) {
    if (one === tile) {
      return true;
    }
  }
  return false;
}

/** Everything the gimmick is meant to force, walked cell by cell */
function gridHolds(floor: FloorPlan, grid: CellGrid): boolean {
  const pass = floor.gate === FloorGate.Pass;

  switch (floor.gimmick) {
    case FloorGimmick.Warp:
      return !solvable(stripped(grid, 'pads'), pass);
    case FloorGimmick.LockedDoors:
      return !solvable(stripped(grid, Thing.Key), pass);
    case FloorGimmick.Barriers:
      return !solvable(stripped(grid, Thing.Switch), pass);
    case FloorGimmick.FieldMoves:
      return hasObstacles(grid);
    case FloorGimmick.Spinner:
      return hasTile(grid, Tile.Spinner);
    case FloorGimmick.Ledges:
      return hasTile(grid, Tile.Ledge) && ledgesNeverStrand(floor);
    default:
      return true;
  }
}

/** A Frontier floor is one fight in one room, the way on behind it */
function towerFloor(depth: number, last: boolean): DungeonFloor {
  const plan: FloorPlan = {
    depth,
    size: 1,
    rooms: [{ kind: last ? RoomKind.Boss : RoomKind.Stairs }],
    doors: [],
    entry: 0,
    exit: 0,
    gimmick: null,
    sight: null,
    gate: last ? FloorGate.Boss : FloorGate.Guard,
  };

  return { ...plan, grid: lineOfSight(rasterize(plan, DungeonKind.Frontier)) };
}

/** How many tries a floor gets before it settles for a plain maze */
const FLOOR_TRIES = 64;

export function generateFloor(
  kind: DungeonKind,
  seed: string,
  depth: number,
  last: boolean,
): DungeonFloor {
  if (kind === DungeonKind.Frontier) {
    return towerFloor(depth, last);
  }
  for (let attempt = 0; attempt < FLOOR_TRIES; attempt++) {
    const rng = new AleaRNG(`${seed}floor${depth}try${attempt}`);
    const floor = mappedFloor(kind, () => rng.random(), depth, last);

    if (floor != null) {
      return floor;
    }
  }
  throw new Error(`No floor ${depth} for dungeon ${seed}`);
}

/** Dungeons already laid out, since checking every floor cell by cell is slow */
const LAID = new Map<string, DungeonLayout>();

/** How many laid-out dungeons are kept */
const LAID_LIMIT = 64;

/** Every floor of one dungeon for one window, from its seed */
export function generateDungeon(kind: DungeonKind, seed: string): DungeonLayout {
  const key = `${kind}:${seed}`;
  const held = LAID.get(key);

  if (held != null) {
    return held;
  }

  const layout = layDungeon(kind, seed);

  if (LAID.size >= LAID_LIMIT) {
    const [oldest] = LAID.keys();

    LAID.delete(oldest);
  }
  LAID.set(key, layout);
  return layout;
}

function layDungeon(kind: DungeonKind, seed: string): DungeonLayout {
  const rng = new AleaRNG(`${seed}floors`);
  const [min, max] = DUNGEON_FLOORS[kind];
  const count = min + Math.floor(rng.random() * (max - min + 1));
  const floors: DungeonFloor[] = [];

  for (let depth = 0; depth < count; depth++) {
    floors.push(generateFloor(kind, seed, depth, depth === count - 1));
  }
  return { kind, floors };
}
