/**
 * A stored local instant, as a wall clock.
 *
 * Windows and lobbies are stamped in the zone that rolled them —
 * already shifted, not UTC — so they are printed as if they were UTC.
 * Shifting again by the reader's own zone would say a raid opened at
 * an hour nobody was there
 */
export default function wallClock(local: number): string {
  return new Date(local).toISOString().slice(0, 16).replace('T', ' ');
}
