import { readOnly } from '../utils/server-calls';
import { type Unwatch, watchTable } from './watch';
import readAnnouncements from '../server/announcements';

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

/**
 * Every announcement that has not ended yet, soonest first. Needs no
 * token, since the sign-in screen shows them too, and the server's own
 * clock decides what has ended
 */
async function listAnnouncements(): Promise<Announcement[]> {
  'use server';
  return readAnnouncements(Date.now());
}
readOnly(listAnnouncements);

/**
 * Follow the announcements. There are only ever a handful, so every
 * change reads the handful again rather than folding it in
 */
export function watchAnnouncements(onChange: (announcements: Announcement[]) => void): Unwatch {
  return watchTable(TABLE, [], listAnnouncements, onChange);
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
