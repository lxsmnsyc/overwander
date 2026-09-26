import { describe, expect, it } from 'vitest';
import { TimeOfDay, getTimeOfDay } from '../../src/data/ids/biome';
import { TIME_OF_DAY_PERIOD, atClockHour, clockHour } from '../../src/data/day-clock';

const HOUR = 3_600_000;

describe('the day clock', () => {
  it('reads the local hour by default', () => {
    expect(clockHour(13.5 * HOUR, true)).toBe(13.5);
    expect(getTimeOfDay(3 * HOUR, true)).toBe(TimeOfDay.Night);
    expect(getTimeOfDay(12 * HOUR, true)).toBe(TimeOfDay.Day);
  });

  it('gives each period 90 minutes on the game clock when no length is set', () => {
    expect(TIME_OF_DAY_PERIOD).toBe(90 * 60_000);
  });

  it('plays the four periods in turn on the game clock, a whole day in four of them', () => {
    const periods: TimeOfDay[] = [];

    for (let slice = 0; slice < 5; slice++) {
      periods.push(getTimeOfDay(slice * TIME_OF_DAY_PERIOD + 1, false));
    }
    expect(periods).toEqual([
      TimeOfDay.Morning,
      TimeOfDay.Day,
      TimeOfDay.Evening,
      TimeOfDay.Night,
      TimeOfDay.Morning,
    ]);
  });

  it("stretches each slice over its period's own hours, so the light still rises at six", () => {
    expect(clockHour(0, false)).toBe(4);
    expect(clockHour(TIME_OF_DAY_PERIOD / 3, false)).toBeCloseTo(6);
    expect(clockHour(3.5 * TIME_OF_DAY_PERIOD, false)).toBeCloseTo(0);
  });

  it('turns an hour back into a time that reads as that hour', () => {
    for (const hour of [0, 5, 12.5, 18, 23]) {
      expect(clockHour(atClockHour(hour, false), false)).toBeCloseTo(hour);
      expect(clockHour(atClockHour(hour, true), true)).toBeCloseTo(hour);
    }
  });
});
