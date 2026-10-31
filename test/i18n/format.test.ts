import { describe, expect, it } from 'vitest';
import describeDate, { describeMoment } from '../../src/core/dates';
import { formatDate, formatMoment, formatNumber, formatRelative } from '../../src/i18n/format';
import { currentLocale, getIntlTag } from '../../src/i18n/locale';

/**
 * Numbers and dates in the active locale. Outside a request the locale
 * is English, which is written the British way, so these are the
 * strings the game showed before the formatters existed.
 */

const NOON = new Date(2026, 7, 12, 14, 5).getTime();
const MINUTE = 60 * 1000;
const DAY = 24 * 60 * MINUTE;

describe('the formatters', () => {
  it('start in English', () => {
    expect(currentLocale()).toBe('en');
    expect(getIntlTag()).toBe('en-GB');
  });

  it('group numbers', () => {
    expect(formatNumber(12_500)).toBe('12,500');
    expect(formatNumber(7)).toBe('7');
  });

  it('write a date as day, short month and year', () => {
    expect(formatDate(NOON)).toBe('12 Aug 2026');
    expect(formatMoment(NOON)).toBe('12 Aug 2026, 14:05');
  });

  it('say a distance in its largest whole unit, up to days', () => {
    expect(formatRelative(NOON - 30 * 1000, NOON)).toBe('30 seconds ago');
    expect(formatRelative(NOON - 5 * MINUTE, NOON)).toBe('5 minutes ago');
    expect(formatRelative(NOON - 3 * 60 * MINUTE, NOON)).toBe('3 hours ago');
    expect(formatRelative(NOON - 3 * DAY, NOON)).toBe('3 days ago');
    expect(formatRelative(NOON + 5 * MINUTE, NOON)).toBe('in 5 minutes');
    expect(formatRelative(NOON, NOON)).toBe('0 seconds ago');
  });
});

describe('describing a date', () => {
  it('gives the distance while it is recent and the date after', () => {
    expect(describeDate(NOON - 2 * DAY, NOON)).toBe('2 days ago');
    expect(describeDate(NOON - 30 * DAY, NOON)).toBe('13 Jul 2026');
    expect(describeMoment(NOON - 30 * DAY, NOON)).toBe('13 Jul 2026, 14:05');
  });

  it('reads a local ISO stamp the way it reads milliseconds', () => {
    const stamp = new Date(NOON).toISOString();

    expect(describeDate(stamp, NOON + 30 * DAY)).toBe('12 Aug 2026');
  });

  it('hands back a stamp it cannot read', () => {
    expect(describeDate('not a date')).toBe('not a date');
  });
});
