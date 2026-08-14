import { describe, expect, it } from 'vitest';
import projectField, {
  type FieldView,
  ringOf,
  ringRadius,
  scaleAt,
  unprojectField,
} from '../../src/canvas/battle/field';

const VIEW: FieldView = { width: 640, height: 360, unit: 12, yaw: 0 };

describe('field projection', () => {
  it('puts the middle of the field in the middle of the picture', () => {
    const middle = projectField({ x: 0, z: 0 }, VIEW);

    expect(middle.x).toBe(320);
    expect(middle.scale).toBe(1);
    expect(middle.visible).toBe(true);
  });

  it('draws what is further off smaller and higher up', () => {
    const near = projectField({ x: 0, z: -6 }, VIEW);
    const far = projectField({ x: 0, z: 6 }, VIEW);

    expect(far.scale).toBeLessThan(1);
    expect(near.scale).toBeGreaterThan(1);
    expect(far.y).toBeLessThan(near.y);
  });

  it('does not fit itself to the picture, however far out the field goes', () => {
    // The whole point of an unbounded field: a pokemon standing well
    // off to the side is drawn off the side, not squeezed back on
    const wide = projectField({ x: 40, z: 0 }, VIEW);

    expect(wide.x).toBeGreaterThan(VIEW.width);
    expect(wide.visible).toBe(true);
  });

  it('draws the same fight the same size however many are in it', () => {
    // Two pokemon and twelve are the same camera: nothing here reads
    // the crowd, so a lobby cannot zoom the field out
    const one = projectField({ x: 4, z: 2 }, VIEW);
    const other = projectField({ x: 4, z: 2 }, VIEW);

    expect(one).toEqual(other);
  });

  it('gives up on anything past the horizon', () => {
    const beyond = projectField({ x: 0, z: 1000 }, VIEW);

    expect(beyond.visible).toBe(false);
    expect(beyond.scale).toBe(0);
  });

  it('turns the field about its middle rather than spinning the picture', () => {
    const straight = projectField({ x: 6, z: 0 }, VIEW);
    const quarter = projectField({ x: 6, z: 0 }, { ...VIEW, yaw: Math.PI / 2 });

    // A quarter turn takes what was off to the right and puts it away
    // from the camera, so it is drawn smaller and higher
    expect(quarter.scale).toBeLessThan(straight.scale);
    expect(quarter.y).toBeLessThan(straight.y);
    expect(quarter.x).toBeCloseTo(320);
  });

  it('brings whoever swings toward the viewer nearer and larger', () => {
    const away = projectField({ x: 0, z: 8 }, VIEW);
    const round = projectField({ x: 0, z: 8 }, { ...VIEW, yaw: Math.PI });

    expect(round.scale).toBeGreaterThan(away.scale);
    expect(round.y).toBeGreaterThan(away.y);
  });

  it('reads back to the place it came from', () => {
    for (const yaw of [0, 0.7, -1.4, Math.PI]) {
      for (const point of [
        { x: 0, z: 0 },
        { x: 5, z: 3 },
        { x: -8, z: -4 },
        { x: 2, z: 9 },
      ]) {
        const view = { ...VIEW, yaw };
        const on = projectField(point, view);
        const back = unprojectField(on.x, on.y, view);

        expect(back?.x, `x at yaw ${yaw}`).toBeCloseTo(point.x, 6);
        expect(back?.z, `z at yaw ${yaw}`).toBeCloseTo(point.z, 6);
      }
    }
  });

  it('reads nothing back from above the horizon', () => {
    expect(unprojectField(320, -4000, VIEW)).toBeNull();
  });

  it('agrees with the scale it hands out', () => {
    expect(projectField({ x: 0, z: 5 }, VIEW).scale).toBeCloseTo(scaleAt(5));
  });
});

describe('ringOf', () => {
  it('stands one alone in the middle of its circle', () => {
    expect(ringOf(1, { x: -8, z: 0 }, 4)).toEqual([{ x: -8, z: 0 }]);
  });

  it('has nothing to place for an empty side', () => {
    expect(ringOf(0, { x: 0, z: 0 }, 4)).toHaveLength(0);
  });

  it('spaces a party evenly around its centre', () => {
    const ring = ringOf(6, { x: -8, z: 0 }, 4);

    expect(ring).toHaveLength(6);
    for (const place of ring) {
      expect(Math.hypot(place.x + 8, place.z)).toBeCloseTo(4);
    }
  });

  it('starts with the one nearest the viewer', () => {
    const [first] = ringOf(4, { x: 0, z: 0 }, 5);

    // Nearest is the smallest z: the axis counts away from the camera
    expect(first.z).toBeCloseTo(-5);
    expect(first.x).toBeCloseTo(0);
  });

  it('keeps the two sides apart', () => {
    const mine = ringOf(6, { x: -9, z: 0 }, 4);
    const theirs = ringOf(1, { x: 9, z: 0 }, 4);

    for (const one of mine) {
      expect(one.x).toBeLessThan(theirs[0].x);
    }
  });
});

describe('ringRadius', () => {
  const MINIMUM = 24;
  const GAP = 17;

  it('keeps its size while there is room on it', () => {
    for (const count of [0, 1, 2, 4, 8]) {
      expect(ringRadius(count, MINIMUM, GAP), `${count} on the ring`).toBe(MINIMUM);
    }
  });

  it('steps outward once there is not', () => {
    expect(ringRadius(9, MINIMUM, GAP)).toBeGreaterThan(MINIMUM);
    expect(ringRadius(12, MINIMUM, GAP)).toBeGreaterThan(ringRadius(9, MINIMUM, GAP));
    expect(ringRadius(16, MINIMUM, GAP)).toBeGreaterThan(ringRadius(12, MINIMUM, GAP));
  });

  it('keeps neighbours the gap apart however many there are', () => {
    for (const count of [9, 10, 12, 16, 24]) {
      const radius = ringRadius(count, MINIMUM, GAP);
      const ring = ringOf(count, { x: 0, z: 0 }, radius);
      const between = Math.hypot(ring[0].x - ring[1].x, ring[0].z - ring[1].z);

      expect(between, `${count} on the ring`).toBeGreaterThanOrEqual(GAP - 1e-9);
    }
  });

  it('never crowds a ring that was already comfortable', () => {
    const ring = ringOf(8, { x: 0, z: 0 }, ringRadius(8, MINIMUM, GAP));
    const between = Math.hypot(ring[0].x - ring[1].x, ring[0].z - ring[1].z);

    expect(between).toBeGreaterThan(GAP);
  });
});
