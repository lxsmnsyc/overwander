import { describe, expect, it } from 'vitest';
import { GROUND_DEPTH } from '../src/canvas/tilt';
import { castCorners } from '../src/canvas/placement';
import { getCast } from '../src/canvas/daylight';

/**
 * Which way a shadow falls as the camera walks round the board.
 *
 * The sun stands in the world and the board turns under it, so a
 * player spinning the ground spins every shadow on it: over a whole
 * turn a shadow goes round exactly once and never doubles back. It is
 * the one thing about the light that cannot be checked by reading a
 * single frame.
 */

/** Mid-afternoon, when the sun is well up and well off noon */
const AFTERNOON = 15 * 60 * 60 * 1000;

/** A sprite one square wide standing on the middle of its cell */
const SPRITE = { top: 0, width: 32 };
const FOOT = { footX: 100, footY: 148 };

/** How far the far edge of the laid-down picture is thrown, and which way */
function lean(yaw: number): { x: number; y: number } {
  const thrown = getCast(AFTERNOON, yaw);
  const corners = castCorners(SPRITE, FOOT, thrown);

  return { x: corners[0].x - corners[3].x, y: corners[0].y - corners[3].y };
}

/** The bearing of a lean, as a turn from 0 to 1 */
function bearing(at: { x: number; y: number }): number {
  const angle = Math.atan2(at.y, at.x) / (2 * Math.PI);

  return angle < 0 ? angle + 1 : angle;
}

describe('the way the light throws a shadow', () => {
  it('lays the shadow on the ground the board is drawn at', () => {
    const thrown = getCast(AFTERNOON, 0);

    // The bearing is a direction on the ground, so the part of it that
    // runs away from the camera is laid back by the board's own depth
    expect(Math.hypot(thrown.dx, thrown.dy / GROUND_DEPTH)).toBeCloseTo(1, 6);
  });

  it('turns the shadow with the board, since the sun is not on the camera', () => {
    const still = getCast(AFTERNOON, 0);
    const turned = getCast(AFTERNOON, Math.PI);

    expect(turned.dx).toBeCloseTo(-still.dx, 6);
    expect(turned.dy).toBeCloseTo(-still.dy, 6);
  });

  it('lays the shadow toward the viewer when the sun is behind them', () => {
    const away = castCorners(SPRITE, FOOT, { dx: 0, dy: -0.8, length: 1 });
    const toward = castCorners(SPRITE, FOOT, { dx: 0, dy: 0.8, length: 1 });

    expect(away[0].y).toBeLessThan(FOOT.footY);
    expect(toward[0].y).toBeGreaterThan(FOOT.footY);
  });

  it('goes round once over a whole turn of the camera, and never doubles back', () => {
    const steps = 24;
    let walked = 0;

    for (let step = 0; step < steps; step++) {
      const from = bearing(lean((step * 2 * Math.PI) / steps));
      const to = bearing(lean(((step + 1) * 2 * Math.PI) / steps));
      const gone = ((to - from) % 1) + (to < from ? 1 : 0);

      // Every step of the camera moves the shadow the same way round.
      // Pinned to one side of the picture, as it was when the lean was
      // only ever drawn up the page, it swings back here instead
      expect(gone).toBeGreaterThan(0);
      expect(gone).toBeLessThan(0.5);
      walked += gone;
    }
    expect(walked).toBeCloseTo(1, 6);
  });
});
