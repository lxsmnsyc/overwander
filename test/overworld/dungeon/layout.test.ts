import { describe, expect, it } from 'vitest';
import DungeonKind, {
  DUNGEON_FLOORS,
  FLOOR_GIMMICKS,
  FloorGate,
  FloorGimmick,
} from '../../../src/data/overworld/dungeon';
import { DoorKind, type DungeonFloor, RoomKind } from '../../../src/overworld/dungeon/floor';
import { generateDungeon } from '../../../src/overworld/dungeon/layout';
import { canFinish, explore, startFloor } from '../../../src/overworld/dungeon/walk';

/** Every mapped floor of a couple of hundred dungeons of each mapped kind */
function sampleFloors(): DungeonFloor[] {
  const floors: DungeonFloor[] = [];

  for (let seed = 0; seed < 150; seed++) {
    for (const kind of [DungeonKind.Hideout, DungeonKind.Dungeon]) {
      floors.push(...generateDungeon(kind, `seed${seed}`).floors);
    }
  }
  return floors;
}

const FLOORS = sampleFloors();

function without(floor: DungeonFloor, field: 'warp' | 'key' | 'switch'): DungeonFloor {
  const rooms = [];

  for (const room of floor.rooms) {
    rooms.push({ ...room, [field]: undefined });
  }
  return { ...floor, rooms };
}

describe('dungeon layouts', () => {
  it('builds the same floors from the same seed', () => {
    expect(generateDungeon(DungeonKind.Dungeon, 'same')).toEqual(
      generateDungeon(DungeonKind.Dungeon, 'same'),
    );
  });

  it('keeps each kind within its floor count, the last floor ending in the boss', () => {
    for (const kind of [DungeonKind.Hideout, DungeonKind.Dungeon, DungeonKind.Frontier]) {
      for (let seed = 0; seed < 40; seed++) {
        const { floors } = generateDungeon(kind, `count${seed}`);
        const [min, max] = DUNGEON_FLOORS[kind];
        const last = floors[floors.length - 1];

        expect(floors.length).toBeGreaterThanOrEqual(min);
        expect(floors.length).toBeLessThanOrEqual(max);
        expect(last.gate).toBe(FloorGate.Boss);
        expect(last.rooms[last.exit].kind).toBe(RoomKind.Boss);
        for (const floor of floors.slice(0, -1)) {
          expect(floor.gate).not.toBe(FloorGate.Boss);
        }
      }
    }
  });

  it('gives a Frontier tower seven floors of one fight each and no map', () => {
    const { floors } = generateDungeon(DungeonKind.Frontier, 'tower');

    expect(floors).toHaveLength(7);
    for (const floor of floors) {
      expect(floor.gimmick).toBeNull();
      expect(floor.sight).toBeNull();
      expect(floor.rooms).toHaveLength(1);
    }
  });

  it('rolls every approved gimmick, and every floor can be finished', () => {
    const seen = new Set<FloorGimmick>();

    for (const floor of FLOORS) {
      expect(floor.gimmick).not.toBeNull();
      expect(floor.sight).not.toBeNull();
      expect(canFinish(floor)).toBe(true);
      if (floor.gimmick != null) {
        seen.add(floor.gimmick);
      }
    }
    expect(seen).toEqual(new Set(FLOOR_GIMMICKS));
  });

  it('makes each gimmick matter where it is meant to', () => {
    for (const floor of FLOORS) {
      // The islands only meet through the pads, the lock only opens
      // with the key, and the barriers only part at a switch
      if (floor.gimmick === FloorGimmick.Warp) {
        expect(canFinish(without(floor, 'warp'))).toBe(false);
      }
      if (floor.gimmick === FloorGimmick.LockedDoors) {
        expect(canFinish(without(floor, 'key'))).toBe(false);
      }
      if (floor.gimmick === FloorGimmick.Barriers) {
        expect(canFinish(without(floor, 'switch'))).toBe(false);
      }
      // Something is in the way, and the stairs never need it cleared
      if (floor.gimmick === FloorGimmick.FieldMoves) {
        expect(floor.doors.some((door) => door.kind === DoorKind.Obstacle)).toBe(true);
      }
      // A drop can cost rooms, never the stairs
      if (floor.gimmick === FloorGimmick.Ledges) {
        for (const state of explore(floor, startFloor(floor)) ?? []) {
          expect(canFinish(floor, state)).toBe(true);
        }
      }
    }
  });

  it('puts the pass where it can be reached when the stairs want one', () => {
    for (const floor of FLOORS) {
      if (floor.gate === FloorGate.Pass) {
        expect(floor.rooms.some((room) => room.pass === true)).toBe(true);
      }
    }
  });
});
