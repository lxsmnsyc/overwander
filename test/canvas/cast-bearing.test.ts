import { describe, expect, it } from 'vitest';
import { ASPECT, projectGround } from '../../src/canvas/board';
import { getCast, getSun } from '../../src/canvas/daylight';

/**
 * Which way something points on the screen, in degrees from the right,
 * counting the way the page counts: down is 90
 */
function bearingOf(dx: number, dy: number): number {
  return ((Math.atan2(dy, dx) * 180) / Math.PI + 360) % 360;
}

/**
 * Which way a step on the ground points once the board has drawn it.
 *
 * Taken either side of the board's middle so the perspective, which
 * grows and shrinks with depth, cancels. `north` is a step toward
 * smaller `v`: the board counts down the picture.
 *
 * The projection answers in fractions of the picture and the picture
 * is not square, so the two fractions are not the same length. Putting
 * the aspect back is what turns them into a direction anything drawn
 * would actually take
 */
function groundBearing(east: number, north: number, yaw: number): number {
  const step = 1e-6;
  const from = projectGround({ u: 0.5 - east * step, v: 0.5 + north * step }, yaw);
  const to = projectGround({ u: 0.5 + east * step, v: 0.5 - north * step }, yaw);

  return bearingOf(to.x - from.x, (to.y - from.y) * ASPECT);
}

/** How far apart two bearings are, the short way round. */
function apart(one: number, other: number): number {
  const gap = Math.abs(one - other) % 360;

  return gap > 180 ? 360 - gap : gap;
}

describe("the hour's light on a board that turns", () => {
  // Morning, mid-morning, afternoon and evening: four bearings with
  // some north or south in each, which is the half that was wrong
  const HOURS = [1788159600000, 1788170400000, 1788177600000, 1788195600000];
  const YAWS = [0, 0.4, Math.PI / 2, 2.1, Math.PI, 4.2, (3 * Math.PI) / 2, 5.9];

  it('throws along the ground it lies on, at every hour and every turn', () => {
    for (const hour of HOURS) {
      // Where the sun has got to, asked of the sun rather than of the
      // shadow: a bearing read back out of the thing under test agrees
      // with itself however wrong it is
      const { azimuth } = getSun(hour, 0);
      // Away from the sun, which is what the shadow's own comment
      // says it is: the sun rises in the east and a morning shadow
      // lies to the west
      const east = Math.sin(azimuth);
      const north = Math.cos(azimuth);

      if (getCast(hour, 0, 0).length <= 0) {
        continue;
      }

      for (const yaw of YAWS) {
        const cast = getCast(hour, yaw, 0);
        const drawn = groundBearing(east, north, yaw);

        expect(
          apart(bearingOf(cast.dx, cast.dy), drawn),
          `hour ${hour} at yaw ${yaw.toFixed(2)}`,
        ).toBeLessThan(0.01);
      }
    }
  });

  it('sends a northward shadow up the picture', () => {
    // The one that was inverted: north is the far edge of the board,
    // which is toward the top of the screen
    const north = groundBearing(0, 1, 0);

    expect(north).toBeGreaterThan(180);
    expect(north).toBeLessThan(360);
  });

  it('turns the shadow with the board rather than against it', () => {
    for (const hour of HOURS) {
      const facing = getCast(hour, 0, 0);

      if (facing.length <= 0) {
        continue;
      }
      const half = getCast(hour, Math.PI, 0);
      const turned = apart(bearingOf(facing.dx, facing.dy) + 180, bearingOf(half.dx, half.dy));

      expect(turned, `hour ${hour}`).toBeLessThan(0.01);
    }
  });
});
