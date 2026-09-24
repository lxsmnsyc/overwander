import { Moves } from '../../data/ids/moves';
import { DIRECTIONS, Direction } from './floor';
import { CLEARED_BY, type CellGrid, Thing, Tile, cellAhead } from './grid';

/** Where a player stands on a floor, and everything they changed on it */
export interface Footing {
  at: number;
  facing: Direction;
  /** Barrier floors: whether the second set is the open one */
  flipped: boolean;
  /** Keys picked up and not yet spent */
  keys: number;
  /** Locked doors a key has opened */
  opened: number[];
  /** Things picked up, cleared or beaten, by the cell they stood on */
  taken: number[];
  /** Cracked tiles that have broken */
  crumbled: number[];
  /** Holes a boulder has filled */
  filled: number[];
  /** Where every boulder stands now */
  boulders: number[];
  pass: boolean;
}

/** What a step or a press came to, besides the new footing */
export type TreadEvent =
  | { kind: 'fall' }
  | { kind: 'stairs' }
  | { kind: 'arrival' }
  | { kind: 'take'; cell: number; thing: Thing }
  | { kind: 'fight'; cell: number };

export interface Tread {
  footing: Footing;
  event: TreadEvent | null;
  /** Every cell passed over on the way, in order, the last one included */
  path: number[];
}

function sorted(list: number[]): number[] {
  return [...list].sort((a, b) => a - b);
}

function added(list: number[], value: number): number[] {
  return list.includes(value) ? list : sorted([...list, value]);
}

function removed(list: number[], value: number): number[] {
  const kept: number[] = [];

  for (const one of list) {
    if (one !== value) {
      kept.push(one);
    }
  }
  return kept;
}

export function arrive(grid: CellGrid): Footing {
  const boulders: number[] = [];

  for (const [cell, thing] of grid.things) {
    if (thing === Thing.Boulder) {
      boulders.push(cell);
    }
  }
  return {
    at: grid.entry,
    facing: Direction.North,
    flipped: false,
    keys: 0,
    opened: [],
    taken: [],
    crumbled: [],
    filled: [],
    boulders: sorted(boulders),
    pass: false,
  };
}

/** What stands on a cell now, boulders where they have been pushed */
export function thingAt(grid: CellGrid, footing: Footing, cell: number): Thing | null {
  if (footing.boulders.includes(cell)) {
    return Thing.Boulder;
  }

  const thing = grid.things.get(cell);

  return thing == null || thing === Thing.Boulder || footing.taken.includes(cell) ? null : thing;
}

function isHole(grid: CellGrid, footing: Footing, cell: number): boolean {
  return (
    grid.tiles[cell] === Tile.Cracked &&
    footing.crumbled.includes(cell) &&
    !footing.filled.includes(cell)
  );
}

/** Whether a cell can be stood on at all right now, the player's rules aside */
function open(grid: CellGrid, footing: Footing, cell: number, known: ReadonlySet<Moves>): boolean {
  if (cell < 0 || thingAt(grid, footing, cell) != null) {
    return false;
  }
  switch (grid.tiles[cell]) {
    case Tile.Wall:
      return false;
    case Tile.Water:
      return known.has(Moves.Surf);
    case Tile.Locked:
      return footing.opened.includes(cell);
    case Tile.Barrier:
      return (grid.barriers.get(cell) === 1) === footing.flipped;
    default:
      return true;
  }
}

/** Where a boulder may be pushed: bare floor, or a hole it fills */
function boulderFits(grid: CellGrid, footing: Footing, cell: number): boolean {
  if (cell < 0 || thingAt(grid, footing, cell) != null) {
    return false;
  }

  const tile = grid.tiles[cell];

  return tile === Tile.Floor || tile === Tile.Ice || tile === Tile.Cracked;
}

/** Leaving a cracked tile breaks it */
function leave(grid: CellGrid, footing: Footing): Footing {
  return grid.tiles[footing.at] === Tile.Cracked && !footing.filled.includes(footing.at)
    ? { ...footing, crumbled: added(footing.crumbled, footing.at) }
    : footing;
}

