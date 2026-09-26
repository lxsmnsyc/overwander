import 'server-only';
import { getSql, jsonOf } from './db';
import { ServerFlag, isFlagOn } from './flags';

/**
 * A record of what staff did, kept while `STAFF_LOG` is on.
 *
 * Every change staff can make passes through here once it has landed:
 * roles, bans, gifts and teleports. The record is written after the
 * change rather than inside it, and a record that fails is swallowed,
 * the way rAthena's own logs are: a ban that did not happen because
 * its log line could not be written is worse than a missing line.
 */
export const enum StaffAction {
  Role = 'role',
  Ban = 'ban',
  Gift = 'gift',
  Teleport = 'teleport',
}

export async function recordStaffAction(
  actor: string,
  action: StaffAction,
  target: string | null,
  detail: Record<string, unknown>,
): Promise<void> {
  if (!isFlagOn(ServerFlag.StaffLog)) {
    return;
  }

  const sql = getSql();

  try {
    await sql`
      insert into staff_actions (actor, action, target, detail, at)
      values (${actor}, ${action}, ${target}, ${jsonOf(sql, detail)}, ${Date.now()})
    `;
  } catch {
    // The change itself has already landed
  }
}
