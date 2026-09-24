import { describe, expect, it } from 'vitest';
import { Moves } from '../../../src/data/ids/moves';
import { Direction } from '../../../src/overworld/dungeon/floor';
import { type CellGrid, Thing, Tile, lineOfSight } from '../../../src/overworld/dungeon/grid';
import findWalk from '../../../src/components/overworld/dungeon-board/walking';
import {
  arrive,
  press,
  solvable,
  spottedBy,
  thingAt,
  tread,
} from '../../../src/overworld/dungeon/tread';

const NOTHING = new Set<Moves>();

/**
 * A corridor of floor seven cells long, walled above and below, arrived
 * on at its west end with the stairs at its east end. `row` says what
 * each of its seven cells is, west to east
 */
function corridor(row: Tile[] = [], things: [number, Thing][] = []): CellGrid {
  const width = 7;
  const tiles: Tile[] = [];

  for (let cell = 0; cell < width * 3; cell++) {
    tiles.push(Tile.Wall);
  }
  for (let x = 0; x < width; x++) {
    tiles[width + x] = row[x] ?? Tile.Floor;
  }
  tiles[width] = Tile.Arrival;
  tiles[width + width - 1] = Tile.Stairs;

  const placed = new Map<number, Thing>();

  for (const [x, thing] of things) {
    placed.set(width + x, thing);
  }
  return {
    width,
    height: 3,
    tiles,
    arrows: new Map(),
    pads: new Map(),
    barriers: new Map(),
    things: placed,
    rooms: new Map(),
    watches: new Map(),
    entry: width,
    exit: width + width - 1,
  };
}

const at = (x: number): number => 7 + x;

