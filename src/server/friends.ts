import 'server-only';
import {
  BLOCK_COLLECTION,
  FRIEND_COLLECTION,
  FRIEND_REQUEST_COLLECTION,
  PROFILE_COLLECTION,
  blockEntryId,
  friendEntryId,
  friendRequestId,
} from '../auth/collections';
import { FRIEND_LIMIT, type FoundPlayer, FriendTie } from '../auth/friend-record';
import { getAdminAuth, getAdminFirestore } from './firebase';

/**
 * Who knows whom, decided here because a client that could write a
 * friendship could put itself on somebody else's list.
 *
 * A friendship is stored **twice**, one document from each side, so
 * that "who are mine" is one query rather than a scan of everybody's.
 * A request is stored once, pointing one way, and a block the same —
 * all three under an id made of the two uids, which is what makes
 * asking twice harmless.
 *
 * Reading them is the browser's: the rules hand a player their own
 * rows and nobody else's, so the lists follow the store live. Only the
 * writes and the lookup by address are here.
 */

type Transaction = FirebaseFirestore.Transaction;

/** Write both sides of one friendship */
function befriend(transaction: Transaction, left: string, right: string, now: number): void {
  const db = getAdminFirestore();

  for (const [owner, friend] of [
    [left, right],
    [right, left],
  ]) {
    transaction.set(db.collection(FRIEND_COLLECTION).doc(friendEntryId(owner, friend)), {
      owner,
      friend,
      since: now,
    });
  }
}

/**
 * Whether either of them has shut the other out. A block is one-sided
 * to *read* and mutual in what it stops: somebody a player has blocked
 * cannot ask them either
 */
async function blockedBetween(uid: string, other: string): Promise<boolean> {
  const db = getAdminFirestore();
  const found = await db.getAll(
    db.collection(BLOCK_COLLECTION).doc(blockEntryId(uid, other)),
    db.collection(BLOCK_COLLECTION).doc(blockEntryId(other, uid)),
  );

  return found.some((snapshot) => snapshot.exists);
}

/**
 * Ask somebody to be friends, or answer them: a request that crosses
 * one already coming the other way makes the friendship on the spot,
 * since both sides have now said yes.
 *
 * Resolves where the two now stand. Throws when the asker's list is
 * full or one of them has blocked the other — the second says nothing
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
  const db = getAdminFirestore();
  const account = await db.collection(PROFILE_COLLECTION).doc(target).get();

  if (!account.exists) {
    return FriendTie.None;
  }
  if (await blockedBetween(uid, target)) {
    throw new Error('That trainer is not taking friend requests');
  }
  if (await isFull(uid)) {
    throw new Error('Your friends list is full');
  }
  return db.runTransaction(async (transaction) => {
    const mine = db.collection(FRIEND_COLLECTION).doc(friendEntryId(uid, target));
    const asked = db.collection(FRIEND_REQUEST_COLLECTION).doc(friendRequestId(uid, target));
    const theirs = db.collection(FRIEND_REQUEST_COLLECTION).doc(friendRequestId(target, uid));
    const [already, sent, waiting] = await transaction.getAll(mine, asked, theirs);

    if (already.exists) {
      return FriendTie.Friends;
    }
    if (waiting.exists) {
      befriend(transaction, uid, target, now);
      transaction.delete(theirs);
      // Both directions go: a crossed pair would otherwise leave the
      // other player holding a request from somebody already a friend
      transaction.delete(asked);
      return FriendTie.Friends;
    }
    if (sent.exists) {
      return FriendTie.Sent;
    }
    transaction.set(asked, { from: uid, to: target, sentAt: now });
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
  const db = getAdminFirestore();

  return db.runTransaction(async (transaction) => {
    const asking = db.collection(FRIEND_REQUEST_COLLECTION).doc(friendRequestId(from, uid));
    const request = await transaction.get(asking);

    if (!request.exists) {
      return FriendTie.None;
    }
    befriend(transaction, uid, from, now);
    transaction.delete(asking);
    return FriendTie.Friends;
  });
}

/**
 * Drop what is waiting between two players, whichever way it points.
 * Declining and cancelling are the same write from opposite ends
 */
