import type {
  FloorGate,
  FloorGimmick,
  FloorSight,
  ObstacleMove,
} from '../../data/overworld/dungeon';
import type { CellGrid } from './grid';

/** Up, right, down, left, in grid terms */
export const enum Direction {
  North = 0,
  East = 1,
  South = 2,
  West = 3,
}

export const DIRECTIONS = [Direction.North, Direction.East, Direction.South, Direction.West];

const DX = [0, 1, 0, -1];
const DY = [-1, 0, 1, 0];

/** What a room holds, as far as entering it goes */
export const enum RoomKind {
  Empty = 0,
  Entry = 1,
  Stairs = 2,
  Trainer = 3,
  Stash = 4,
  Boss = 5,
}

export interface Room {
  kind: RoomKind;
  /** Spinner floors: the way this room sends the player on */
  arrow?: Direction;
  /** Warp floors: the room this pad sends the player to */
  warp?: number;
  /** Barrier floors: entering flips which barriers are open */
  switch?: true;
  /** Locked-door floors: a key lies here */
  key?: true;
  /** Pass-gated floors: the pass lies here */
  pass?: true;
  /** Ice floors: rough ground that stops a slide */
  rough?: true;
}

export const enum DoorKind {
  Open = 0,
  /** Crossed only towards `to` */
  Ledge = 1,
  /** Opened for good by spending a key */
  Locked = 2,
  /** Cleared by a party member that knows `move` */
  Obstacle = 3,
  /** Open while its set is the open one */
  Barrier = 4,
}

export interface Door {
  a: number;
  b: number;
  kind: DoorKind;
  to?: number;
  move?: ObstacleMove;
  /** Barrier set: 0 is open until the first flip, 1 after it */
  set?: 0 | 1;
}

export interface DungeonFloor {
  /** 0 for the first floor */
  depth: number;
  size: number;
  rooms: Room[];
  doors: Door[];
  entry: number;
  exit: number;
  gimmick: FloorGimmick | null;
  sight: FloorSight | null;
  gate: FloorGate;
  /** The plan laid out in cells, which is what is walked */
  grid: CellGrid;
}

/** A floor before it is laid out in cells */
export type FloorPlan = Omit<DungeonFloor, 'grid'>;

/** The room one step away, or -1 past the edge */
export function neighbour(size: number, room: number, direction: Direction): number {
  const x = (room % size) + DX[direction];
  const y = Math.floor(room / size) + DY[direction];

  return x < 0 || y < 0 || x >= size || y >= size ? -1 : y * size + x;
}

const DOOR_INDEX = new WeakMap<FloorPlan, Map<number, number>>();

function pairKey(a: number, b: number): number {
  return Math.min(a, b) * 64 + Math.max(a, b);
}

/** Index into `floor.doors` of the door between two rooms, or -1 */
export function doorBetween(floor: FloorPlan, a: number, b: number): number {
  let index = DOOR_INDEX.get(floor);

  if (index == null) {
    index = new Map();
    for (let at = 0; at < floor.doors.length; at++) {
      index.set(pairKey(floor.doors[at].a, floor.doors[at].b), at);
    }
    DOOR_INDEX.set(floor, index);
  }
  return index.get(pairKey(a, b)) ?? -1;
}
