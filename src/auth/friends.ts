import type { FoundPlayer, FriendLink, FriendRequests, FriendTie } from './friend-record';
import {
  acceptFriendRequest as acceptOnServerSide,
  blockPlayer as blockOnServerSide,
  dropFriendRequest as dropOnServerSide,
  findPlayerByCode as findOnServerSide,
  getFriendCode as getCodeOnServerSide,
  readFriendLinks,
  readFriendRequests,
  readFriendTie as readTieOnServerSide,
  removeFriend as removeOnServerSide,
  sendFriendRequest as sendOnServerSide,
  unblockPlayer as unblockOnServerSide,
} from '../server/friends';
import { requireReader, requireUid } from '../server/auth';
import check, { LINK_TABLE, TEXT, TOKEN, UID } from '../server/validate';
import { syncServerClock } from './clock';
import { type Unwatch, watchTable } from './supabase';
import { readOnly } from '../utils/server-calls';
import getIdToken from './session';

/**
 * Friends, as the browser sees them.
 *
 * The lists are **followed** rather than fetched: a request that
 * arrives while the panel is open should appear in it, and a
 * friendship accepted in another tab should not be left showing as
 * waiting. The rules hand a player their own rows and nobody else's —
 * see [`friends.md`](../../docs/database/friends.md).
 *
 * Everything that writes is the server's, and so is the lookup by
 * friend code: the codes are readable only by their owners, so a
 * stranger cannot be found without being handed their code.
 */

export { FRIEND_LIMIT, FriendTie, friendActionLabel } from './friend-record';
export type { FoundPlayer, FriendLink, FriendRequests } from './friend-record';

/** Sort by the newest tie first, then by uid so the order is settled */
function byNewest(left: FriendLink, right: FriendLink): number {
  return right.since - left.since || left.uid.localeCompare(right.uid);
}

/**
 * Follow one collection of rows about this player. The field naming
 * *them* is what the query filters on and the other names the player
 * on the far side of the tie
 */
function watchLinks(
  table: 'friends' | 'blocks',
  mine: string,
  uid: string,
  onChange: (rows: FriendLink[]) => void,
): Unwatch {
  const read = async (): Promise<FriendLink[]> =>
    (await readLinksOnServer(await getIdToken(), table)).sort(byNewest);

  return watchTable(table, [`${mine}=eq.${uid}`], read, onChange);
}

async function readLinksOnServer(
  token: string,
  table: 'friends' | 'blocks',
): Promise<FriendLink[]> {
  'use server';
  check(TOKEN, token);
  check(LINK_TABLE, table);
  return readFriendLinks(await requireReader(token), table);
}
readOnly(readLinksOnServer);

/** Everybody this player has agreed with */
export function watchFriends(uid: string, onChange: (rows: FriendLink[]) => void): Unwatch {
  return watchLinks('friends', 'owner', uid, onChange);
}

/** Everybody this player has shut out */
export function watchBlocked(uid: string, onChange: (rows: FriendLink[]) => void): Unwatch {
  return watchLinks('blocks', 'blocker', uid, onChange);
}

/**
 * What is waiting on an answer, both ways: one subscription with a
 * binding per direction, reported together so a reader sees one list
 */
export function watchFriendRequests(
  uid: string,
  onChange: (requests: FriendRequests) => void,
): Unwatch {
  const read = async (): Promise<FriendRequests> => {
    const incoming: FriendLink[] = [];
    const outgoing: FriendLink[] = [];

    for (const row of await readRequestsOnServer(await getIdToken())) {
      if (row.recipient === uid) {
        incoming.push({ uid: row.sender, since: row.sentAt });
      }
      if (row.sender === uid) {
        outgoing.push({ uid: row.recipient, since: row.sentAt });
      }
    }
    return { incoming: incoming.sort(byNewest), outgoing: outgoing.sort(byNewest) };
  };

  return watchTable('friend_requests', [`sender=eq.${uid}`, `recipient=eq.${uid}`], read, onChange);
}

