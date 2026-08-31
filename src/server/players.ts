import 'server-only';
import { asString } from './read';
import getAdminApi from './admin-api';
import { getSql } from './db';
import { normalizeFriendCode } from './friends';

/**
 * Which account a name typed at the command bar means.
 *
 * A player is reachable three ways and staff should not have to know
 * which one they were handed: a nickname, an email address or a
 * friend code all name the same person. Unlike the friend search this
 * refuses nobody, not the caller and not a banned account, because a
 * banned account is exactly who staff are looking for.
 */

/** The word that means whoever is typing */
export const SELF = 'self';

/**
 * How many accounts are read looking for an address.
 *
 * Emails live in Supabase Auth rather than in a table, so there is
 * nothing to query and the list has to be walked. The same ceiling
 * the staff player list uses
 */
const SCAN_LIMIT = 2_000;
const SCAN_PAGE = 1_000;

/** What a player is called, for a line that reports what happened */
export async function nameOf(uid: string): Promise<string> {
  const rows = await getSql()`select nickname from profiles where id = ${uid}`;
  const nickname = asString(rows.at(0)?.nickname);

  return nickname === '' ? 'Unnamed trainer' : nickname;
}

/** The account behind a friend code, whoever it belongs to */
async function byCode(code: string): Promise<string | null> {
  const rows = await getSql()`select player from friend_codes where code = ${code}`;
  const player = asString(rows.at(0)?.player);

  return player === '' ? null : player;
}

/** The account behind an email address, or null where nobody holds it */
async function byEmail(typed: string): Promise<string | null> {
  const wanted = typed.trim().toLowerCase();
  const api = getAdminApi();

  for (let page = 1; page * SCAN_PAGE <= SCAN_LIMIT; page++) {
    const { data, error } = await api.auth.admin.listUsers({ page, perPage: SCAN_PAGE });

    if (error != null) {
      throw new Error(error.message);
    }
    const found = data.users.find((user) => user.email?.toLowerCase() === wanted);

    if (found != null) {
      return found.id;
    }
    if (data.users.length < SCAN_PAGE) {
      break;
    }
  }
  return null;
}

/**
 * The account behind a nickname. An exact one wins outright; failing
 * that the name has to pick out exactly one account, since moving or
 * banning the wrong trainer is worse than being asked to type more
 */
async function byNickname(typed: string): Promise<string | null> {
  const wanted = typed.trim();
  const exact = await getSql()`
    select id from profiles where lower(nickname) = ${wanted.toLowerCase()}
  `;

  if (exact.length === 1) {
    return asString(exact[0].id);
  }
  const like = await getSql()`
    select id from profiles where nickname ilike ${`%${wanted}%`} limit 2
  `;

  return like.length === 1 ? asString(like[0].id) : null;
}

/**
 * Which account a name means, or null for one that names nobody or
 * more than one trainer. An address is told by its `@` and a code by
 * its twelve digits; everything else is a nickname
 */
export default async function findPlayer(caller: string, named: string): Promise<string | null> {
  const typed = named.trim();

  if (typed === '' || typed.toLowerCase() === SELF) {
    return caller;
  }
  if (typed.includes('@')) {
    return byEmail(typed);
  }
  const code = normalizeFriendCode(typed);

  return code == null ? byNickname(typed) : byCode(code);
}
