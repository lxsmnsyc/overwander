import 'server-only';
import createPasswordLink from '../../db/password-link';
import { canActOn, runsTheGame } from '../auth/staff';
import { getSql } from './db';
import { readRole } from './roles';
import { StaffAction, recordStaffAction } from './staff-log';

/** Where the game is opened, which a password link points at */
function siteOrigin(): string {
  const origin = process.env.BETTER_AUTH_URL ?? '';

  return origin === '' ? 'http://localhost:3000' : origin;
}

/**
 * A password link for another account. It hands over the account, so
 * only staff who run the game may make one, and only for an account
 * below their own. Resolves null when refused
 */
export default async function makePasswordLink(
  caller: string,
  uid: string,
): Promise<string | null> {
  const [mine, theirs, exists] = await Promise.all([
    readRole(caller),
    readRole(uid),
    getSql()`select 1 from users where id = ${uid}`,
  ]);

  if (caller === uid || exists.length === 0 || !runsTheGame(mine) || !canActOn(mine, theirs)) {
    return null;
  }

  const link = await createPasswordLink(getSql(), uid, siteOrigin());

  await recordStaffAction(caller, StaffAction.PasswordLink, uid, {});
  return link;
}
