import 'server-only';
import { FRIEND_LIMIT, type FoundPlayer, FriendTie } from '../auth/friend-record';
import { type Tx, getSql, tx } from './db';
import { asNumber, asString } from './read';

/**
 * Friendships, requests and blocks, written over the owner
 * connection. Every write is refused to browsers so a player cannot
 * write themselves onto somebody's list; what a client may do is ask,
 * and these are the asks.
 *
 * A friendship is stored twice, one row per direction, so "who are
 * mine" is a primary-key prefix scan from either side.
 */

/** Write both sides of one friendship */
async function befriend(transaction: Tx, left: string, right: string, now: number): Promise<void> {
  const rows = [
    { owner: left, friend: right, since: now },
    { owner: right, friend: left, since: now },
  ];

  await transaction`
    insert into friends ${transaction(rows, 'owner', 'friend', 'since')}
    on conflict do nothing
  `;
}

/**
 * Whether either of them has shut the other out. A block is one-sided
 * to *read* and mutual in what it stops: somebody a player has blocked
 * cannot ask them either
 */
async function blockedBetween(uid: string, other: string): Promise<boolean> {
  const rows = await getSql()`
    select 1 from blocks
    where (blocker = ${uid} and blocked = ${other})
       or (blocker = ${other} and blocked = ${uid})
    limit 1
  `;

  return rows.length > 0;
}

/**
 * Ask somebody to be friends, or answer them: a request that crosses
 * one already coming the other way makes the friendship on the spot,
 * since both sides have now said yes.
 *
 * Resolves where the two now stand. Throws when the asker's list is
 * full or one of them has blocked the other; the second says nothing
 * about which way the block goes
 */
export async function sendFriendRequest(
  uid: string,
  target: string,
  now: number,
): Promise<FriendTie> {
  if (target === '' || target === uid) {
    return FriendTie.None;
  }

  const accounts = await getSql()`select 1 from profiles where id = ${target}`;

  if (accounts.length === 0) {
    return FriendTie.None;
  }
  if (await blockedBetween(uid, target)) {
    throw new Error('That trainer is not taking friend requests');
  }
  if (await isFull(uid)) {
    throw new Error('Your friends list is full');
  }
  return tx(async (transaction) => {
    const already = await transaction`
      select 1 from friends where owner = ${uid} and friend = ${target}
    `;

    if (already.length > 0) {
      return FriendTie.Friends;
    }

    const waiting = await transaction`
      select 1 from friend_requests
      where sender = ${target} and recipient = ${uid}
      for update
    `;

    if (waiting.length > 0) {
      await befriend(transaction, uid, target, now);
      // Both directions go: a crossed pair would otherwise leave the
      // other player holding a request from somebody already a friend
      await transaction`
        delete from friend_requests
        where (sender = ${target} and recipient = ${uid})
           or (sender = ${uid} and recipient = ${target})
      `;
      return FriendTie.Friends;
    }

    await transaction`
      insert into friend_requests (sender, recipient, sent_at)
      values (${uid}, ${target}, ${now})
      on conflict do nothing
    `;

    return FriendTie.Sent;
  });
}

/**
 * Say yes to somebody waiting. Resolves None for a request that is no
 * longer there, which is what answering a cancelled one looks like
 */
export async function acceptFriendRequest(
  uid: string,
  from: string,
  now: number,
): Promise<FriendTie> {
  if (from === '' || from === uid) {
    return FriendTie.None;
  }
  // A block clears what is standing between two players, so this can
  // only catch a request written in the moment one was being set
  if (await blockedBetween(uid, from)) {
    return FriendTie.None;
  }
  if (await isFull(uid)) {
    throw new Error('Your friends list is full');
  }
  return tx(async (transaction) => {
    const asked = await transaction`
      delete from friend_requests
      where sender = ${from} and recipient = ${uid}
    `;

    if (asked.count === 0) {
      return FriendTie.None;
    }
    await befriend(transaction, uid, from, now);
    return FriendTie.Friends;
  });
}

/**
 * Drop what is waiting between two players, whichever way it points.
 * Declining and cancelling are the same write from opposite ends
 */
export async function dropFriendRequest(uid: string, other: string): Promise<FriendTie> {
  await getSql()`
    delete from friend_requests
    where (sender = ${uid} and recipient = ${other})
       or (sender = ${other} and recipient = ${uid})
  `;
  return FriendTie.None;
}

/**
 * Undo a friendship from either side. Both records go: a list that
 * kept one half would show a friend to whom the reader is a stranger
 */
export async function removeFriend(uid: string, other: string): Promise<FriendTie> {
  await unfriend(uid, other);
  return FriendTie.None;
}

