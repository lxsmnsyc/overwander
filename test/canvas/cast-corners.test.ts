import { describe, expect, it } from 'vitest';
import { type ShadowPatch, type SpriteQuad, castCorners } from '../../src/canvas/placement';
import { GROUND_DEPTH } from '../../src/canvas/tilt';

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
  dy: Math.sin(angle) * GROUND_DEPTH,
  length: 2,
}));

/** Twice the area of the quad, which is zero for one nobody can see */
function spread(corners: { x: number; y: number }[]): number {
  const along = { x: corners[0].x - corners[3].x, y: corners[0].y - corners[3].y };
  const across = { x: corners[2].x - corners[3].x, y: corners[2].y - corners[3].y };

  return Math.abs(along.x * across.y - along.y * across.x);
}

describe('a thrown shadow', () => {
  it('keeps the edge under the feet on the feet', () => {
    for (const cast of BEARINGS) {
      const [, , nearRight, nearLeft] = castCorners(STANDING, FOOT, cast);

      // It pivots about the feet rather than sliding off them: a
      // shadow that let go of its caster reads as a second thing lying
      // on the floor
      expect((nearLeft.x + nearRight.x) / 2).toBeCloseTo(FOOT.footX, 6);
      expect((nearLeft.y + nearRight.y) / 2).toBeCloseTo(FOOT.footY, 6);
    }
  });

  it('moves the far edge by exactly what the light throws', () => {
    for (const cast of BEARINGS) {
      const [farLeft, farRight, nearRight, nearLeft] = castCorners(STANDING, FOOT, cast);
      // 200 - 140: the picture reaches 60 above the ground it stands on
      const reach = cast.length * 60;

      expect(farLeft.x - nearLeft.x).toBeCloseTo(cast.dx * reach, 6);
      expect(farLeft.y - nearLeft.y).toBeCloseTo(cast.dy * reach, 6);
      // The two edges stay parallel and the same length: only where
      // the far one sits changes
      expect(farRight.x - nearRight.x).toBeCloseTo(cast.dx * reach, 6);
      expect(farRight.y - nearRight.y).toBeCloseTo(cast.dy * reach, 6);
    }
  });

  it('holds that edge square to the light, by the nearest quarter turn', () => {
    const front = castCorners(STANDING, FOOT, { dx: 0, dy: -GROUND_DEPTH, length: 2 });
    const level = castCorners(STANDING, FOOT, { dx: 1, dy: 0, length: 2 });

    // A light from in front lays the picture down the way it is drawn,
    // its own width running across the screen
    expect(front[3].y).toBeCloseTo(front[2].y, 6);
    expect(front[2].x - front[3].x).toBeCloseTo(STANDING.width, 6);
    // One running square across the screen lays it on its side, so the
    // width runs away from the camera and is foreshortened with the
    // ground it is lying on
    expect(level[3].x).toBeCloseTo(level[2].x, 6);
    expect(Math.abs(level[2].y - level[3].y)).toBeCloseTo(STANDING.width * GROUND_DEPTH, 6);
  });

  it('leans the way the light throws it', () => {
    const east = castCorners(STANDING, FOOT, { dx: 1, dy: 0, length: 2 });
    const west = castCorners(STANDING, FOOT, { dx: -1, dy: 0, length: 2 });

    expect(east[0].x).toBeGreaterThan(east[3].x);
    expect(west[0].x).toBeLessThan(west[3].x);
  });

  it('leans by how tall the thing is and how long the hour makes it', () => {
    const lean = (length: number): number => {
      const [farLeft, , , nearLeft] = castCorners(STANDING, FOOT, { dx: 1, dy: 0, length });

      return farLeft.x - nearLeft.x;
    };

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
  it('always has area, so none of them disappears', () => {
    let thinnest = Number.POSITIVE_INFINITY;

    // Every bearing, at every length the hour can make it. A picture
    // held level at all of them has none left wherever the light runs
    // square across the screen, which is twice a camera turn
    for (let step = 0; step < 720; step++) {
      const angle = (step / 720) * 2 * Math.PI;

      for (const length of [0.4, 1, 2, 3.2]) {
        const corners = castCorners(STANDING, FOOT, {
          dx: Math.cos(angle),
          dy: Math.sin(angle) * GROUND_DEPTH,
          length,
        });

        thinnest = Math.min(thinnest, spread(corners) / length);
      }
    }
    expect(thinnest).toBeGreaterThan(100);
  });
});
