import { Moves } from '../../data/ids/moves';
import DungeonKind, { FloorGate, FloorGimmick } from '../../data/overworld/dungeon';
import { DIRECTIONS, Direction, DoorKind, type FloorPlan, RoomKind, neighbour } from './floor';

/** Floor cells across one room, walls not counted */
export const ROOM_CELLS = 5;

/** How far a trainer sees down the line it faces */
export const TRAINER_SIGHT = 4;

/** What the ground of one cell is */
export const enum Tile {
  Wall = 0,
  Floor = 1,
  Ice = 2,
  /** Carries whoever steps on it on in its arrow's direction */
  Spinner = 3,
  /** Sends whoever stops on it to its pair */
  Pad = 4,
  /** Holds once, and is a hole once left */
  Cracked = 5,
  Water = 6,
  /** Hopped down in its arrow's direction only */
  Ledge = 7,
  Locked = 8,
  Barrier = 9,
  /** The way down to the next floor */
  Stairs = 10,
  /** Where the floor is arrived on, and the way back up */
  Arrival = 11,
}

/** What stands on a cell, blocking it */
export const enum Thing {
  /** Pushed a cell with Strength */
  Boulder = 0,
  /** Broken with Rock Smash */
  Rock = 1,
  /** Cut down with Cut */
  Tree = 2,
  Stash = 3,
  Key = 4,
  Pass = 5,
  /** Flips which barriers are open */
  Switch = 6,
  Trainer = 7,
  /** A Dungeon's wild horde, fought by walking up to it */
  Horde = 8,
  /** The syndicate boss, the Brain, or the legendary */
  Boss = 9,
}

/** A trainer, and the line they watch */
export interface Watch {
  facing: Direction;
  /** The cells they see, nearest first */
  sight: number[];
  /** The room the trainer stands in, which is what their fight is staged from */
  room: number;
}

/** One floor laid out in cells */
export interface CellGrid {
  width: number;
  height: number;
  tiles: Tile[];
  /** Spinners and ledges: which way each carries or drops */
  arrows: Map<number, Direction>;
  /** Pads and where each sends */
  pads: Map<number, number>;
  /** Barrier cells and their set: 0 open until the first flip */
  barriers: Map<number, 0 | 1>;
  things: Map<number, Thing>;
  /** Each fighting thing's room in the plan, and a trainer's line */
  rooms: Map<number, number>;
  watches: Map<number, Watch>;
  entry: number;
  exit: number;
}

const DX = [0, 1, 0, -1];
const DY = [-1, 0, 1, 0];

/** The cell one step away, or -1 past the edge */
export function cellAhead(grid: CellGrid, cell: number, direction: Direction): number {
  const x = (cell % grid.width) + DX[direction];
  const y = Math.floor(cell / grid.width) + DY[direction];

  return x < 0 || y < 0 || x >= grid.width || y >= grid.height ? -1 : y * grid.width + x;
}

const OBSTACLE_THINGS: Partial<Record<Moves, Thing>> = {
  [Moves.Strength]: Thing.Boulder,
  [Moves.RockSmash]: Thing.Rock,
  [Moves.Cut]: Thing.Tree,
};

/** The move that clears a thing, where one does */
export const CLEARED_BY: Partial<Record<Thing, Moves>> = {
  [Thing.Boulder]: Moves.Strength,
  [Thing.Rock]: Moves.RockSmash,
  [Thing.Tree]: Moves.Cut,
};

/**
 * The floor's plan laid out in cells: each room a square of floor inside
 * one-cell walls, each door a gap in the wall carrying the door's rule
 */
