import { asNumber, asRecordArray, asString } from './__normalize';
import getSupabase, { type Unwatch, watchTable } from './supabase';

/**
 * What the game is saying to everybody: a maintenance window, an event,
 * a part closed while it is fixed. Written from the dashboard, read by
 * anybody, signed in or not, and followed live so an open tab hears it
 * without a reload
 */
export interface Announcement {
  id: number;
  message: string;
  startsAt: number;
  endsAt: number;
}

const TABLE = 'announcements';

/** Every announcement that has not ended yet, soonest first */
async function listAnnouncements(now: number): Promise<Announcement[]> {
  const { data, error } = await getSupabase()
    .from(TABLE)
    .select('id, message, starts_at, ends_at')
    .gt('ends_at', now)
    .order('starts_at');

  if (error != null) {
    throw new Error('The announcements could not be read.');
  }

  const found: Announcement[] = [];

  for (const row of asRecordArray(data)) {
    found.push({
      id: asNumber(row.id),
      message: asString(row.message),
      startsAt: asNumber(row.starts_at),
      endsAt: asNumber(row.ends_at),
    });
  }
  return found;
}

/**
 * Follow the announcements. There are only ever a handful, so every
 * change reads the handful again rather than folding it in
 */
export function watchAnnouncements(
  now: () => number,
  onChange: (announcements: Announcement[]) => void,
): Unwatch {
  return watchTable(TABLE, [], async () => listAnnouncements(now()), onChange);
}

/** The announcements showing at `now`, leaving out any the player has put away */
export function liveAnnouncements(
  announcements: readonly Announcement[],
  now: number,
  dismissed: ReadonlySet<number>,
): Announcement[] {
  const live: Announcement[] = [];

  for (const announcement of announcements) {
    if (
      announcement.startsAt <= now &&
      now < announcement.endsAt &&
      !dismissed.has(announcement.id)
    ) {
      live.push(announcement);
    }
  }
  return live;
}
