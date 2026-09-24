import type { Moves } from '../../data/ids/moves';
import { FloorGate, FloorGimmick } from '../../data/overworld/dungeon';
import {
  DIRECTIONS,
  type Direction,
  type Door,
  DoorKind,
  type FloorPlan,
  doorBetween,
  neighbour,
} from './floor';

/** Where a player stands on a floor, and everything they changed on it */
export interface FloorState {
  at: number;
  /** Barrier floors: whether the second set is the open one */
  flipped: boolean;
  /** Keys picked up and not yet spent */
  keys: number;
  /** Locked doors a key has opened, by index */
  opened: number[];
  /** Rooms whose key or pass has been picked up */
  taken: number[];
  /** Cracked floors: rooms that have crumbled */
  crumbled: number[];
  pass: boolean;
  /** Rooms stopped in, which is what a dark or unmarked floor shows */
  seen: number[];
}

export function startFloor(floor: FloorPlan): FloorState {
  return enterRoom(floor, {
    at: floor.entry,
    flipped: false,
    keys: 0,
    opened: [],
    taken: [],
    crumbled: [],
    pass: false,
    seen: [],
  });
}

function withSorted(list: number[], value: number): number[] {
  return [...list, value].sort((a, b) => a - b);
}

/** What entering a room does, once the player has stopped in it */
function enterRoom(floor: FloorPlan, state: FloorState): FloorState {
  const room = floor.rooms[state.at];
  const next = {
    ...state,
    seen: state.seen.includes(state.at) ? state.seen : withSorted(state.seen, state.at),
  };

  if (room.switch === true) {
    next.flipped = !state.flipped;
  }
  if (!state.taken.includes(state.at) && (room.key === true || room.pass === true)) {
    next.taken = withSorted(state.taken, state.at);
    if (room.key === true) {
      next.keys += 1;
    }
    if (room.pass === true) {
      next.pass = true;
    }
  }
  return next;
}

/** Whether a door can be crossed from `from`, and whether it costs a key */
function crossing(
  door: Door,
  index: number,
  from: number,
  state: FloorState,
  known: ReadonlySet<Moves>,
): 'free' | 'key' | null {
  switch (door.kind) {
    case DoorKind.Open:
      return 'free';
    case DoorKind.Ledge:
      return door.to === from ? null : 'free';
    case DoorKind.Locked:
      if (state.opened.includes(index)) {
        return 'free';
      }
      return state.keys > 0 ? 'key' : null;
    case DoorKind.Obstacle:
      return door.move != null && known.has(door.move) ? 'free' : null;
    case DoorKind.Barrier:
      return (door.set === 1) === state.flipped ? 'free' : null;
  }
  return null;
}

/**
 * One move in a direction. Ice and spinners carry the player on, and
 * only the room they stop in is entered. Null when nothing moves
 */
export function step(
  floor: FloorPlan,
  state: FloorState,
  direction: Direction,
  known: ReadonlySet<Moves>,
): FloorState | null {
  let next = state;
  let heading = direction;
  let moved = false;

  // A loop of arrows would carry the player round forever
  for (let slid = 0; slid <= floor.rooms.length * 4; slid++) {
    const target = neighbour(floor.size, next.at, heading);
    const index = target < 0 ? -1 : doorBetween(floor, next.at, target);
    const cost = index < 0 ? null : crossing(floor.doors[index], index, next.at, next, known);

    if (
      cost == null ||
      (floor.gimmick === FloorGimmick.Cracked && next.crumbled.includes(target))
    ) {
      break;
    }
    next = {
      ...next,
      at: target,
      keys: cost === 'key' ? next.keys - 1 : next.keys,
      opened: cost === 'key' ? withSorted(next.opened, index) : next.opened,
      crumbled:
        floor.gimmick === FloorGimmick.Cracked ? withSorted(next.crumbled, next.at) : next.crumbled,
    };
    moved = true;

    const room = floor.rooms[target];

    if (floor.gimmick === FloorGimmick.Ice && room.rough !== true) {
      continue;
    }
    if (floor.gimmick === FloorGimmick.Spinner && room.arrow != null) {
      heading = room.arrow;
      continue;
    }
    break;
  }
  if (!moved) {
    return null;
  }

  const pad = floor.rooms[next.at].warp;

  if (pad != null) {
    next = { ...next, at: pad };
  }
  return enterRoom(floor, next);
}

/** Whether standing here lets the player take the stairs, gate aside */
export function atExit(floor: FloorPlan, state: FloorState): boolean {
  return state.at === floor.exit && (floor.gate !== FloorGate.Pass || state.pass);
}

function stateKey(state: FloorState): string {
  return `${state.at}|${state.flipped ? 1 : 0}|${state.keys}|${state.opened.join(',')}|${state.taken.join(',')}|${state.crumbled.join(',')}|${state.pass ? 1 : 0}`;
}

/** How many states a check may visit before calling a floor unsolvable */
const SEARCH_LIMIT = 50_000;

/**
 * Every state reachable from `from`, walked breadth first. Answers
 * null when the search runs past its limit
 */
export function explore(
  floor: FloorPlan,
  from: FloorState,
  known: ReadonlySet<Moves> = new Set(),
): FloorState[] | null {
  const seen = new Set([stateKey(from)]);
  const queue = [from];

  for (let at = 0; at < queue.length; at++) {
    for (const direction of DIRECTIONS) {
      const next = step(floor, queue[at], direction, known);

      if (next == null) {
        continue;
      }

      const key = stateKey(next);

      if (!seen.has(key)) {
        if (seen.size >= SEARCH_LIMIT) {
          return null;
        }
        seen.add(key);
        queue.push(next);
      }
    }
  }
  return queue;
}

/** Whether the stairs can be reached, with the gate's pass if it asks one */
export function canFinish(
  floor: FloorPlan,
  from: FloorState = startFloor(floor),
  known: ReadonlySet<Moves> = new Set(),
): boolean {
  const reached = explore(floor, from, known);

  if (reached == null) {
    return false;
  }
  for (const state of reached) {
    if (atExit(floor, state)) {
      return true;
    }
  }
  return false;
}

/** Every room some walk from the entry stops in */
export function reachableRooms(
  floor: FloorPlan,
  known: ReadonlySet<Moves> = new Set(),
): Set<number> {
  const rooms = new Set<number>();

  for (const state of explore(floor, startFloor(floor), known) ?? []) {
    rooms.add(state.at);
  }
  return rooms;
}
