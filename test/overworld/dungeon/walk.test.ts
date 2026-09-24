import { describe, expect, it } from 'vitest';
import { Moves } from '../../../src/data/ids/moves';
import { FloorGate, FloorGimmick, FloorSight } from '../../../src/data/overworld/dungeon';
import {
  Direction,
  type Door,
  DoorKind,
  type DungeonFloor,
  type Room,
  RoomKind,
} from '../../../src/overworld/dungeon/floor';
import { atExit, startFloor, step } from '../../../src/overworld/dungeon/walk';

const NOTHING = new Set<Moves>();

/**
 * A 3x3 floor with every neighbour joined, entry bottom-left (6) and
 * stairs top-right (2), before anything is changed on it
 */
function floorOf(
  gimmick: FloorGimmick,
  rooms: Partial<Record<number, Partial<Room>>> = {},
  doors: Partial<Record<string, Partial<Door>>> = {},
): DungeonFloor {
  const all: Room[] = [];

  for (let room = 0; room < 9; room++) {
    all.push({ kind: RoomKind.Empty, ...rooms[room] });
  }
  all[6].kind = RoomKind.Entry;
  all[2].kind = RoomKind.Stairs;

  const joined: Door[] = [];

  for (let room = 0; room < 9; room++) {
    for (const other of [room + 1, room + 3]) {
      if (other < 9 && (other !== room + 1 || room % 3 !== 2)) {
        joined.push({ a: room, b: other, kind: DoorKind.Open, ...doors[`${room}-${other}`] });
      }
    }
  }
  return {
    depth: 0,
    size: 3,
    rooms: all,
    doors: joined,
    entry: 6,
    exit: 2,
    gimmick,
    sight: FloorSight.Plain,
    gate: FloorGate.Guard,
  };
}

describe('walking a floor', () => {
  it('slides across ice until a wall or rough ground stops it', () => {
    const floor = floorOf(FloorGimmick.Ice, { 7: { rough: true } });
    const start = startFloor(floor);

    // Right from the entry: one room of rough ground, and it stops there
    expect(step(floor, start, Direction.East, NOTHING)?.at).toBe(7);
    // Up from the entry: all the way to the wall
    expect(step(floor, start, Direction.North, NOTHING)?.at).toBe(0);
  });

  it('sends a spinner on in its arrow, skipping what it passes', () => {
    const floor = floorOf(FloorGimmick.Spinner, { 3: { arrow: Direction.East } });
    const moved = step(floor, startFloor(floor), Direction.North, NOTHING);

    // Onto the arrow, and on to the middle, which is the room stopped in
    expect(moved?.at).toBe(4);
    expect(moved?.seen).not.toContain(3);
  });

  it('carries a pad to its pair', () => {
    const floor = floorOf(FloorGimmick.Warp, { 7: { warp: 1 }, 1: { warp: 7 } });

    expect(step(floor, startFloor(floor), Direction.East, NOTHING)?.at).toBe(1);
  });

  it('crumbles a cracked room behind the player', () => {
    const floor = floorOf(FloorGimmick.Cracked);
    const moved = step(floor, startFloor(floor), Direction.East, NOTHING);

    expect(moved?.crumbled).toContain(6);
    expect(moved == null ? null : step(floor, moved, Direction.West, NOTHING)).toBeNull();
  });

  it('opens a locked door with a key found on the floor, once', () => {
    const floor = floorOf(
      FloorGimmick.LockedDoors,
      { 7: { key: true } },
      { '6-7': {}, '3-6': { kind: DoorKind.Locked } },
    );
    const start = startFloor(floor);

    // No key yet
    expect(step(floor, start, Direction.North, NOTHING)).toBeNull();

    const keyed = step(floor, start, Direction.East, NOTHING);

    expect(keyed?.keys).toBe(1);

    const back = keyed == null ? null : step(floor, keyed, Direction.West, NOTHING);
    const through = back == null ? null : step(floor, back, Direction.North, NOTHING);

    expect(through?.at).toBe(3);
    expect(through?.keys).toBe(0);
    expect(through?.opened.length).toBe(1);
  });

  it('parts a barrier at a switch', () => {
    const floor = floorOf(
      FloorGimmick.Barriers,
      { 7: { switch: true } },
      { '3-6': { kind: DoorKind.Barrier, set: 1 } },
    );
    const start = startFloor(floor);

    expect(step(floor, start, Direction.North, NOTHING)).toBeNull();

    const flipped = step(floor, start, Direction.East, NOTHING);

    expect(flipped?.flipped).toBe(true);

    const back = flipped == null ? null : step(floor, flipped, Direction.West, NOTHING);

    expect(back == null ? null : step(floor, back, Direction.North, NOTHING)?.at).toBe(3);
  });

  it('drops down a ledge one way only', () => {
    const floor = floorOf(FloorGimmick.Ledges, {}, { '3-6': { kind: DoorKind.Ledge, to: 6 } });
    const start = startFloor(floor);

    expect(step(floor, start, Direction.North, NOTHING)).toBeNull();

    const up = step(floor, { ...start, at: 3 }, Direction.South, NOTHING);

    expect(up?.at).toBe(6);
  });

  it('clears an obstacle only for a party that knows the move', () => {
    const floor = floorOf(
      FloorGimmick.FieldMoves,
      {},
      { '3-6': { kind: DoorKind.Obstacle, move: Moves.Strength } },
    );
    const start = startFloor(floor);

    expect(step(floor, start, Direction.North, NOTHING)).toBeNull();
    expect(step(floor, start, Direction.North, new Set([Moves.Strength]))?.at).toBe(3);
  });

  it('opens the stairs to a pass-gated floor only with the pass', () => {
    const floor = { ...floorOf(FloorGimmick.Ledges), gate: FloorGate.Pass };
    const there = { ...startFloor(floor), at: 2 };

    expect(atExit(floor, there)).toBe(false);
    expect(atExit(floor, { ...there, pass: true })).toBe(true);
  });
});
