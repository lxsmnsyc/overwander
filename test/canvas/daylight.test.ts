import { describe, expect, it } from 'vitest';
import { getAmbient, getCast, getSun, latitudeOf } from '../../src/canvas/daylight';
import { WORLD_MAX } from '../../src/overworld/world';

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

  it('warms the wash through the afternoon, not only at the horizon', () => {
    const afternoon = getAmbient(at(16));
    const sunset = getAmbient(at(18));
    const night = getAmbient(at(23));

    // The golden hour is a stretch of the day rather than a minute of
    // it: the light is already warming while the sun is well up
    expect(afternoon.warmth).toBeGreaterThan(0);
    expect(sunset.warmth).toBeGreaterThan(afternoon.warmth);
    // And the wash it is multiplied through warms with it, so an
    // evening is amber rather than a dimmer blue
    expect(sunset.shade).not.toBe(night.shade);
    expect(afternoon.shade).not.toBe(night.shade);
  });

  it('reads the same hour the same way whatever day it is', () => {
    const DAY = 24 * HOUR;

    expect(getSun(at(9)).elevation).toBeCloseTo(getSun(at(9) + DAY * 400).elevation, 6);
  });

  it('turns the shadows with the ground', () => {
    const noon = at(9);
    const still = getCast(noon);
    const quarter = getCast(noon, Math.PI / 2);

    // A quarter turn of the board swings the shadow a quarter of the
    // way round with it: what was cast east now lies north, flattened
    // by the same amount the ground is
    expect(quarter.dx).toBeCloseTo(-still.dy / 0.45, 6);
    expect(quarter.dy).toBeCloseTo(still.dx * 0.45, 6);

    // Half a turn puts it the other way about entirely
    const half = getCast(noon, Math.PI);

    expect(half.dx).toBeCloseTo(-still.dx, 6);
    expect(half.dy).toBeCloseTo(-still.dy, 6);

    // What the sun is doing has not changed: only where the ground is
    // facing
    expect(quarter.length).toBeCloseTo(still.length, 6);
    expect(quarter.alpha).toBeCloseTo(still.alpha, 6);
  });

  it('keeps the day the same length wherever the chunk is', () => {
    // The spawn pools turn over on the hour, so the sun has to rise
    // and set with them however far north the chunk sits
    for (const latitude of [0, 0.5, 1, -1]) {
      expect(getSun(at(6), latitude).elevation).toBeCloseTo(0, 6);
      expect(getSun(at(18), latitude).elevation).toBeCloseTo(0, 6);
      expect(getSun(at(12), latitude).elevation).toBeGreaterThan(0);
      expect(getSun(at(0), latitude).elevation).toBeLessThan(0);
    }
  });

  it('lowers the sun toward the edges of the world', () => {
    const middle = getSun(at(12)).elevation;
    const halfway = getSun(at(12), 0.5).elevation;
    const edge = getSun(at(12), 1).elevation;

    expect(middle).toBeCloseTo(1, 6);
    expect(halfway).toBeLessThan(middle);
    expect(edge).toBeLessThan(halfway);
    // A hard winter rather than the arctic: the sun still gets up
    expect(edge).toBeGreaterThan(0.4);
    // Which end is north does not matter — the two halves are alike
    expect(getSun(at(12), -1).elevation).toBeCloseTo(edge, 6);
  });

  it('throws longer, fainter shadows and a deeper wash out there', () => {
    const middle = getCast(at(12));
    const edge = getCast(at(12), 0, 1);

    expect(edge.length).toBeGreaterThan(middle.length);
    expect(edge.alpha).toBeLessThanOrEqual(middle.alpha);

    // Mid-morning at the edge is still a low sun, so it keeps the
    // colour and the depth of one — at the middle of the world that
    // hour is already plain daylight
    expect(getAmbient(at(8), 1).depth).toBeGreaterThan(getAmbient(at(8)).depth);
    expect(getAmbient(at(8), 1).warmth).toBeGreaterThan(getAmbient(at(8)).warmth);
  });

  it('maps a chunk row onto that scale, and stops at the edges', () => {
    expect(latitudeOf(0)).toBe(0);
    expect(latitudeOf(WORLD_MAX)).toBeCloseTo(1, 6);
    expect(latitudeOf(WORLD_MAX * 10)).toBe(1);
    expect(latitudeOf(-WORLD_MAX * 10)).toBe(-1);
  });
});
