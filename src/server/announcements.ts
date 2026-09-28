import 'server-only';
import type { Announcement } from '../auth/announcements';
import { getSql } from './db';
import { asNumber, asString } from './read';

/** Every announcement that has not ended by `now`, soonest first */
export default async function readAnnouncements(now: number): Promise<Announcement[]> {
  const rows = await getSql()`
    select id, message, starts_at, ends_at from announcements
    where ends_at > ${now}
    order by starts_at
  `;
  const found: Announcement[] = [];

  for (const row of rows) {
    found.push({
      id: asNumber(row.id),
      message: asString(row.message),
      startsAt: asNumber(row.starts_at),
      endsAt: asNumber(row.ends_at),
    });
  }
  return found;
}