/**
 * One step. A slide on ice and a spinner's lane carry on until something
 * stops them, a ledge is hopped, a pad sends its stander to its pair, and
 * a boulder walked into with Strength is pushed a cell instead. Null when
 * nothing happens at all
 */
export function tread(
  grid: CellGrid,
  from: Footing,
  direction: Direction,
  known: ReadonlySet<Moves>,
): Tread | null {
  const turned: Footing = { ...from, facing: direction };
  const next = cellAhead(grid, from.at, direction);

  if (next < 0) {
    return null;
  }

  // A boulder in the way is pushed if it can be, and the pusher stays put
  if (thingAt(grid, from, next) === Thing.Boulder) {
    const beyond = cellAhead(grid, next, direction);

    if (!known.has(Moves.Strength) || !boulderFits(grid, from, beyond)) {
      return { footing: turned, event: null, path: [] };
    }

    const boulders = removed(from.boulders, next);

    return isHole(grid, from, beyond)
      ? {
          footing: { ...turned, boulders, filled: added(from.filled, beyond) },
          event: null,
          path: [],
        }
      : { footing: { ...turned, boulders: added(boulders, beyond) }, event: null, path: [] };
  }

  let footing = turned;
  let heading = direction;
  let target = next;
  const path: number[] = [];

  // A locked door takes a key as it is walked into
  if (grid.tiles[next] === Tile.Locked && !from.opened.includes(next) && from.keys > 0) {
    footing = { ...footing, keys: from.keys - 1, opened: added(from.opened, next) };
  }
  if (grid.tiles[next] === Tile.Ledge) {
    // Hopped down its own way only, landing on the far side
    const landing = cellAhead(grid, next, direction);

    if (grid.arrows.get(next) !== direction || !open(grid, footing, landing, known)) {
      return { footing: turned, event: null, path: [] };
    }
    path.push(next);
    target = landing;
  } else if (!open(grid, footing, next, known)) {
    return { footing: turned, event: null, path: [] };
  }

  // Ice and spinner lanes carry on; a loop of arrows is cut off
  for (let slid = 0; slid <= grid.tiles.length; slid++) {
    footing = { ...leave(grid, footing), at: target };
    path.push(target);
    if (isHole(grid, footing, target)) {
      return { footing, event: { kind: 'fall' }, path };
    }

    const tile = grid.tiles[target];

    if (tile === Tile.Spinner) {
      heading = grid.arrows.get(target) ?? heading;
    } else if (tile !== Tile.Ice) {
      break;
    }

    const onward = cellAhead(grid, target, heading);

    if (onward < 0 || !open(grid, footing, onward, known) || grid.tiles[onward] === Tile.Ledge) {
      break;
    }
    target = onward;
  }

  const pad = grid.pads.get(footing.at);

  if (pad != null) {
    footing = { ...footing, at: pad };
    path.push(pad);
  }
  if (grid.tiles[footing.at] === Tile.Stairs) {
    return { footing, event: { kind: 'stairs' }, path };
  }
  if (grid.tiles[footing.at] === Tile.Arrival && footing.at !== from.at) {
    return { footing, event: { kind: 'arrival' }, path };
  }
  return { footing, event: null, path };
}

/**
 * Press whatever the player faces: pick an item up, flip a switch, clear
 * an obstacle the party has the move for, or start a fight
 */
