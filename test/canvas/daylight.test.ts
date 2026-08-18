import { describe, expect, it } from 'vitest';
import { getAmbient, getCast, getSun } from '../../src/canvas/daylight';

/**
 * The light over the overworld, which is a curve rather than four
 * settings: what these check is that it moves the way the sun does,
 * not that any one hour has a particular colour.
 */

const HOUR = 3_600_000;

/** A local time at that hour of the day, which is what the light reads */
function at(hour: number): number {
  return hour * HOUR;
}

describe('daylight', () => {
  it('puts the sun up by day and down by night', () => {
    expect(getSun(at(12)).elevation).toBeCloseTo(1, 1);
    expect(getSun(at(6)).elevation).toBeCloseTo(0, 1);
    expect(getSun(at(18)).elevation).toBeCloseTo(0, 1);
    expect(getSun(at(0)).elevation).toBeLessThan(0);
    expect(getSun(at(3)).elevation).toBeLessThan(0);
  });

  it('swings the light across the sky as the day goes', () => {
    // The sun rises in the east, which is the right of a board drawn
    // with north at the top: a morning shadow lies to the left of what
    // throws it and an evening one to the right
    expect(getCast(at(8)).dx).toBeLessThan(0);
    expect(getCast(at(16)).dx).toBeGreaterThan(0);
  });

  it('lengthens the shadows as the sun drops, and drops them at dusk', () => {
    const noon = getCast(at(12));
    const evening = getCast(at(17));

    expect(noon.length).toBeLessThan(evening.length);
    expect(noon.alpha).toBeGreaterThan(evening.alpha);
    // Nothing to cast from once it is down: what is left is the patch
    // of ground the sprite sits on
    expect(getCast(at(21)).length).toBe(0);
    expect(getCast(at(2)).length).toBe(0);
  });

  it('darkens by night and warms at the horizons', () => {
    const noon = getAmbient(at(12));
    const dusk = getAmbient(at(18));
    const night = getAmbient(at(1));

    expect(noon.depth).toBe(0);
    expect(noon.warmth).toBe(0);
    // Dusk is dimmer than noon as well as warmer — a low sun that only
    // added colour would read as brighter than midday
    expect(dusk.depth).toBeGreaterThan(noon.depth);
    // A low sun is the colour in the day; the small hours are the dark
    expect(dusk.warmth).toBeGreaterThan(0);
    expect(night.depth).toBeGreaterThan(dusk.depth);
    expect(night.depth).toBeLessThan(1);
  });

  it('reads the same hour the same way whatever day it is', () => {
    const DAY = 24 * HOUR;

    expect(getSun(at(9)).elevation).toBeCloseTo(getSun(at(9) + DAY * 400).elevation, 6);
  });
});
