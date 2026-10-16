/**
 * Who a player knows.
 *
 * A friendship is two records, one on each side, and a request is one
 * record pointing one way. Both are written by the server alone: a
 * client that could write a friendship could put itself on somebody
 * else's list.
 */

/**
 * How many friends one player may keep. It is what stops a list from
 * becoming a mailing list: every screen reads the whole of it, and the
 * reads are paid per friend
 */
export const FRIEND_LIMIT = 100;

/** Where two players stand with each other, from one side's view */
export const enum FriendTie {
  /** Strangers, so far */
  None = 0,
  Friends = 1,
  /** This player asked and is waiting on an answer */
  Sent = 2,
  /** The other player asked, and this one has yet to answer */
  Received = 3,
  /**
   * This player has blocked them. It is one-sided and one-way: being
   * blocked by somebody else is not a standing a player is ever shown,
   * since a block nobody is told about is the only kind worth having
   */
  Blocked = 4,
}

/**
 * One other player, as the store holds the tie to them: a friendship,
 * a request either way, or a block. What they are *called* is not in
 * here — a row holds uids, and the name is read from their profile,
 * which is live and cannot go stale behind a rename
 */
export interface FriendLink {
  uid: string;
  /** When it was made, asked or set, in milliseconds */
  since: number;
}

/** Both directions of what is waiting on an answer */
export interface FriendRequests {
  /** Asked of this player, for them to accept or decline */
  incoming: FriendLink[];
  /** Asked by this player, and cancellable until answered */
  outgoing: FriendLink[];
}

/** Somebody found by their address, and where the two already stand */
export interface FoundPlayer {
  uid: string;
  tie: FriendTie;
}

/** What the button offering the tie should say */
const LABELS: Record<FriendTie, string> = {
  [FriendTie.None]: 'Add friend',
  [FriendTie.Friends]: 'Remove friend',
  [FriendTie.Sent]: 'Cancel request',
  [FriendTie.Received]: 'Accept request',
  [FriendTie.Blocked]: 'Unblock',
};

export function friendActionLabel(tie: FriendTie): string {
  return LABELS[tie];
}
