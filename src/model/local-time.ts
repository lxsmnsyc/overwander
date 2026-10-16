/**
 * Where the player is in the day. The world's instants still come
 * from the server's clock — a device cannot move time — but *which
 * day and hour those instants fall in* is the player's own, read from
 * their zone's offset from UTC.
 *
 * Two things ride on it. A snapshot window is local, so a player
 * walking at night meets what the night pool holds wherever they are.
 * And the offset goes into the seed behind the window, so two players
 * in different zones do not roll the same spawns — one cannot be told
 * what the other's chunk will hold.
 *
 * The offset is minutes east of UTC (+480 for UTC+8), the sign the
 * opposite of `Date.getTimezoneOffset`. It is what the client reports
 * of itself, and a client can misreport it, so everything derived
 * from it is scoped by it: a player who invents a zone gets that
 * zone's world, not a second helping of their own.
 */

/**
 * The furthest a real zone runs either side of UTC
 */
export const MIN_OFFSET = -12 * 60;
export const MAX_OFFSET = 14 * 60;

const MINUTE = 60 * 1000;

/**
 * This device's offset, in minutes east of UTC
 */
export function getLocalOffset(): number {
  return -new Date().getTimezoneOffset();
}

/**
 * This device's locale tag, e.g. `en-PH`
 */
export function getLocale(): string {
  return Intl.DateTimeFormat().resolvedOptions().locale;
}

/**
 * How coarse a real zone is. Every zone on earth is a whole number of
 * quarter hours from UTC, Kathmandu's +5:45 and Eucla's +8:45
 * included, so anything between two of them was never a zone
 */
const ZONE_STEP = 15;

/**
 * An offset as reported by a caller, brought back to a zone that
 * exists. Anything unusable reads as UTC rather than being refused: a
 * broken clock should not stop a player walking.
 *
 * Snapped to the quarter hour as well as clamped, because the offset
 * is part of what the world is seeded and keyed by. Left at the
 * minute, a caller had 1,561 zones to ask the same chunk in and could
 * roll its buried items again in each
 */
export function asOffset(value: unknown): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return 0;
  }
  const minutes = Math.min(MAX_OFFSET, Math.max(MIN_OFFSET, Math.round(value)));

  return Math.round(minutes / ZONE_STEP) * ZONE_STEP;
}

/**
 * The offset as it appears in seeds and ids: a sign and the minutes,
 * e.g. `+480`, `-330`, `+0`. Minutes rather than a zone name because a
 * name carries a slash, which an id cannot
 */
export function toZoneKey(offset: number): string {
  const minutes = asOffset(offset);

  return `${minutes < 0 ? '-' : '+'}${Math.abs(minutes)}`;
}

/**
 * The instant read as local wall-clock milliseconds: the number whose
 * UTC calendar *is* the player's calendar. Windows, days of the year
 * and times of day are all derived from this, so the readers that
 * take a UTC view of a timestamp keep working unchanged
 */
export function toLocalTime(now: number, offset: number): number {
  return now + asOffset(offset) * MINUTE;
}

/**
 * The instant as an ISO 8601 string in the player's own zone, offset
 * and all — `2026-08-10T22:14:03.123+08:00`. The local date, the time
 * of day and the instant behind them are all recoverable from it
 */
export function toLocalISO(now: number, offset: number): string {
  const minutes = asOffset(offset);
  // Shifting the instant makes toISOString print the local wall
  // clock; the trailing Z is then replaced by the offset that
  // actually applies, which is what makes it the same instant again
  const local = new Date(toLocalTime(now, minutes)).toISOString().slice(0, -1);
  const absolute = Math.abs(minutes);
  const hours = String(Math.floor(absolute / 60)).padStart(2, '0');
  const rest = String(absolute % 60).padStart(2, '0');

  return `${local}${minutes < 0 ? '-' : '+'}${hours}:${rest}`;
}
