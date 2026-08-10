import { describe, expect, it } from 'vitest';
import {
  MAX_OFFSET,
  MIN_OFFSET,
  asOffset,
  toLocalISO,
  toLocalTime,
  toZoneKey,
} from '../src/auth/local-time';

/**
 * Late on the 9th in UTC, which is already the 10th east of it
 */
const EVENING = Date.parse('2026-08-09T20:14:03.123Z');

describe('local time', () => {
  it('reads an instant as the wall clock of its zone', () => {
    expect(toLocalTime(EVENING, 0)).toBe(EVENING);
    expect(toLocalTime(EVENING, 480)).toBe(EVENING + 8 * 60 * 60 * 1000);
    expect(toLocalTime(EVENING, -300)).toBe(EVENING - 5 * 60 * 60 * 1000);
  });

  it('stamps the local date and keeps the instant recoverable', () => {
    const manila = toLocalISO(EVENING, 480);
    const lima = toLocalISO(EVENING, -300);

    // The same moment, three calendars: already tomorrow in Manila,
    // still afternoon of the 9th in Lima
    expect(toLocalISO(EVENING, 0)).toBe('2026-08-09T20:14:03.123+00:00');
    expect(manila).toBe('2026-08-10T04:14:03.123+08:00');
    expect(lima).toBe('2026-08-09T15:14:03.123-05:00');

    // The offset is what makes the string the instant again
    expect(Date.parse(manila)).toBe(EVENING);
    expect(Date.parse(lima)).toBe(EVENING);

    // Half-hour zones print their minutes
    expect(toLocalISO(EVENING, 330)).toBe('2026-08-10T01:44:03.123+05:30');
  });

  it('names a zone in a form a document id can carry', () => {
    expect(toZoneKey(480)).toBe('+480');
    expect(toZoneKey(-300)).toBe('-300');
    expect(toZoneKey(0)).toBe('+0');
  });

  it('brings a reported offset back into what a zone can be', () => {
    expect(asOffset(480)).toBe(480);
    expect(asOffset(480.4)).toBe(480);

    // A caller cannot invent a zone a day away to re-roll the world
    expect(asOffset(99999)).toBe(MAX_OFFSET);
    expect(asOffset(-99999)).toBe(MIN_OFFSET);
    expect(asOffset(Number.NaN)).toBe(0);
    expect(asOffset('+08:00')).toBe(0);
    expect(asOffset(undefined)).toBe(0);
  });
});
