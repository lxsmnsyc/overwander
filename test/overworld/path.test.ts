import { describe, expect, it } from 'vitest';
import { CHUNK_CELLS } from '../../src/overworld/chunk';
import { findPath, findPathBeside, findPathNear, stepsBetween } from '../../src/overworld/path';

const OPEN = (): boolean => true;

function cell(x: number, y: number): number {
  return y * CHUNK_CELLS + x;
}

/**
 * Whether a route is one a player could actually walk: every cell is a
 * straight step from the one before it, starting from where they stood
 */
function walkable(from: number, route: number[]): boolean {
  let at = from;

  for (const step of route) {
    if (stepsBetween(at, step) !== 1) {
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

  it('steps straight, never diagonally', () => {
    const from = cell(0, 0);
    const route = findPath(from, cell(5, 5), OPEN) ?? [];

    // A diagonal would be five steps rather than ten, which is exactly
    // what this must not be
    expect(route).toHaveLength(10);
    expect(walkable(from, route)).toBe(true);
  });

  it('gives nothing back for a walk to where the walker already is', () => {
    expect(findPath(cell(4, 4), cell(4, 4), OPEN)).toEqual([]);
  });

  it('walks around what is standing in the way', () => {
    // A wall down the middle of the chunk with one gap in it
    const gap = cell(8, 15);
    const passable = (index: number): boolean => index % CHUNK_CELLS !== 8 || index === gap;
    const from = cell(0, 0);
    const route = findPath(from, cell(15, 0), passable);

    expect(route).not.toBeNull();
    expect(walkable(from, route ?? [])).toBe(true);
    // Through the one gap there is, which is the far corner of the
    // chunk and back
    expect(route).toContain(gap);
    for (const step of route ?? []) {
      expect(passable(step)).toBe(true);
    }
  });

  it('answers nothing at all when there is no way through', () => {
    const passable = (index: number): boolean => index % CHUNK_CELLS !== 8;

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
    expect(Math.abs((ended % CHUNK_CELLS) - (to % CHUNK_CELLS))).toBeLessThanOrEqual(1);
    expect(
      Math.abs(Math.floor(ended / CHUNK_CELLS) - Math.floor(to / CHUNK_CELLS)),
    ).toBeLessThanOrEqual(1);
    // The shortest such walk: the corner of its ring is the nearest
    // cell that counts as beside it
    expect(route).toHaveLength(stepsBetween(from, to) - 2);
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
    // One step off it: straight beside, never the diagonal, since a
    // diagonal is two steps away on a grid walked in straight lines
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
      index !== to && index % CHUNK_CELLS !== 6 && Math.floor(index / CHUNK_CELLS) !== 6;
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
