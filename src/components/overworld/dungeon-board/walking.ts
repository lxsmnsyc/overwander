import type { Moves } from '../../../data/ids/moves';
import { DIRECTIONS, type Direction } from '../../../overworld/dungeon/floor';
import type { CellGrid } from '../../../overworld/dungeon/grid';
import { type Footing, tread } from '../../../overworld/dungeon/tread';

/** How many cells a pressed walk looks through before giving up */
const SEARCH = 2000;

/** The steps that led to `cell`, from where the search began */
function stepsTo(
  came: Map<number, [number, Direction]>,
  from: number,
  cell: number,
): Direction[] | null {
  const steps: Direction[] = [];
  let at = cell;

  while (at !== from) {
    const back = came.get(at);

    if (back == null) {
      return null;
    }
    steps.unshift(back[1]);
    at = back[0];
  }
  return steps;
}

/**
 * The steps from where the player stands to `target`, walked with the
 * floor's own rules, so a slide or a spinner is part of the way rather
 * than around it. A cell a slide only passes over counts as reached, and
 * anything eventful (the stairs, a hole, the way out) is only ever the
 * last step
 */
export default function findWalk(
  grid: CellGrid,
  from: Footing,
  target: number,
  known: ReadonlySet<Moves>,
): Direction[] | null {
  const came = new Map<number, [number, Direction]>();
  const footings = new Map<number, Footing>([[from.at, from]]);
  const queue = [from.at];

  for (let at = 0; at < queue.length && queue.length < SEARCH; at++) {
    const cell = queue[at];

    if (cell === target) {
      return stepsTo(came, from.at, cell);
    }

    const here = footings.get(cell);

    if (here == null) {
      continue;
    }
    for (const direction of DIRECTIONS) {
      const trod = tread(grid, here, direction, known);

      if (trod == null || trod.path.length === 0) {
        continue;
      }
      // Over the target on the way, or ending somewhere eventful on it
      if (trod.path.includes(target) && (trod.event == null || trod.footing.at === target)) {
        const before = stepsTo(came, from.at, cell);

        return before == null ? null : [...before, direction];
      }
      // A step that ends somewhere eventful is only ever taken by hand
      if (trod.event != null || footings.has(trod.footing.at)) {
        continue;
      }
      footings.set(trod.footing.at, trod.footing);
      came.set(trod.footing.at, [cell, direction]);
      queue.push(trod.footing.at);
    }
  }
  return null;
}
