import { describe, expect, it } from 'vitest';
import DungeonKind, {
  DUNGEON_FLOORS,
  FLOOR_GIMMICKS,
  FloorGate,
  FloorGimmick,
} from '../../../src/data/overworld/dungeon';
import { type DungeonFloor, RoomKind } from '../../../src/overworld/dungeon/floor';
import { type CellGrid, Thing, Tile, hasObstacles } from '../../../src/overworld/dungeon/grid';
import { generateDungeon } from '../../../src/overworld/dungeon/layout';
import { solvable } from '../../../src/overworld/dungeon/tread';

/** Every mapped floor of a couple of hundred dungeons of each mapped kind */
function sampleFloors(): DungeonFloor[] {
  const floors: DungeonFloor[] = [];

  for (let seed = 0; seed < 40; seed++) {
    for (const kind of [DungeonKind.Hideout, DungeonKind.Dungeon]) {
      floors.push(...generateDungeon(kind, `seed${seed}`).floors);
    }
  }
  return floors;
}

const FLOORS = sampleFloors();

function without(grid: CellGrid, what: Thing | 'pads'): CellGrid {
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

const finishable = (floor: DungeonFloor, grid: CellGrid = floor.grid): boolean =>
  solvable(grid, floor.gate === FloorGate.Pass);

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
      // Arrived on at the bottom, with the fight between you and the way on
      expect(floor.grid.tiles[floor.grid.entry]).toBe(Tile.Arrival);
      expect(finishable(floor)).toBe(true);
    }
  });

  it('rolls every approved gimmick, and every floor can be finished', () => {
    const seen = new Set<FloorGimmick>();

    for (const floor of FLOORS) {
      expect(floor.gimmick).not.toBeNull();
      expect(floor.sight).not.toBeNull();
      expect(finishable(floor)).toBe(true);
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
        expect(finishable(floor, without(floor.grid, 'pads'))).toBe(false);
      }
      if (floor.gimmick === FloorGimmick.LockedDoors) {
        expect(finishable(floor, without(floor.grid, Thing.Key))).toBe(false);
      }
      if (floor.gimmick === FloorGimmick.Barriers) {
        expect(finishable(floor, without(floor.grid, Thing.Switch))).toBe(false);
      }
      // Something is in the way, and the stairs never need it cleared
      if (floor.gimmick === FloorGimmick.FieldMoves) {
        expect(hasObstacles(floor.grid)).toBe(true);
      }
      if (floor.gimmick === FloorGimmick.Spinner) {
        expect(floor.grid.tiles.includes(Tile.Spinner)).toBe(true);
      }
      if (floor.gimmick === FloorGimmick.Ledges) {
        expect(floor.grid.tiles.includes(Tile.Ledge)).toBe(true);
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
