import { describe, expect, it } from 'vitest';
import {
  COMPASS_BASE,
  COMPASS_HALO,
  COMPASS_SIZE,
  compassArrow,
  grownArrow,
} from '../../src/components/overworld/chunk-canvas/metrics';

/** How far apart two points are. */
function span(one: { x: number; y: number }, other: { x: number; y: number }): number {
  return Math.hypot(one.x - other.x, one.y - other.y);
}

describe('a compass mark', () => {
  const spot = { x: 100, y: 60 };

  it('puts its point where it is aimed', () => {
    for (const out of [
      { x: 1, y: 0 },
      { x: 0, y: -1 },
      { x: -1, y: 0 },
      { x: Math.SQRT1_2, y: Math.SQRT1_2 },
    ]) {
      const [apex] = compassArrow(spot, out, 1);

      expect(apex.x).toBeCloseTo(spot.x + (out.x * COMPASS_SIZE) / 2, 6);
      expect(apex.y).toBeCloseTo(spot.y + (out.y * COMPASS_SIZE) / 2, 6);
    }
  });

  it('is as tall and as wide as it was measured to be, at any turn', () => {
    for (const angle of [0, 0.7, 2, -1.3, Math.PI]) {
      const out = { x: Math.cos(angle), y: Math.sin(angle) };
      const [apex, one, other] = compassArrow(spot, out, 1);
      const base = { x: (one.x + other.x) / 2, y: (one.y + other.y) / 2 };

      expect(span(apex, base)).toBeCloseTo(COMPASS_SIZE, 6);
      expect(span(one, other)).toBeCloseTo(COMPASS_BASE, 6);
    }
  });

  it('grows with the picture', () => {
    const small = compassArrow(spot, { x: 1, y: 0 }, 1);
    const large = compassArrow(spot, { x: 1, y: 0 }, 3);

    expect(span(large[1], large[2])).toBeCloseTo(span(small[1], small[2]) * 3, 6);
  });

  it('wears a halo that reaches past it on every corner', () => {
    const points = compassArrow(spot, { x: 0, y: -1 }, 2);
    const haloed = grownArrow(points, 2);
    const middle = {
      x: (points[0].x + points[1].x + points[2].x) / 3,
      y: (points[0].y + points[1].y + points[2].y) / 3,
    };

    for (let corner = 0; corner < 3; corner++) {
      expect(span(middle, haloed[corner]) - span(middle, points[corner])).toBeCloseTo(
        COMPASS_HALO * 2,
        6,
      );
    }
  });
});
