import { describe, expect, it } from 'vitest';
import { grownQuad, tileCorners } from '../../src/canvas/tile-quad';
import type { ProjectedPoint } from '../../src/canvas/board';

/**
 * The corners a ground tile is laid on. Both the batched layer and the
 * 2D fallback read them from here, so a board drawn either way puts its
 * tiles in the same places.
 */

/** A cell as the tilt leaves it: the far edge shorter than the near one */
const CELL: ProjectedPoint[] = [
  { x: 2, y: 0, scale: 1 },
  { x: 8, y: 0, scale: 1 },
  { x: 10, y: 10, scale: 1 },
  { x: 0, y: 10, scale: 1 },
];

describe('the corners a tile hangs from', () => {
  it('walks the corner round with the camera', () => {
    expect(tileCorners(CELL, 0).map((corner) => corner.x)).toEqual([2, 8, 10, 0]);
    expect(tileCorners(CELL, 1).map((corner) => corner.x)).toEqual([0, 2, 8, 10]);
    // A full turn is where it started
    expect(tileCorners(CELL, 4)).toEqual(tileCorners(CELL, 0));
  });

  it('takes a turn from either direction', () => {
    expect(tileCorners(CELL, -1)).toEqual(tileCorners(CELL, 3));
  });

  it('grows the quad outward from every corner, keeping the tilt', () => {
    const grown = grownQuad(CELL);

    // Each corner moves away from the middle rather than along one axis
    expect(grown[0].x).toBeLessThan(CELL[0].x);
    expect(grown[0].y).toBeLessThan(CELL[0].y);
    expect(grown[2].x).toBeGreaterThan(CELL[2].x);
    expect(grown[2].y).toBeGreaterThan(CELL[2].y);

    // The far edge is still shorter than the near one: a tile grown
    // into a parallelogram would not sit on the grid drawn under it
    const near = grown[1].x - grown[0].x;
    const far = grown[2].x - grown[3].x;

    expect(near).toBeLessThan(far);
  });

  it('grows by a hair rather than by a cell', () => {
    const grown = grownQuad(CELL);

    expect(Math.abs(grown[0].x - CELL[0].x)).toBeLessThan(0.5);
  });
});