describe('treading a floor', () => {
  it('walks one cell and reaches the stairs at the end', () => {
    const grid = corridor();
    let footing = arrive(grid);

    for (let step = 0; step < 5; step++) {
      footing = tread(grid, footing, Direction.East, NOTHING)?.footing ?? footing;
    }
    expect(footing.at).toBe(at(5));
    expect(tread(grid, footing, Direction.East, NOTHING)?.event).toEqual({ kind: 'stairs' });
    // Nothing gets through a wall
    expect(tread(grid, footing, Direction.North, NOTHING)?.footing.at).toBe(at(5));
  });

  it('slides across ice until rough ground stops it', () => {
    const grid = corridor([Tile.Arrival, Tile.Ice, Tile.Ice, Tile.Floor, Tile.Ice]);

    expect(tread(grid, arrive(grid), Direction.East, NOTHING)?.footing.at).toBe(at(3));
  });

  it('carries a spinner lane on in its arrow', () => {
    const grid = corridor([Tile.Arrival, Tile.Spinner, Tile.Spinner]);

    grid.arrows.set(at(1), Direction.East);
    grid.arrows.set(at(2), Direction.East);
    const carried = tread(grid, arrive(grid), Direction.East, NOTHING);

    expect(carried?.footing.at).toBe(at(3));
    // Every cell passed over, so the board can play the ride a cell at a time
    expect(carried?.path).toEqual([at(1), at(2), at(3)]);
  });

  it('walks to a spinner cell by riding over it', () => {
    const grid = corridor([Tile.Arrival, Tile.Floor, Tile.Spinner, Tile.Spinner]);

    grid.arrows.set(at(2), Direction.East);
    grid.arrows.set(at(3), Direction.East);
    expect(findWalk(grid, arrive(grid), at(2), NOTHING)).toEqual([Direction.East, Direction.East]);
  });

  it('sends a pad to its pair', () => {
    const grid = corridor([Tile.Arrival, Tile.Pad, Tile.Floor, Tile.Floor, Tile.Pad]);

    grid.pads.set(at(1), at(4));
    grid.pads.set(at(4), at(1));
    expect(tread(grid, arrive(grid), Direction.East, NOTHING)?.footing.at).toBe(at(4));
  });

  it('breaks a cracked tile behind the player, and drops them through it', () => {
    const grid = corridor([Tile.Arrival, Tile.Cracked]);
    const on = tread(grid, arrive(grid), Direction.East, NOTHING)?.footing;
    const off = on == null ? null : tread(grid, on, Direction.East, NOTHING)?.footing;

    expect(off?.crumbled).toEqual([at(1)]);

    const back = off == null ? null : tread(grid, off, Direction.West, NOTHING);

    expect(back?.event).toEqual({ kind: 'fall' });
  });

  it('opens a locked door with a key pressed up off the floor', () => {
    const grid = corridor([Tile.Arrival, Tile.Floor, Tile.Floor, Tile.Locked], [[2, Thing.Key]]);
    const beside = tread(grid, arrive(grid), Direction.East, NOTHING)?.footing;

    expect(beside?.at).toBe(at(1));
    // Blocked by the key until it is picked up
    expect(beside == null ? null : tread(grid, beside, Direction.East, NOTHING)?.footing.at).toBe(
      at(1),
    );

    const keyed = beside == null ? null : press(grid, beside, NOTHING)?.footing;

    expect(keyed?.keys).toBe(1);

    const through =
      keyed == null ? null : tread(grid, { ...keyed, at: at(2) }, Direction.East, NOTHING);

    expect(through?.footing.at).toBe(at(3));
    expect(through?.footing.keys).toBe(0);
  });

  it('parts a barrier at its switch', () => {
    const grid = corridor([Tile.Arrival, Tile.Floor, Tile.Barrier], [[3, Thing.Switch]]);

    grid.barriers.set(at(2), 1);

    const beside = tread(grid, arrive(grid), Direction.East, NOTHING)?.footing;

    expect(beside == null ? null : tread(grid, beside, Direction.East, NOTHING)?.footing.at).toBe(
      at(1),
    );
    expect(thingAt(grid, arrive(grid), at(3))).toBe(Thing.Switch);
  });

  it('hops a ledge its own way only', () => {
    const grid = corridor([Tile.Arrival, Tile.Floor, Tile.Ledge]);

    grid.arrows.set(at(2), Direction.East);

    const beside = tread(grid, arrive(grid), Direction.East, NOTHING)?.footing;

    expect(beside == null ? null : tread(grid, beside, Direction.East, NOTHING)?.footing.at).toBe(
      at(3),
    );
    expect(tread(grid, { ...arrive(grid), at: at(3) }, Direction.West, NOTHING)?.footing.at).toBe(
      at(3),
    );
  });

  it('pushes a boulder with Strength, and only with it', () => {
    const grid = corridor([], [[2, Thing.Boulder]]);
    const beside = tread(grid, arrive(grid), Direction.East, NOTHING)?.footing;

    if (beside == null) {
      throw new Error('no step');
    }
    expect(tread(grid, beside, Direction.East, NOTHING)?.footing.boulders).toEqual([at(2)]);

    const pushed = tread(grid, beside, Direction.East, new Set([Moves.Strength]))?.footing;

    // The boulder moves and the pusher stays put
    expect(pushed?.boulders).toEqual([at(3)]);
    expect(pushed?.at).toBe(at(1));
  });

  it('breaks a rock only for a party that knows Rock Smash', () => {
    const grid = corridor([], [[2, Thing.Rock]]);
    const beside = { ...arrive(grid), at: at(1), facing: Direction.East };

    expect(press(grid, beside, NOTHING)).toBeNull();
    expect(press(grid, beside, new Set([Moves.RockSmash]))?.footing.taken).toEqual([at(2)]);
  });

  it('is spotted by a trainer standing down the line', () => {
    const grid = corridor([], [[5, Thing.Trainer]]);

    grid.rooms.set(at(5), 3);
    grid.watches.set(at(5), { facing: Direction.West, sight: [], room: 3 });
    lineOfSight(grid);

    expect(spottedBy(grid, { ...arrive(grid), at: at(4) }, new Set())).toBe(at(5));
    expect(spottedBy(grid, { ...arrive(grid), at: at(0) }, new Set())).toBeNull();
    // Beaten, they watch nobody
    expect(spottedBy(grid, { ...arrive(grid), at: at(4) }, new Set([3]))).toBeNull();
  });

  it('knows a floor can be finished, and one that cannot', () => {
    expect(solvable(corridor(), false)).toBe(true);
    expect(solvable(corridor([], [[3, Thing.Rock]]), false)).toBe(false);
    expect(solvable(corridor([], [[3, Thing.Rock]]), false, new Set([Moves.RockSmash]))).toBe(true);
  });
});
