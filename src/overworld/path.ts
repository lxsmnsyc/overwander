import { CELL_COUNT, CHUNK_CELLS } from './chunk';

/**
 * How a player crosses a chunk: pressed a cell, and walked to it.
 *
 * Walking used to be the arrow keys — one press, one cell — which made
 * the whole chunk a thing a player typed their way across, and made the
 * far corner of it twenty presses away. Pressing where you want to be
 * is what the picture already invites, since it is a board being looked
 * at rather than a form being filled in.
 *
 * What that needs is the route, and the route has to be walked rather
 * than teleported along: a step is a step, and the egg being carried
 * counts them. This is that route — plain A* over the chunk's own grid.
 *
 * Straight steps only. Nothing in this game moves diagonally: a cell is
 * north, south, east or west of its neighbour, which is also what makes
 * a route legible when it is being walked one cell at a time.
 */

/**
 * The four ways out of a cell, in the order a route prefers them when
 * two are equally good — up and down before left and right, which is
 * arbitrary but has to be *something* so that the same press always
 * walks the same way
 */
export const CARDINALS: readonly [number, number][] = [
  [0, -1],
  [1, 0],
  [0, 1],
  [-1, 0],
];

/**
 * Whether a cell may be walked on. What counts is the caller's:
 * landmarks are fixtures and are walked round, while a pokemon is
 * walked straight through — nothing springs by being passed over, and
 * a route that bent round every spawn made a busy chunk a maze
 */
export type Passable = (cell: number) => boolean;

function neighbors(cell: number): number[] {
  const x = cell % CHUNK_CELLS;
  const y = Math.floor(cell / CHUNK_CELLS);
  const found: number[] = [];

  for (const [dx, dy] of CARDINALS) {
    const nx = x + dx;
    const ny = y + dy;

    if (nx >= 0 && ny >= 0 && nx < CHUNK_CELLS && ny < CHUNK_CELLS) {
      found.push(ny * CHUNK_CELLS + nx);
    }
  }
  return found;
}

/**
 * How many straight steps apart two cells are with nothing in the way.
 * It is the distance the grid is actually walked in, which is what
 * makes it safe to steer the search by: it never over-estimates, so the
 * first route found to a cell is the shortest one
 */
export function stepsBetween(one: number, other: number): number {
  return (
    Math.abs((one % CHUNK_CELLS) - (other % CHUNK_CELLS)) +
    Math.abs(Math.floor(one / CHUNK_CELLS) - Math.floor(other / CHUNK_CELLS))
  );
}

/**
 * A* over the chunk, with the goal given as a test rather than as a
 * cell — because two different things are asked for: the cell itself,
 * and any cell beside it.
 *
 * The open set is a plain array scanned for its best entry. A chunk is
 * 256 cells; a heap would be more code than the search it is speeding
 * up
 */
function search(
  from: number,
  arrived: (cell: number) => boolean,
  estimate: (cell: number) => number,
  passable: Passable,
): number[] | null {
  if (arrived(from)) {
    return [];
  }

  const cameFrom = new Map<number, number>();
  const cost = new Map<number, number>([[from, 0]]);
  const open = [from];

  while (open.length > 0) {
    let best = 0;

    for (let at = 1; at < open.length; at++) {
      const one = (cost.get(open[at]) ?? 0) + estimate(open[at]);
      const other = (cost.get(open[best]) ?? 0) + estimate(open[best]);

      if (one < other) {
        best = at;
      }
    }

    const [cell] = open.splice(best, 1);

    if (arrived(cell)) {
      // Walked back to where it started from, and then turned round:
      // the caller wants the steps to take, not the way home
      const route = [cell];

      for (let step = cameFrom.get(cell); step != null; step = cameFrom.get(step)) {
        if (step === from) {
          break;
        }
        route.push(step);
      }
      return route.reverse();
    }

    const spent = (cost.get(cell) ?? 0) + 1;

    for (const next of neighbors(cell)) {
      // The cell being walked to is checked for what is standing on it
      // rather than the one being left, so a player who somehow ends up
      // on an occupied cell can still walk off it
      if (!passable(next) || spent >= (cost.get(next) ?? Number.POSITIVE_INFINITY)) {
        continue;
      }
      cost.set(next, spent);
      cameFrom.set(next, cell);
      open.push(next);
    }
  }
  return null;
}

/**
 * The way from one cell to another: every cell to step on, in order,
 * the destination last and the cell being left out. Null when there is
 * no way through, and empty when the walker is already there
 */
export function findPath(from: number, to: number, passable: Passable): number[] | null {
  if (from < 0 || to < 0 || from >= CELL_COUNT || to >= CELL_COUNT || !passable(to)) {
    return null;
  }
  return search(
    from,
    (cell) => cell === to,
    (cell) => stepsBetween(cell, to),
    passable,
  );
}

/**
 * The way to a cell, or as close to it as the ground allows.
 *
 * A press on a tree or a rock is still a press on somewhere: the player
 * pointed at a spot and meant "over there". Refusing it leaves them
 * pressing a boulder and watching nothing happen, so the walk ends on
 * the nearest cell that can be stood on instead.
 *
 * Nearest is measured from the target, not from the walker, and only
 * cells that can actually be walked to count — the far side of a wall
 * is not close to anything. So this floods outward for everywhere the
 * walker can reach and picks the best of it, rather than searching once
 * per ring around a cell that may be sealed off entirely
 */
export function findPathNear(from: number, to: number, passable: Passable): number[] | null {
  if (from < 0 || to < 0 || from >= CELL_COUNT || to >= CELL_COUNT) {
    return null;
  }
  if (passable(to)) {
    return findPath(from, to, passable);
  }

  const reached = new Set<number>([from]);
  const queue = [from];

  for (let at = 0; at < queue.length; at++) {
    for (const next of neighbors(queue[at])) {
      if (passable(next) && !reached.has(next)) {
        reached.add(next);
        queue.push(next);
      }
    }
  }

  // Breadth-first order, so of two cells equally close to the target
  // the one found first is the one with the shorter walk to it
  let best = from;
  let closest = stepsBetween(from, to);

  for (const cell of reached) {
    const off = stepsBetween(cell, to);

    if (off < closest) {
      closest = off;
      best = cell;
    }
  }
  // Already as close as the ground allows, which includes a walker with
  // nowhere at all to go
  return best === from ? [] : findPath(from, best, passable);
}

/**
 * The way to somewhere a player can put a hand on the cell from: the
 * ring of eight around it, which is the same reach an interaction has.
 *
 * This is how everything worth pressing is walked to. A pokemon or a
 * landmark stands *on* a cell, so a route that had to end on it would
 * never find one — and standing on top of what you are looking at is
 * not what the game means by walking up to it
 */
export function findPathBeside(from: number, to: number, passable: Passable): number[] | null {
  if (from < 0 || to < 0 || from >= CELL_COUNT || to >= CELL_COUNT) {
    return null;
  }

  const beside = (cell: number): boolean =>
    Math.abs((cell % CHUNK_CELLS) - (to % CHUNK_CELLS)) <= 1 &&
    Math.abs(Math.floor(cell / CHUNK_CELLS) - Math.floor(to / CHUNK_CELLS)) <= 1;

  return search(
    from,
    beside,
    // Two off the straight distance, because the nearest cell that
    // counts as beside is the diagonal one — and a guess that is too
    // high is a route that is not the shortest
    (cell) => Math.max(0, stepsBetween(cell, to) - 2),
    passable,
  );
}