export function rasterize(floor: FloorPlan, kind: DungeonKind): CellGrid {
  const pitch = ROOM_CELLS + 1;
  const width = floor.size * pitch + 1;
  const tiles: Tile[] = [];

  for (let cell = 0; cell < width * width; cell++) {
    tiles.push(Tile.Wall);
  }

  const grid: CellGrid = {
    width,
    height: width,
    tiles,
    arrows: new Map(),
    pads: new Map(),
    barriers: new Map(),
    things: new Map(),
    rooms: new Map(),
    watches: new Map(),
    entry: 0,
    exit: 0,
  };
  const at = (x: number, y: number): number => y * width + x;
  const middle = Math.floor(ROOM_CELLS / 2);
  const centre = (room: number): number =>
    at((room % floor.size) * pitch + 1 + middle, Math.floor(room / floor.size) * pitch + 1 + middle);
  const ice = floor.gimmick === FloorGimmick.Ice;

  for (let room = 0; room < floor.rooms.length; room++) {
    const left = (room % floor.size) * pitch + 1;
    const top = Math.floor(room / floor.size) * pitch + 1;
    const rough = floor.rooms[room].rough === true;

    for (let y = top; y < top + ROOM_CELLS; y++) {
      for (let x = left; x < left + ROOM_CELLS; x++) {
        // Patches of rough ground scattered over the ice, so a slide has
        // somewhere to stop short of the far wall
        const patch = (x * 7 + y * 13 + floor.depth * 5) % 5 === 0;

        tiles[at(x, y)] = ice && !rough && !patch ? Tile.Ice : Tile.Floor;
      }
    }

    // A spinner room's lane runs through its middle, door to door
    const arrow = floor.rooms[room].arrow;

    if (arrow != null) {
      for (let step = 0; step < ROOM_CELLS; step++) {
        const lane =
          arrow === Direction.East || arrow === Direction.West
            ? at(left + step, top + middle)
            : at(left + middle, top + step);

        tiles[lane] = Tile.Spinner;
        grid.arrows.set(lane, arrow);
      }
    }
  }

  // Doors: the wall cell between two rooms' middles
  for (const door of floor.doors) {
    const [a, b] = door.a < door.b ? [door.a, door.b] : [door.b, door.a];
    const across = b === a + 1;
    const x = across ? (a % floor.size) * pitch + pitch : (a % floor.size) * pitch + 1 + middle;
    const y = across
      ? Math.floor(a / floor.size) * pitch + 1 + middle
      : Math.floor(a / floor.size) * pitch + pitch;
    const cell = at(x, y);

    // A doorway is plain ground even on ice, which is where a slide ends
    tiles[cell] = floor.gimmick === FloorGimmick.Cracked ? Tile.Cracked : Tile.Floor;
    // A lane running through the door carries on through it
    const lane = floor.rooms[a].arrow ?? floor.rooms[b].arrow;

    if (lane != null && tiles[cell] !== Tile.Cracked) {
      const along = across ? lane === Direction.East || lane === Direction.West : lane === Direction.North || lane === Direction.South;

      if (along) {
        tiles[cell] = Tile.Spinner;
        grid.arrows.set(cell, lane);
      }
    }

    if (door.kind === DoorKind.Ledge && door.to != null) {
      tiles[cell] = Tile.Ledge;
      grid.arrows.set(cell, towards(floor, door.to === a ? b : a, door.to));
    } else if (door.kind === DoorKind.Locked) {
      tiles[cell] = Tile.Locked;
    } else if (door.kind === DoorKind.Barrier) {
      tiles[cell] = Tile.Barrier;
      grid.barriers.set(cell, door.set ?? 0);
    } else if (door.kind === DoorKind.Obstacle && door.move != null) {
      const thing = OBSTACLE_THINGS[door.move];

      if (thing == null) {
        tiles[cell] = Tile.Water;
      } else {
        grid.things.set(cell, thing);
      }
    }
  }

  // What stands in each room, at its middle
  for (const [room, plan] of floor.rooms.entries()) {
    const cell = centre(room);

    if (plan.warp != null) {
      tiles[cell] = Tile.Pad;
      grid.pads.set(cell, centre(plan.warp));
    }
    if (plan.key === true) {
      grid.things.set(cell, Thing.Key);
    } else if (plan.pass === true) {
      grid.things.set(cell, Thing.Pass);
    } else if (plan.switch === true) {
      grid.things.set(cell, Thing.Switch);
    }

    switch (plan.kind) {
      case RoomKind.Entry:
        tiles[cell] = Tile.Arrival;
        grid.entry = cell;
        break;
      case RoomKind.Stairs:
        tiles[cell] = Tile.Stairs;
        grid.exit = cell;
        if (floor.gate === FloorGate.Guard) {
          guard(grid, floor, room, cell);
        }
        break;
      case RoomKind.Boss:
        tiles[cell] = Tile.Floor;
        grid.exit = cell;
        grid.things.set(cell, Thing.Boss);
        grid.rooms.set(cell, room);
        break;
      case RoomKind.Stash:
        grid.things.set(cell, Thing.Stash);
        break;
      case RoomKind.Trainer:
        if (kind === DungeonKind.Dungeon) {
          grid.things.set(cell, Thing.Horde);
          grid.rooms.set(cell, room);
        } else {
          watch(grid, floor, room, cell);
        }
        break;
      default:
        break;
    }
  }
  // A floor walked into its own last room, a Frontier storey, is arrived
  // on at the bottom of it
  if (floor.entry === floor.exit) {
    const room = floor.entry;
    const cell = at(
      (room % floor.size) * pitch + 1 + middle,
      Math.floor(room / floor.size) * pitch + ROOM_CELLS,
    );

    tiles[cell] = Tile.Arrival;
    grid.entry = cell;
  }
  return grid;
}

