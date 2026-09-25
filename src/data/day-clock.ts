/**
 * The clock the time of day and the light are read from. By default it
 * is a game clock: each of the four periods lasts
 * `VITE_TIME_OF_DAY_MINUTES`, so a whole day passes in four of them.
 * With `VITE_REAL_TIME_OF_DAY` set to `true` it is the player's own local clock
 */

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/** How long each period lasts on the game clock when no length is set */
const DEFAULT_PERIOD_MINUTES = 90;

/** Whether the time of day follows the local clock rather than the game clock */
export const REAL_TIME_OF_DAY = ['true', '1'].includes(
  (import.meta.env.VITE_REAL_TIME_OF_DAY ?? '').trim().toLowerCase(),
);

function periodMinutes(): number {
  const set = Number(import.meta.env.VITE_TIME_OF_DAY_MINUTES);

  return Number.isFinite(set) && set > 0 ? set : DEFAULT_PERIOD_MINUTES;
}

/** How long each period lasts on the game clock, in milliseconds */
export const TIME_OF_DAY_PERIOD = periodMinutes() * MINUTE;

/**
 * Where each period starts on a day, and how many hours it spans, in
 * the order the game clock plays them. Night runs past midnight
 */
const SPANS: [start: number, hours: number][] = [
  [4, 6],
  [10, 7],
  [17, 3],
  [20, 8],
];

/**
 * The hour of the day a local timestamp stands at, as a fraction: 13.5
 * is half past one. On the game clock each period's slice is stretched
 * over that period's own hours, so the light still rises at six and a
 * dusk still reads as a dusk
 */
export function clockHour(localTime: number, real = REAL_TIME_OF_DAY): number {
  if (real) {
    return (((localTime % DAY) + DAY) % DAY) / HOUR;
  }

  const cycle = TIME_OF_DAY_PERIOD * SPANS.length;
  const into = ((localTime % cycle) + cycle) % cycle;
  const [start, hours] = SPANS[Math.floor(into / TIME_OF_DAY_PERIOD)];
  const through = (into % TIME_OF_DAY_PERIOD) / TIME_OF_DAY_PERIOD;

  return (start + through * hours) % 24;
}

/** A local timestamp standing at `hour` on the day clock, for a page that picks the hour */
export function atClockHour(hour: number, real = REAL_TIME_OF_DAY): number {
  if (real) {
    return hour * HOUR;
  }
  for (const [index, [start, hours]] of SPANS.entries()) {
    const into = (((hour - start) % 24) + 24) % 24;

    if (into < hours) {
      return (index + into / hours) * TIME_OF_DAY_PERIOD;
    }
  }
  return 0;
}