async function readRequestsOnServer(
  token: string,
): Promise<{ sender: string; recipient: string; sentAt: number }[]> {
  'use server';
  check(TOKEN, token);
  return readFriendRequests(await requireReader(token));
}
readOnly(readRequestsOnServer);

/** Where this player stands with another, for the button that offers it */
export async function readFriendTie(other: string): Promise<FriendTie> {
  return tieOnServer(await getIdToken(), other);
}

async function tieOnServer(token: string, other: string): Promise<FriendTie> {
  'use server';
  check(TOKEN, token);
  check(UID, other);
  return readTieOnServerSide(await requireUid(token), other);
}

/**
 * Ask somebody. Crossing a request already coming the other way makes
 * the friendship at once, so this resolves Friends as often as Sent
 */
export async function sendFriendRequest(target: string): Promise<FriendTie> {
  return sendRequestOnServer(await getIdToken(), target);
}

async function sendRequestOnServer(token: string, target: string): Promise<FriendTie> {
  'use server';
  check(TOKEN, token);
  check(UID, target);
  return sendOnServerSide(await requireUid(token), target, await syncServerClock());
}

/** Say yes to somebody waiting */
export async function acceptFriendRequest(from: string): Promise<FriendTie> {
  return acceptOnServer(await getIdToken(), from);
}

async function acceptOnServer(token: string, from: string): Promise<FriendTie> {
  'use server';
  check(TOKEN, token);
  check(UID, from);
  return acceptOnServerSide(await requireUid(token), from, await syncServerClock());
}

/** Decline one, or take back one of your own: the same write either way */
export async function dropFriendRequest(other: string): Promise<FriendTie> {
  return dropRequestOnServer(await getIdToken(), other);
}

async function dropRequestOnServer(token: string, other: string): Promise<FriendTie> {
  'use server';
  check(TOKEN, token);
  check(UID, other);
  return dropOnServerSide(await requireUid(token), other);
}

/** Undo a friendship, from either side */
export async function removeFriend(other: string): Promise<FriendTie> {
  return removeFriendOnServer(await getIdToken(), other);
}

async function removeFriendOnServer(token: string, other: string): Promise<FriendTie> {
  'use server';
  check(TOKEN, token);
  check(UID, other);
  return removeOnServerSide(await requireUid(token), other);
}

/**
 * Shut somebody out. The friendship and both requests go with it, and
 * neither can ask the other again until it is lifted
 */
export async function blockPlayer(other: string): Promise<FriendTie> {
  return blockOnServer(await getIdToken(), other);
}

async function blockOnServer(token: string, other: string): Promise<FriendTie> {
  'use server';
  check(TOKEN, token);
  check(UID, other);
  return blockOnServerSide(await requireUid(token), other, await syncServerClock());
}

/** Let them back in, which does not put back the friendship it undid */
export async function unblockPlayer(other: string): Promise<FriendTie> {
  return unblockOnServer(await getIdToken(), other);
}

async function unblockOnServer(token: string, other: string): Promise<FriendTie> {
  'use server';
  check(TOKEN, token);
  check(UID, other);
  return unblockOnServerSide(await requireUid(token), other);
}

/** The player's own friend code, minted the first time it is asked for */
export async function getMyFriendCode(): Promise<string> {
  return getCodeOnServer(await getIdToken());
}

async function getCodeOnServer(token: string): Promise<string> {
  'use server';
  check(TOKEN, token);
  return getCodeOnServerSide(await requireUid(token));
}

/** The one trainer behind a code, and where the two already stand */
export async function findPlayerByCode(code: string): Promise<FoundPlayer | null> {
  return findOnServer(await getIdToken(), code);
}

async function findOnServer(token: string, code: string): Promise<FoundPlayer | null> {
  'use server';
  check(TOKEN, token);
  check(TEXT, code);
  return findOnServerSide(await requireUid(token), code);
}
