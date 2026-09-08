import 'server-only';
import { asRaidRecord } from '../../auth/raid-record';
import { LobbyRole } from '../../auth/lobby-role';
import { getSql } from '../db';
import { readRaid } from '../raid-io';
import { asString } from '../read';

/** Asking somebody into a lobby, and turning the ask down */
/**
 * Call a friend into a lobby, to fight or to watch. Anybody standing
 * in it may ask — the host, or anyone with a team — and only of their
 * own friends, which is what keeps an invite from being spam. One row
 * per lobby and friend; asking again changes what they were called in
 * as.
 *
 * Resolves false when the raid is gone or started, the sender is not
 * in it, the two are not friends, or the friend already has a team
 * there
 */
export async function inviteToRaid(
  uid: string,
  lobby: string,
  friend: string,
  now: number,
  role: LobbyRole = LobbyRole.Fighter,
): Promise<boolean> {
  if (friend === '' || friend === uid) {
    return false;
  }

  const raid = await readRaid(lobby);

  if (raid == null || raid.battle != null) {
    return false;
  }

  const sql = getSql();
  const [ties, standing] = await Promise.all([
    sql`select 1 from friends where owner = ${uid} and friend = ${friend}`,
    sql`select player from teams where raid_id = ${lobby} and player in (${uid}, ${friend})`,
  ]);
  const there = new Set(standing.map((row) => asString(row.player)));

  if (ties.length === 0) {
    return false;
  }
  if (asRaidRecord(raid).host !== uid && !there.has(uid)) {
    return false;
  }
  if (there.has(friend)) {
    return false;
  }

  await sql`
    insert into raid_invites (raid_id, sender, recipient, role, sent_at)
    values (${lobby}, ${uid}, ${friend}, ${role}, ${now})
    on conflict (raid_id, recipient) do update
      set sender = ${uid}, role = ${role}, sent_at = ${now}
  `;
  return true;
}

/**
 * Put an invite away unanswered. The row is the recipient's to drop,
 * and dropping one that is already gone is nothing
 */
export async function declineRaidInvite(uid: string, lobby: string): Promise<void> {
  await getSql()`
    delete from raid_invites where raid_id = ${lobby} and recipient = ${uid}
  `;
}
