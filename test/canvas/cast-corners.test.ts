import { describe, expect, it } from 'vitest';
import { type ShadowPatch, type SpriteQuad, castCorners } from '../../src/canvas/placement';

/**
 * A pokemon 40 wide whose picture reaches 60 above the ground it
 * stands on. Only the part of a quad the throw reads
 */
const STANDING: Pick<SpriteQuad, 'top' | 'width' | 'flip'> = { top: 140, width: 40 };

/** Where it stands */
const FOOT: Pick<ShadowPatch, 'footX' | 'footY'> = { footX: 100, footY: 200 };

/** Every bearing the board's light is thrown at, laid back with it. */
const BEARINGS = [0, 0.6, 1.4, 2.9, -0.8, -2.2].map((angle) => ({
  dx: Math.cos(angle),
  dy: Math.sin(angle) * 0.45,
  length: 2,
}));

describe('a thrown shadow', () => {
  it('leaves the edge under the feet exactly where the picture put it', () => {
    for (const cast of BEARINGS) {
      const [, , nearRight, nearLeft] = castCorners(STANDING, FOOT, cast);

      // Level, centred and full width at every bearing: the near edge
      // is the one thing about a shadow that never moves
      expect(nearLeft.y).toBeCloseTo(FOOT.footY, 6);
      expect(nearRight.y).toBeCloseTo(FOOT.footY, 6);
      expect((nearLeft.x + nearRight.x) / 2).toBeCloseTo(FOOT.footX, 6);
      expect(nearRight.x - nearLeft.x).toBeCloseTo(STANDING.width, 6);
    }
  });

  it('leans the far edge and nothing else', () => {
    for (const cast of BEARINGS) {
      const [farLeft, farRight, nearRight, nearLeft] = castCorners(STANDING, FOOT, cast);

      // A skew: both edges stay level and the same width, and only
      // where the far one sits changes
      expect(farLeft.y).toBeCloseTo(farRight.y, 6);
      expect(farRight.x - farLeft.x).toBeCloseTo(nearRight.x - nearLeft.x, 6);
    }
  });

  it('leans the way the light throws it', () => {
    const east = castCorners(STANDING, FOOT, { dx: 1, dy: 0, length: 2 });
    const west = castCorners(STANDING, FOOT, { dx: -1, dy: 0, length: 2 });

    expect(east[0].x).toBeGreaterThan(east[3].x);
    expect(west[0].x).toBeLessThan(west[3].x);
  });

  it('never folds onto the edge it stands on', () => {
    for (const cast of BEARINGS) {
      const [farLeft, , , nearLeft] = castCorners(STANDING, FOOT, cast);

      // The hour a lean alone would fold flat is the one where the
      // light runs square across the screen, and what keeps it open is
      // the board settling away from the camera
      expect(Math.abs(farLeft.y - nearLeft.y)).toBeGreaterThan(1);
    }
  });

  it('leans by how tall the thing is and how long the hour makes it', () => {
    const lean = (length: number): number => {
      const [farLeft, , , nearLeft] = castCorners(STANDING, FOOT, { dx: 1, dy: 0, length });

      return farLeft.x - nearLeft.x;
    };

    // 200 - 140: the picture reaches 60 above the ground it stands on
    expect(lean(1)).toBeCloseTo(60, 6);
    expect(lean(2)).toBeCloseTo(120, 6);
    expect(lean(0)).toBeCloseTo(0, 6);
  });

  it('throws nothing from what is already lying on the ground', () => {
    const flat = { ...STANDING, top: FOOT.footY + 10 };
    const [farLeft, , , nearLeft] = castCorners(flat, FOOT, { dx: 1, dy: 0.4, length: 3 });

    expect(farLeft.x).toBeCloseTo(nearLeft.x, 6);
    expect(farLeft.y).toBeCloseTo(nearLeft.y, 6);
  });

  it('turns its width round with a mirrored picture', () => {
    const cast = { dx: 0, dy: -1, length: 1 };
    const facing = castCorners(STANDING, FOOT, cast);
    const mirrored = castCorners({ ...STANDING, flip: true }, FOOT, cast);

    expect(mirrored[0].x).toBeCloseTo(facing[1].x, 6);
    expect(mirrored[1].x).toBeCloseTo(facing[0].x, 6);
  });
});

describe('a shadow at every bearing the day can throw', () => {
  it('always has height, so none of them disappears', () => {
    const FOOT_AT = { footX: 100, footY: 200 };
    let thinnest = Number.POSITIVE_INFINITY;

    // Every bearing, at every length the hour can make it: the pair
    // that used to cancel is somewhere in here
    for (let step = 0; step < 720; step++) {
      const angle = (step / 720) * 2 * Math.PI;

      for (const length of [0.4, 1, 2, 3.2]) {
        const [farLeft, , , nearLeft] = castCorners(STANDING, FOOT_AT, {
          dx: Math.cos(angle),
          dy: Math.sin(angle) * 0.866,
          length,
        });

        thinnest = Math.min(thinnest, Math.abs(farLeft.y - nearLeft.y) / length);
      }
    }
    expect(thinnest).toBeGreaterThan(1);
  });
});