export function press(grid: CellGrid, from: Footing, known: ReadonlySet<Moves>): Tread | null {
  const cell = cellAhead(grid, from.at, from.facing);
  const thing = cell < 0 ? null : thingAt(grid, from, cell);

  switch (thing) {
    case Thing.Key:
      return {
        footing: { ...from, keys: from.keys + 1, taken: added(from.taken, cell) },
        event: { kind: 'take', cell, thing },
        path: [],
      };
    case Thing.Pass:
      return {
        footing: { ...from, pass: true, taken: added(from.taken, cell) },
        event: { kind: 'take', cell, thing },
        path: [],
      };
    case Thing.Stash:
      return {
        footing: { ...from, taken: added(from.taken, cell) },
        event: { kind: 'take', cell, thing },
        path: [],
      };
    case Thing.Switch:
      return {
        footing: { ...from, flipped: !from.flipped },
        event: { kind: 'take', cell, thing },
        path: [],
      };
    case Thing.Rock:
    case Thing.Tree: {
      const move = CLEARED_BY[thing];

      return move != null && known.has(move)
        ? {
            footing: { ...from, taken: added(from.taken, cell) },
            event: { kind: 'take', cell, thing },
            path: [],
          }
        : null;
    }
    case Thing.Trainer:
    case Thing.Horde:
    case Thing.Boss:
      return { footing: from, event: { kind: 'fight', cell }, path: [] };
    default:
      return null;
  }
}

/** A trainer still standing whose line this cell is on, or null */
export function spottedBy(
  grid: CellGrid,
  footing: Footing,
  beaten: ReadonlySet<number>,
): number | null {
  for (const [cell, watch] of grid.watches) {
    if (!beaten.has(watch.room) && watch.sight.includes(footing.at)) {
      // Anything standing in the line since blocks it
      let clear = true;

      for (const seen of watch.sight) {
        if (seen === footing.at) {
          break;
        }
        if (thingAt(grid, footing, seen) != null) {
          clear = false;
          break;
        }
      }
      if (clear) {
        return cell;
      }
    }
  }
  return null;
}

function footingKey(footing: Footing): string {
  return `${footing.at}|${footing.flipped ? 1 : 0}|${footing.keys}|${footing.opened.join(',')}|${footing.taken.join(',')}|${footing.crumbled.join(',')}|${footing.filled.join(',')}|${footing.boulders.join(',')}|${footing.pass ? 1 : 0}`;
}

/** How many footings a search may visit before calling a floor unsolvable */
const SEARCH_LIMIT = 200_000;

/**
 * Whether the way on can be reached: the stairs with whatever the gate
 * asks, or a cell beside the boss. Nobody standing is fought: they stand
 * in a room's middle, so there is always a way round them
 */
export function solvable(
  grid: CellGrid,
  needsPass: boolean,
  known: ReadonlySet<Moves> = new Set(),
  from: Footing = arrive(grid),
): boolean {
  const boss = grid.things.get(grid.exit) === Thing.Boss;
  const done = (footing: Footing): boolean => {
    if (boss) {
      for (const direction of DIRECTIONS) {
        if (cellAhead(grid, footing.at, direction) === grid.exit) {
          return true;
        }
      }
      return false;
    }
    return footing.at === grid.exit && (!needsPass || footing.pass);
  };
  const seen = new Set([footingKey(from)]);
  const queue = [from];

  for (let at = 0; at < queue.length; at++) {
    const here = queue[at];

    if (done(here)) {
      return true;
    }
    for (const direction of DIRECTIONS) {
      const moves: (Footing | null)[] = [];
      const stepped = tread(grid, here, direction, known);

      // A fall is a way off the floor, not onto the stairs
      moves.push(stepped?.event?.kind === 'fall' ? null : (stepped?.footing ?? null));

      const pressed = press(grid, { ...here, facing: direction }, known);

      // Only what opens a way matters here: a stash taken or a fight won
      // changes nothing about the walk, and tracking them only multiplies it
      if (pressed?.event?.kind === 'take' && pressed.event.thing !== Thing.Stash) {
        moves.push(pressed.footing);
      }
      for (const next of moves) {
        if (next == null) {
          continue;
        }

        const key = footingKey(next);

        if (!seen.has(key)) {
          if (seen.size >= SEARCH_LIMIT) {
            return false;
          }
          seen.add(key);
          queue.push(next);
        }
      }
    }
  }
  return false;
}
