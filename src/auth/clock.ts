/**
 * The shared clock. Snapshot windows, safari sessions and catch
 * records must not hang off a player's local clock — a skewed or
 * tampered device would disagree about which 5-minute window a chunk
 * is in. Everything time-bound reads the server's clock through
 * here: one round trip measures the offset between the two clocks,
 * and every later read derives from it locally until the offset goes
 * stale.
 *
 * The times themselves are epoch milliseconds, which carry no
 * timezone. Where a calendar is read out of one — the day of the year
 * the species day turns on, a catch date — it is read in UTC, which
 * the server pins for its own process (`src/server/timezone.ts`), so
 * every player's day begins at the same instant whatever the host
 * machine is set to
 */

/**
 * How long a measured offset is trusted before the next read
 * re-measures it
 */
export const CLOCK_RESYNC_INTERVAL = 60 * 1000;

/**
 * The server's clock, in milliseconds. Runs on the server whether
 * the caller is the browser (over RPC) or the server itself. It
 * awaits nothing, but a server function has to be async — the
 * browser reaches it over the network
 */
// oxlint-disable-next-line typescript/require-await
async function fetchServerTime(): Promise<number> {
  'use server';
  return Date.now();
}

/**
 * Milliseconds to add to the local clock to land on the server's
 */
let offset = 0;

/**
 * When the offset was last measured, on the local clock
 */
let measuredAt = Number.NEGATIVE_INFINITY;

/**
 * The in-flight measurement, so concurrent callers share one round
 * trip instead of each spending their own
 */
let pending: Promise<void> | null = null;

async function measure(): Promise<void> {
  const before = Date.now();
  const server = await fetchServerTime();
  const after = Date.now();

  // Assume a symmetric round trip: the server read its clock around
  // the midpoint of the two local readings
  offset = server + (after - before) / 2 - after;
  measuredAt = after;
}

/**
 * The server's current time, derived from the last measured offset.
 * Cheap and synchronous, but only meaningful once syncServerClock
 * has measured the offset at least once — before then it is the
 * local clock
 */
export function serverNow(): number {
  return Date.now() + offset;
}

/**
 * The server's current time, re-measuring the offset when it is
 * missing or stale. Await this at the start of anything time-bound;
 * use serverNow for the reads that follow
 */
export async function syncServerClock(force = false): Promise<number> {
  if (force || Date.now() - measuredAt >= CLOCK_RESYNC_INTERVAL) {
    pending ??= measure().finally(() => {
      pending = null;
    });
    await pending;
  }
  return serverNow();
}