/** Take away everything standing between two players */
async function unfriend(uid: string, other: string): Promise<void> {
  await tx(async (transaction) => {
    await transaction`
      delete from friends
      where (owner = ${uid} and friend = ${other})
         or (owner = ${other} and friend = ${uid})
    `;
    await transaction`
      delete from friend_requests
      where (sender = ${uid} and recipient = ${other})
         or (sender = ${other} and recipient = ${uid})
    `;
  });
}

/**
 * Shut somebody out: the friendship and both requests go with it, and
 * neither of them can ask the other again until it is lifted. Nothing
 * tells the blocked player, which is the whole point of a block
 */
export async function blockPlayer(uid: string, other: string, now: number): Promise<FriendTie> {
  if (other === '' || other === uid) {
    return FriendTie.None;
  }
  await unfriend(uid, other);
  await getSql()`
    insert into blocks (blocker, blocked, since)
    values (${uid}, ${other}, ${now})
    on conflict do nothing
  `;
  return FriendTie.Blocked;
}

/** Let them back in. It does not put back the friendship it undid */
export async function unblockPlayer(uid: string, other: string): Promise<FriendTie> {
  await getSql()`delete from blocks where blocker = ${uid} and blocked = ${other}`;
  return FriendTie.None;
}

/**
 * Where one player stands with another, for the button that offers it.
 * A block outranks everything else, since it is what the one press
 * left has to undo
 */
export async function readFriendTie(uid: string, other: string): Promise<FriendTie> {
  if (other === '' || other === uid) {
    return FriendTie.None;
  }

  const sql = getSql();
  const [blocked, friend, sent, received] = await Promise.all([
    sql`select 1 from blocks where blocker = ${uid} and blocked = ${other}`,
    sql`select 1 from friends where owner = ${uid} and friend = ${other}`,
    sql`select 1 from friend_requests where sender = ${uid} and recipient = ${other}`,
    sql`select 1 from friend_requests where sender = ${other} and recipient = ${uid}`,
  ]);

  if (blocked.length > 0) {
    return FriendTie.Blocked;
  }
  if (friend.length > 0) {
    return FriendTie.Friends;
  }
  if (sent.length > 0) {
    return FriendTie.Sent;
  }
  return received.length > 0 ? FriendTie.Received : FriendTie.None;
}

async function isFull(uid: string): Promise<boolean> {
  const rows = await getSql()`
    select count(*)::int as held from friends where owner = ${uid}
  `;

  return asNumber(rows[0]?.held) >= FRIEND_LIMIT;
}

/** Twelve digits in three groups, the shape every code is stored in */
function formatFriendCode(digits: string): string {
  return `${digits.slice(0, 4)}-${digits.slice(4, 8)}-${digits.slice(8, 12)}`;
}

/**
 * A typed code brought to the stored shape, or null for anything that
 * is not twelve digits once the dressing is stripped
 */
export function normalizeFriendCode(typed: string): string | null {
  const digits = typed.replace(/\D/g, '');

  return digits.length === 12 ? formatFriendCode(digits) : null;
}

/**
 * The player's own friend code, minted on first ask.
 *
 * A code rather than an address because a name is not a handle and an
 * address is more than anybody should have to hand out. It is only
 * readable by its owner and resolved through the server, so having
 * one to type means its owner shared it, which is the whole check on
 * who may ask
 */
export async function getFriendCode(uid: string): Promise<string> {
  const sql = getSql();

  for (;;) {
    const held = await sql`select code from friend_codes where player = ${uid}`;

    if (held.at(0) != null) {
      return asString(held[0].code);
    }

    const digits = Array.from({ length: 12 }, () => Math.floor(Math.random() * 10)).join('');
    // A colliding code loses to the unique index and rolls again; a
    // concurrent mint for the same player loses to the primary key
    // and reads back whichever code landed first
    await sql`
      insert into friend_codes (player, code)
      values (${uid}, ${formatFriendCode(digits)})
      on conflict do nothing
    `;
  }
}

/**
 * The one trainer behind a code. Resolves null for a code nobody
 * holds, and for the reader's own: nobody befriends themselves
 */
export async function findPlayerByCode(uid: string, typed: string): Promise<FoundPlayer | null> {
  const code = normalizeFriendCode(typed);

  if (code == null) {
    return null;
  }

  const rows = await getSql()`
    select player, banned from friend_codes
    join profiles on profiles.id = friend_codes.player
    where code = ${code}
  `;
  const found = rows.at(0);

  // Somebody with no profile is not playing yet, and a request
  // written against them would sit forever
  if (found == null || found.player === uid || found.banned === true) {
    return null;
  }

  const other = asString(found.player);

  return { uid: other, tie: await readFriendTie(uid, other) };
}
