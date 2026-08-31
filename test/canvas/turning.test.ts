import { describe, expect, it } from 'vitest';
import { isTurningPress } from '../../src/components/overworld/chunk-canvas';
import createTwist, { type Finger } from '../../src/canvas/twist';

describe('what turns the board rather than pressing it', () => {
  const LEFT = 0;
  const MIDDLE = 1;
  const RIGHT = 2;

  it('takes the right button, and the Mac gesture that stands in for it', () => {
    expect(isTurningPress({ button: RIGHT, ctrlKey: false })).toBe(true);
    // A trackpad and a Magic Mouse both ship without a right button;
    // control and the left one is what that platform means by a
    // secondary click everywhere else in the system
    expect(isTurningPress({ button: LEFT, ctrlKey: true })).toBe(true);
  });

  it('leaves an ordinary press alone', () => {
    expect(isTurningPress({ button: LEFT, ctrlKey: false })).toBe(false);
    expect(isTurningPress({ button: MIDDLE, ctrlKey: false })).toBe(false);
  });

  it('costs a right-clicking machine nothing', () => {
    // Control-clicking a right button was never a way to press a cell,
    // so counting it as a turn takes nothing away
    expect(isTurningPress({ button: RIGHT, ctrlKey: true })).toBe(true);
  });
});

describe('two fingers turning the board', () => {
  /** A pointer event, as much of one as a twist reads */
  const finger = (id: number, x: number, y: number): Finger => ({
    pointerId: id,
    pointerType: 'touch',
    clientX: x,
    clientY: y,
  });

  it('turns by the angle between the fingers, not by how far they went', () => {
    const twist = createTwist();

    twist.down(finger(1, 100, 100));
    twist.down(finger(2, 200, 100));
    // The pair is set on the first move, so that one turns nothing
    expect(twist.move(finger(2, 200, 100))).toBe(0);
    // The second finger swung a quarter turn round the first
    expect(twist.move(finger(2, 100, 200))).toBeCloseTo(Math.PI / 2, 6);
  });

  it('says nothing while only one finger is down', () => {
    const twist = createTwist();

    twist.down(finger(1, 100, 100));
    expect(twist.turning()).toBe(false);
    // A single finger presses what is under it, so its moves are the
    // caller's rather than the camera's
    expect(twist.move(finger(1, 140, 160))).toBeNull();
  });

  it('leaves a mouse alone', () => {
    const twist = createTwist();

    twist.down({ ...finger(1, 100, 100), pointerType: 'mouse' });
    twist.down({ ...finger(2, 200, 100), pointerType: 'mouse' });
    expect(twist.turning()).toBe(false);
    expect(twist.move({ ...finger(2, 100, 200), pointerType: 'mouse' })).toBeNull();
  });

  it('carries on past due east rather than snapping back the long way', () => {
    const twist = createTwist();

    twist.down(finger(1, 100, 100));
    twist.down(finger(2, 200, 101));
    twist.move(finger(2, 200, 101));
    // Across the line where atan2 flips sign: a small turn, not a
    // whole one back the other way
    const turned = twist.move(finger(2, 200, 99));

    expect(Math.abs(turned ?? 0)).toBeLessThan(0.05);
  });

  it('forgets the angle when a finger arrives or leaves', () => {
    const twist = createTwist();

    twist.down(finger(1, 100, 100));
    twist.down(finger(2, 200, 100));
    twist.move(finger(2, 200, 100));
    twist.up(finger(2, 200, 100));
    twist.down(finger(3, 100, 200));
    // A different pair, so the first move measures rather than turns:
    // the difference across the swap is nothing anybody did
    expect(twist.move(finger(3, 100, 200))).toBe(0);
  });
});
