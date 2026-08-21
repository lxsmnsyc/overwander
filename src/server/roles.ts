import 'server-only';
import isStaff, { ADMIN_ROLE, canActOn, canAssign, canBan, runsTheGame } from '../auth/staff';
import { requireUid } from './auth';
import { getSql } from './db';
import { asString } from './read';

/**
 * Who is allowed to do what, decided here rather than by the screen
 * that asked.
 *
 * A role is granted out of band (the grants refuse a browser that
 * names its own), and every dashboard call comes through one of the
 * three gates below. The gates read the caller's *stored* role, so a
 * page left open by somebody whose role has since been taken off is a
 * page whose buttons no longer work.
 */

/**
 * Hand a fresh account the keys, but only on a development build.
 *
 * A developer signing up on their own machine wants the whole game
 * open to them without a console visit; a player signing up on the
 * live site wants nothing of the sort. `import.meta.env.DEV` is false
 * in anything built for deployment, so the grant is not merely
 * skipped there: it is not in the bundle.
 *
 * Resolves the role the account now holds, which is an empty string
 * wherever this does nothing
 */
export async function grantDevAdmin(uid: string): Promise<string> {
  if (!import.meta.env.DEV) {
    return '';
  }
  await getSql()`update profiles set role = ${ADMIN_ROLE} where id = ${uid}`;
  return ADMIN_ROLE;
}

/** What an account is, as the store has it */
export async function readRole(uid: string): Promise<string> {
  const rows = await getSql()`select role from profiles where id = ${uid}`;

  return rows.at(0) == null ? '' : asString(rows[0].role);
}

/**
 * The caller, refused unless their profile stands high enough.
 *
 * Every dashboard call goes through one of these rather than trusting
 * the screen that asked: a browser cannot write its own role, but it
 * can call whatever the dashboard calls. Resolves the caller's uid
 */
export async function requireStaff(token: string): Promise<string> {
  const uid = await requireUid(token);

  if (!isStaff(await readRole(uid))) {
    throw new Error('Not allowed');
  }
  return uid;
}

/**
 * The caller, refused unless they run the game itself: the mystery
 * gifts, the raids and the auction board. A moderator keeps order
 * among players and has no business handing out legendaries
 */
export async function requireAdmin(token: string): Promise<string> {
  const uid = await requireUid(token);

  if (!runsTheGame(await readRole(uid))) {
    throw new Error('Not allowed');
  }
  return uid;
}

/**
 * Put a role on an account, or take one off.
 *
 * Both halves are checked against the caller's own standing: the role
 * has to be one they may hand out, and the account has to stand below
 * them. That is what stops an admin from demoting another admin, a
 * moderator from making themselves one, and anybody at all from
 * taking their own authority off, since an account that could do the last
 * would be one nobody can give it back to.
 *
 * Resolves what the account now holds, or null when it was refused
 */
export async function setRole(caller: string, uid: string, wanted: string): Promise<string | null> {
  const mine = await readRole(caller);
  const theirs = await readRole(uid);

  if (caller === uid || !canAssign(mine, theirs, wanted)) {
    return null;
  }
  await getSql()`update profiles set role = ${wanted} where id = ${uid}`;
  return wanted;
}

/**
 * Shut an account out of the game, or let it back in.
 *
 * A ban is the one power every rank of staff has, and the ladder is
 * what it is for: a moderator may ban players, an admin may ban
 * moderators too, and nobody may ban the owner or anybody standing at
 * their own height. The reason is kept with it: a ban nobody can
 * explain is one nobody can appeal.
 *
 * Resolves whether the account is now banned, or null when it was
 * refused
 */
export async function setBan(
  caller: string,
  uid: string,
  banned: boolean,
  reason: string,
): Promise<boolean | null> {
  const mine = await readRole(caller);
  const theirs = await readRole(uid);

  if (caller === uid || !canBan(mine) || !canActOn(mine, theirs)) {
    return null;
  }
  await getSql()`
    update profiles
    set banned = ${banned}, ban_reason = ${banned ? reason : ''}
    where id = ${uid}
  `;
  return banned;
}
