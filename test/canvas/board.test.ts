import { describe, expect, it } from 'vitest';
import {
  ASPECT,
  PITCH,
  SPRITE_FACINGS,
  cellAtFraction,
  facingFrom,
  paintOrder,
  projectCell,
  projectCellQuad,
  projectGround,
  unprojectGround,
} from '../../src/canvas/board';
import { CHUNK_CELLS } from '../../src/overworld/chunk';

const LAST = CHUNK_CELLS * CHUNK_CELLS - 1;

describe('the board projection', () => {
  it('lays the ground back under the camera', () => {
    // Not straight down any more, and not edge-on either
    expect(PITCH).toBeGreaterThan(0);
    expect(PITCH).toBeLessThan(90);

    // The picture is wider than it is deep, because the depth is what
    // the tilt foreshortens
    expect(ASPECT).toBeLessThan(1);

    const far = projectGround({ u: 1, v: 0 }).x - projectGround({ u: 0, v: 0 }).x;
    const near = projectGround({ u: 1, v: 1 }).x - projectGround({ u: 0, v: 1 }).x;

    // A trapezoid rather than a squashed square: the row at the back
    // is narrower than the row at the front
    expect(far).toBeLessThan(near);
    // ...and things standing on it are drawn smaller the further back
    // they are
    expect(projectGround({ u: 0.5, v: 0 }).scale).toBeLessThan(
      projectGround({ u: 0.5, v: 1 }).scale,
    );
  });

  it('reads back exactly, which is what makes the board pressable', () => {
    let worst = 0;

    for (let across = 0; across <= 20; across++) {
      for (let back = 0; back <= 20; back++) {
        const point = { u: across / 20, v: back / 20 };
        const there = projectGround(point);
        const home = unprojectGround(there.x, there.y);

        worst = Math.max(worst, Math.abs(home.u - point.u), Math.abs(home.v - point.v));
      }
    }

    // Solved rather than sampled, so the only error is the one
    // floating point brings
    expect(worst).toBeLessThan(1e-9);
  });

  it('puts the middle of every cell back in that cell', () => {
    for (let index = 0; index <= LAST; index++) {
      const middle = projectCell(index);

      expect(cellAtFraction(middle.x, middle.y), `cell ${index}`).toBe(index);
    }
  });

  it('draws every cell inside the picture, corners and all', () => {
    for (let index = 0; index <= LAST; index++) {
      for (const corner of projectCellQuad(index)) {
        expect(corner.x).toBeGreaterThanOrEqual(0);
        expect(corner.x).toBeLessThanOrEqual(1);
        expect(corner.y).toBeGreaterThanOrEqual(0);
        expect(corner.y).toBeLessThanOrEqual(1);
      }
    }
  });

  it('answers nothing for a press beside the board', () => {
    // The picture is a rectangle and the board inside it is not, so
    // the far corners are ground the player is not standing on
    expect(cellAtFraction(0.01, 0.01)).toBeNull();
    expect(cellAtFraction(0.99, 0.01)).toBeNull();
    // And past the edges entirely
    expect(cellAtFraction(-0.2, 0.5)).toBeNull();
    expect(cellAtFraction(0.5, 1.4)).toBeNull();
  });

  it('keeps the rows in order from the back of the board forwards', () => {
    // Which is what the painter relies on to let a pokemon in front
    // stand over the one behind it
    for (let row = 1; row < CHUNK_CELLS; row++) {
      const behind = projectCell((row - 1) * CHUNK_CELLS);
      const front = projectCell(row * CHUNK_CELLS);

      expect(front.y).toBeGreaterThan(behind.y);
      expect(front.scale).toBeGreaterThan(behind.scale);
    }
  });
});

describe('walking the camera round the board', () => {
  const QUARTER = Math.PI / 2;

  it('reads back exactly at any angle', () => {
    for (const yaw of [0, 0.3, 1, QUARTER, 2.5, -0.7, 6]) {
      for (let index = 0; index <= LAST; index += 7) {
        const middle = projectCell(index, yaw);

        expect(cellAtFraction(middle.x, middle.y, yaw), `cell ${index} at ${yaw}`).toBe(index);
      }
    }
  });

  it('keeps the whole board inside the picture however it is turned', () => {
    // The frame is fitted once, to the widest the board ever gets, so
    // that turning it does not make it lurch toward the camera
    for (let step = 0; step < 24; step++) {
      const yaw = (step / 24) * 2 * Math.PI;

      for (const index of [0, CHUNK_CELLS - 1, LAST - CHUNK_CELLS + 1, LAST]) {
        for (const corner of projectCellQuad(index, yaw)) {
          expect(corner.x, `corner at ${yaw}`).toBeGreaterThanOrEqual(-1e-9);
          expect(corner.x).toBeLessThanOrEqual(1 + 1e-9);
          expect(corner.y).toBeGreaterThanOrEqual(-1e-9);
          expect(corner.y).toBeLessThanOrEqual(1 + 1e-9);
        }
      }
    }
  });

  it('paints from the back forwards, whichever way it is turned', () => {
    for (const yaw of [0, 0.8, QUARTER, 3.9]) {
      const order = paintOrder(yaw);

      expect(order).toHaveLength(CHUNK_CELLS * CHUNK_CELLS);
      expect(new Set(order).size).toBe(order.length);

      for (let at = 1; at < order.length; at++) {
        expect(projectCell(order[at], yaw).y).toBeGreaterThanOrEqual(
          projectCell(order[at - 1], yaw).y,
        );
      }
    }
  });

  it('turns what is standing on it with the board', () => {
    // Facing the camera, seen head on, is still facing the camera
    expect(facingFrom(0, 0)).toBe(0);

    // A quarter turn of the camera is two of the eight facings, and
    // it goes the other way: the camera moves, the pokemon does not
    expect(facingFrom(0, QUARTER)).toBe(SPRITE_FACINGS - 2);
    expect(facingFrom(2, QUARTER)).toBe(0);

    // Whatever the angle, it lands on one of the eight
    for (const yaw of [0.1, 1.2, -3, 9]) {
      for (let facing = 0; facing < SPRITE_FACINGS; facing++) {
        const seen = facingFrom(facing, yaw);

        expect(Number.isInteger(seen)).toBe(true);
        expect(seen).toBeGreaterThanOrEqual(0);
        expect(seen).toBeLessThan(SPRITE_FACINGS);
      }
    }
  });
});
