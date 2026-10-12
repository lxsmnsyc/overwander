import { describe, expect, it } from 'vitest';
import { BOARD_CELLS } from '../../src/overworld/board';
import { findPath, findPathBeside, findPathNear, stepsBetween } from '../../src/overworld/path';

const OPEN = (): boolean => true;

function cell(x: number, y: number): number {
  return y * BOARD_CELLS + x;
}

/**
 * Whether a route is one a player could actually walk: every cell is
 * one step from the one before it, starting from where they stood, and
 * no diagonal cuts the corner of a blocked cell
 */
function walkable(
  from: number,
  route: number[],
  passable: (cell: number) => boolean = OPEN,
): boolean {
  let at = from;

  for (const step of route) {
    if (stepsBetween(at, step) !== 1) {
      return false;
    }
    const dx = (step % BOARD_CELLS) - (at % BOARD_CELLS);
    const dy = Math.floor(step / BOARD_CELLS) - Math.floor(at / BOARD_CELLS);

    if (dx !== 0 && dy !== 0 && (!passable(at + dx) || !passable(at + dy * BOARD_CELLS))) {
      return false;
    }
    at = step;
  }
  return true;
}

describe('walking across a chunk', () => {
  it('takes the shortest way when there is nothing in the way', () => {
    const from = cell(2, 3);
    const to = cell(7, 9);
    const route = findPath(from, to, OPEN);

    expect(route).not.toBeNull();
    expect(route).toHaveLength(stepsBetween(from, to));
    expect(route?.at(-1)).toBe(to);
    expect(walkable(from, route ?? [])).toBe(true);
  });

  it('walks a diagonal as one step a cell', () => {
    const from = cell(0, 0);
    const route = findPath(from, cell(5, 5), OPEN) ?? [];

    expect(route).toEqual([cell(1, 1), cell(2, 2), cell(3, 3), cell(4, 4), cell(5, 5)]);
  });

  it('walks a straight line straight, since a diagonal takes longer', () => {
    // A zigzag is as many steps, but every diagonal in it is √2 times
    // as long to walk
    const from = cell(0, 4);

    expect(findPath(from, cell(4, 4), OPEN)).toEqual([
      cell(1, 4),
      cell(2, 4),
      cell(3, 4),
      cell(4, 4),
    ]);
  });

  it('never cuts the corner of something standing there', () => {
    // A tree beside the diagonal: the step past it goes round
    const tree = cell(1, 0);
    const passable = (index: number): boolean => index !== tree;
    const from = cell(0, 0);
    const route = findPath(from, cell(2, 0), passable) ?? [];

    expect(route[0]).not.toBe(cell(1, 1));
    expect(walkable(from, route, passable)).toBe(true);
    expect(route.at(-1)).toBe(cell(2, 0));
  });

  it('does not slip between two blocked corners', () => {
    // Two cells touching only at a corner: shut to a diagonal step
    const passable = (index: number): boolean => index !== cell(1, 0) && index !== cell(0, 1);

    expect(findPath(cell(0, 0), cell(1, 1), passable)).toBeNull();
  });

  it('gives nothing back for a walk to where the walker already is', () => {
    expect(findPath(cell(4, 4), cell(4, 4), OPEN)).toEqual([]);
  });

  it('walks around what is standing in the way', () => {
    // A wall down the middle of the chunk with one gap in it
    const gap = cell(8, 15);
    const passable = (index: number): boolean => index % BOARD_CELLS !== 8 || index === gap;
    const from = cell(0, 0);
    const route = findPath(from, cell(15, 0), passable);

    expect(route).not.toBeNull();
    expect(walkable(from, route ?? [], passable)).toBe(true);
    // Through the one gap there is, which is the far corner of the
    // chunk and back
    expect(route).toContain(gap);
    for (const step of route ?? []) {
      expect(passable(step)).toBe(true);
    }
  });

  it('answers nothing at all when there is no way through', () => {
    const passable = (index: number): boolean => index % BOARD_CELLS !== 8;

    expect(findPath(cell(0, 0), cell(15, 15), passable)).toBeNull();
    // And nothing for a destination that is itself blocked, which is
    // every landmark and everything standing in the chunk
    expect(findPath(cell(0, 0), cell(8, 8), passable)).toBeNull();
  });

  it('stops beside what it is walking up to rather than on it', () => {
    const from = cell(1, 1);
    const to = cell(6, 6);
    // The thing itself is what a walk is never allowed to end on
    const passable = (index: number): boolean => index !== to;
    const route = findPathBeside(from, to, passable);
    const ended = route?.at(-1) ?? from;

    expect(route).not.toBeNull();
    expect(ended).not.toBe(to);
    expect(walkable(from, route ?? [])).toBe(true);
    // Within the ring of eight, which is the same reach an interaction
    // has
    expect(Math.abs((ended % BOARD_CELLS) - (to % BOARD_CELLS))).toBeLessThanOrEqual(1);
    expect(
      Math.abs(Math.floor(ended / BOARD_CELLS) - Math.floor(to / BOARD_CELLS)),
    ).toBeLessThanOrEqual(1);
    // The shortest such walk: one short of the thing itself
    expect(route).toHaveLength(stepsBetween(from, to) - 1);
  });

  it('walks nowhere for something already within reach', () => {
    // Standing diagonally beside it is standing beside it
    expect(findPathBeside(cell(5, 5), cell(6, 6), () => true)).toEqual([]);
  });
});

