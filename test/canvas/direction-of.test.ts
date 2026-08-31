import { describe, expect, it } from 'vitest';
import { directionOf, litFrame } from '../../src/canvas/sprite-sheet';

describe('reading a facing off a screen direction', () => {
  it('names each of the eight', () => {
    // The screen counts down the page, so `Down` is a positive y
    expect(directionOf(0, 1)).toBe('Down');
    expect(directionOf(1, 1)).toBe('DownRight');
    expect(directionOf(1, 0)).toBe('Right');
    expect(directionOf(1, -1)).toBe('UpRight');
    expect(directionOf(0, -1)).toBe('Up');
    expect(directionOf(-1, -1)).toBe('UpLeft');
    expect(directionOf(-1, 0)).toBe('Left');
    expect(directionOf(-1, 1)).toBe('DownLeft');
  });

  it('rounds to the nearest of them', () => {
    expect(directionOf(1, 0.2)).toBe('Right');
    expect(directionOf(1, 0.6)).toBe('DownRight');
    expect(directionOf(-0.2, -1)).toBe('Up');
  });

  it('answers something for a direction that is not one', () => {
    expect(directionOf(0, 0)).toBe('Down');
  });
});

describe('which pose the light lays down', () => {
  it('lays the front down when a thing looks at the light', () => {
    // Facing the light means the light sees its face, whichever way
    // that happens to be
    expect(litFrame('Down', 'Up')).toBe('Down');
    expect(litFrame('Left', 'Right')).toBe('Down');
    expect(litFrame('UpRight', 'DownLeft')).toBe('Down');
  });

  it('lays the back down when a thing looks away from the light', () => {
    expect(litFrame('Down', 'Down')).toBe('Up');
    expect(litFrame('Right', 'Right')).toBe('Up');
  });

  it('lays the right down when the light is off the left', () => {
    // The light on the left throws its shadow to the right, and what
    // it can see of something looking at the camera is that thing's
    // left-hand side
    expect(litFrame('Down', 'Right')).toBe('Right');
    expect(litFrame('Down', 'Left')).toBe('Left');
  });

  it('reads the case that was drawn wrong', () => {
    // A front-facing pokemon with its shadow thrown up and to the
    // right: the light is down and to the left of it, so what the
    // light sees is its front turned a little to the right. Taking the
    // shadow's own bearing for the pose gave `UpRight`, which is the
    // pokemon seen from behind
    expect(litFrame('Down', 'UpRight')).toBe('DownRight');
    expect(litFrame('Down', 'UpRight')).not.toBe('UpRight');
  });
});
