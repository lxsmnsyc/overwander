/**
 * The shared clock. A device's clock can be skewed or tampered with,
 * so everything time-bound reads the server's instant through here:
 * one round trip measures the offset between the two clocks, and
 * every later read derives from it until the offset goes stale.
 *
 * Which hour and day that instant falls in is always the player's
 * own: it is read in their zone through localNow
 */

import { getLocalOffset, toLocalTime } from './local-time';

/**
 * How long a measured offset is trusted before the next read
 * re-measures it. Two clocks barely drift apart in half an hour, and
 * every measurement is a server call
 */
export const CLOCK_RESYNC_INTERVAL = 30 * 60 * 1000;

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
  // the midpoint of the two local readings. Rounded, so every derived
  // stamp stays a whole millisecond — bigint columns refuse halves
  offset = Math.round(server + (after - before) / 2 - after);
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
 * The player's moment: the server's instant on the player's own wall
 * clock. Spawns, weather and the day are all windowed off this, so
 * anything that shows one of them reads it here rather than pairing a
 * clock and a zone itself
 */
export function localNow(zone: number = getLocalOffset()): number {
  return toLocalTime(serverNow(), zone);
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