describe('walking to a cell nobody can stand on', () => {
  it('is the plain walk when the cell is open ground', () => {
    const from = cell(2, 2);
    const to = cell(9, 4);

    expect(findPathNear(from, to, OPEN)).toEqual(findPath(from, to, OPEN));
  });

  it('stops on the nearest cell to it rather than refusing', () => {
    const from = cell(1, 1);
    const to = cell(6, 6);
    const passable = (index: number): boolean => index !== to;
    const route = findPathNear(from, to, passable);
    const ended = route?.at(-1) ?? from;

    expect(route).not.toBeNull();
    expect(walkable(from, route ?? [])).toBe(true);
    // One step off it
    expect(stepsBetween(ended, to)).toBe(1);
    expect(route).toHaveLength(stepsBetween(from, to) - 1);
  });

  it('widens the ring when everything beside it is blocked too', () => {
    const to = cell(6, 6);
    // The cell and its whole neighbourhood: a copse rather than a tree
    const blocked = new Set<number>();

    for (let y = 5; y <= 7; y++) {
      for (let x = 5; x <= 7; x++) {
        blocked.add(cell(x, y));
      }
    }
    const passable = (index: number): boolean => !blocked.has(index);
    const from = cell(1, 1);
    const route = findPathNear(from, to, passable);
    const ended = route?.at(-1) ?? from;

    expect(route).not.toBeNull();
    expect(passable(ended)).toBe(true);
    expect(walkable(from, route ?? [])).toBe(true);
    // Two off it, which is as close as the copse lets anybody stand
    expect(stepsBetween(ended, to)).toBe(2);
  });

  it('prefers where a walker can get to over what is merely close', () => {
    const to = cell(8, 8);
    // A wall the target sits behind: the cells beside it are open
    // ground, and none of them can be reached
    const passable = (index: number): boolean =>
      index !== to && index % BOARD_CELLS !== 6 && Math.floor(index / BOARD_CELLS) !== 6;
    const from = cell(1, 1);
    const route = findPathNear(from, to, passable);
    const ended = route?.at(-1) ?? from;

    expect(route).not.toBeNull();
    expect(walkable(from, route ?? [])).toBe(true);
    // The near corner of the walled-off quarter, not the cell next to
    // the target that a walker could never stand on
    expect(ended).toBe(cell(5, 5));
  });

  it('stands still when there is nowhere at all to go', () => {
    expect(findPathNear(cell(0, 0), cell(6, 6), () => false)).toEqual([]);
  });
});