/** Which way a door lies from one room to the next */
function towards(floor: FloorPlan, from: number, to: number): Direction {
  for (const direction of DIRECTIONS) {
    if (neighbour(floor.size, from, direction) === to) {
      return direction;
    }
  }
  return Direction.South;
}

/** The first door of a room, which is what its trainer watches */
function firstDoor(floor: FloorPlan, room: number): Direction {
  for (const door of floor.doors) {
    if (door.a === room || door.b === room) {
      return towards(floor, room, door.a === room ? door.b : door.a);
    }
  }
  return Direction.South;
}

/** A trainer at a room's middle, facing its first door */
function watch(grid: CellGrid, floor: FloorPlan, room: number, cell: number): void {
  grid.things.set(cell, Thing.Trainer);
  grid.rooms.set(cell, room);
  grid.watches.set(cell, { facing: firstDoor(floor, room), sight: [], room });
}

/** The stairs' guard, a step off the stairs and facing the room's first door */
function guard(grid: CellGrid, floor: FloorPlan, room: number, stairs: number): void {
  const facing = firstDoor(floor, room);
  const cell = cellAhead(grid, stairs, facing);

  if (cell >= 0) {
    grid.things.set(cell, Thing.Trainer);
    grid.rooms.set(cell, room);
    grid.watches.set(cell, { facing, sight: [], room });
  }
}

/** Whether a line of sight passes over this cell */
function seeThrough(grid: CellGrid, cell: number): boolean {
  return grid.tiles[cell] !== Tile.Wall && !grid.things.has(cell);
}

/** Fill in each trainer's line: straight ahead until a wall or anything standing */
export function lineOfSight(grid: CellGrid): CellGrid {
  for (const [cell, watching] of grid.watches) {
    const sight: number[] = [];
    let at = cell;

    for (let step = 0; step < TRAINER_SIGHT; step++) {
      at = cellAhead(grid, at, watching.facing);
      if (at < 0 || !seeThrough(grid, at)) {
        break;
      }
      sight.push(at);
    }
    watching.sight = sight;
  }
  return grid;
}

/** Whether a floor with this gimmick lays out any door that needs a move */
export function hasObstacles(grid: CellGrid): boolean {
  for (const thing of grid.things.values()) {
    if (CLEARED_BY[thing] != null) {
      return true;
    }
  }
  for (const tile of grid.tiles) {
    if (tile === Tile.Water) {
      return true;
    }
  }
  return false;
}