export async function dropFriendRequest(uid: string, other: string): Promise<FriendTie> {
  const db = getAdminFirestore();
  const batch = db.batch();

  batch.delete(db.collection(FRIEND_REQUEST_COLLECTION).doc(friendRequestId(uid, other)));
  batch.delete(db.collection(FRIEND_REQUEST_COLLECTION).doc(friendRequestId(other, uid)));
  await batch.commit();
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
  const db = getAdminFirestore();
  const batch = db.batch();

  batch.delete(db.collection(FRIEND_COLLECTION).doc(friendEntryId(uid, other)));
  batch.delete(db.collection(FRIEND_COLLECTION).doc(friendEntryId(other, uid)));
  batch.delete(db.collection(FRIEND_REQUEST_COLLECTION).doc(friendRequestId(uid, other)));
  batch.delete(db.collection(FRIEND_REQUEST_COLLECTION).doc(friendRequestId(other, uid)));
  await batch.commit();
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
  await getAdminFirestore()
    .collection(BLOCK_COLLECTION)
    .doc(blockEntryId(uid, other))
    .set({ blocker: uid, blocked: other, since: now });
  return FriendTie.Blocked;
}

/** Let them back in. It does not put back the friendship it undid */
export async function unblockPlayer(uid: string, other: string): Promise<FriendTie> {
  await getAdminFirestore().collection(BLOCK_COLLECTION).doc(blockEntryId(uid, other)).delete();
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
  const db = getAdminFirestore();
  // Read by position rather than by document id: a friendship, a
  // request and a block between the same two players are the same id
  // in different collections, so an id alone cannot say which was found
  const [blocked, friend, sent, received] = await db.getAll(
    db.collection(BLOCK_COLLECTION).doc(blockEntryId(uid, other)),
    db.collection(FRIEND_COLLECTION).doc(friendEntryId(uid, other)),
    db.collection(FRIEND_REQUEST_COLLECTION).doc(friendRequestId(uid, other)),
    db.collection(FRIEND_REQUEST_COLLECTION).doc(friendRequestId(other, uid)),
  );

  if (blocked.exists) {
    return FriendTie.Blocked;
  }
  if (friend.exists) {
    return FriendTie.Friends;
  }
  if (sent.exists) {
    return FriendTie.Sent;
  }
  return received.exists ? FriendTie.Received : FriendTie.None;
}

async function isFull(uid: string): Promise<boolean> {
  const count = await getAdminFirestore()
    .collection(FRIEND_COLLECTION)
    .where('owner', '==', uid)
    .count()
    .get();

  return count.data().count >= FRIEND_LIMIT;
}

/**
 * The one trainer at an address.
 *
 * An address rather than a name because a name is not a handle: two
 * players may call themselves the same thing and a player who has
 * renamed themselves is unfindable by the old one. It is an **exact**
 * match — the addresses live in Firebase Auth, which a browser cannot
 * query and which cannot match part of one anyway — so a player has to
 * be given the address by the person it belongs to.
 *
 * Resolves null for an address nobody plays under, and for the
 * reader's own: nobody befriends themselves
 */
export async function findPlayerByEmail(uid: string, email: string): Promise<FoundPlayer | null> {
  const wanted = email.trim().toLowerCase();

  if (wanted === '') {
    return null;
  }
  const account = await getAdminAuth()
    .getUserByEmail(wanted)
    .catch(() => null);

  if (account == null || account.uid === uid) {
    return null;
  }
  const profile = await getAdminFirestore().collection(PROFILE_COLLECTION).doc(account.uid).get();

  // Somebody who signed in once and never opened a profile is not
  // playing yet, and a request written against them would sit forever
  if (!profile.exists || profile.data()?.banned === true) {
    return null;
  }
  return { uid: account.uid, tie: await readFriendTie(uid, account.uid) };
}
