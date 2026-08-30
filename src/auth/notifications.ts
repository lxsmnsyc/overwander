import {
  type AuctionRecord,
  type BidHistoryEntry,
  canClaim,
  canReclaim,
  listBidHistory,
  watchOpenAuctions,
} from './auctions';
import { watchDuelInvites } from './duels';
import { watchFriendRequests } from './friends';
import { watchRaidInvites } from './raids';
import { TradeStatus } from './trade-record';
import { watchTrades } from './trades';
import type { Unwatch } from './supabase';

/**
 * Everything waiting on the player, gathered in one place.
 *
 * Each of these already had a home: a raid invite is drawn in the
 * raids panel, a friend request in the profile, a lot won on the bids
 * list. What none of them had was a way of being **found** — a player
 * standing in the world had nothing telling them an invite had landed,
 * so an invitation could sit unseen until the lobby it belonged to was
 * gone.
 *
 * This is the noticing half and nothing else: what is waiting, who it
 * is from, and where to go and answer it. Answering still happens in
 * the panel that owns the thing, which is where the rules for it live.
 */

/** What kind of thing is waiting */
export const enum NoticeKind {
  RaidInvite = 0,
  DuelInvite = 1,
  FriendRequest = 2,
  TradeOffer = 3,
  /** A lot won and not yet collected */
  AuctionWon = 4,
  /** A lot of the player's own that nobody bid on */
  AuctionUnsold = 5,
  /** A lot they were leading and are not any more, still taking bids */
  AuctionOutbid = 6,
}

export interface Notice {
  /** Stable across reads, so a list can key rows by it */
  id: string;
  kind: NoticeKind;
  /** The uid behind it, where a person sent it */
  from?: string;
  /** What it is about: the raid, the duel, the trade, the lot */
  subject: string;
  /** When it landed, for putting the newest first */
  at: number;
}

/** Newest first, which is the order every one of these panels uses */
function byNewest(one: Notice, other: Notice): number {
  return other.at - one.at;
}

/**
 * What the auction house has waiting for this player, worked out from
 * the open lots and their own bids: a lot won, a lot nobody wanted
 * back, and a lot they have been outbid on while it is still running
 */
function auctionNotices(
  lots: [string, AuctionRecord][],
  bids: BidHistoryEntry[],
  uid: string,
  now: number,
): Notice[] {
  const found: Notice[] = [];
  const mine = new Set(bids.map((entry) => entry.auction));

  for (const [id, lot] of lots) {
    if (canClaim(lot, uid, now)) {
      found.push({ id: `won:${id}`, kind: NoticeKind.AuctionWon, subject: id, at: lot.endsAt });
      continue;
    }
    if (canReclaim(lot, uid, now)) {
      found.push({
        id: `unsold:${id}`,
        kind: NoticeKind.AuctionUnsold,
        subject: id,
        at: lot.endsAt,
      });
      continue;
    }
    // Outbid is the one that has to be told: the lot is still open, so
    // it is answerable, and nothing else on the screen would say so
    if (mine.has(id) && lot.bidder !== uid && lot.bidder !== '' && now < lot.endsAt) {
      found.push({
        id: `outbid:${id}`,
        kind: NoticeKind.AuctionOutbid,
        subject: id,
        at: lot.createdAt,
      });
    }
  }
  return found;
}

/**
 * Follow everything waiting on one player.
 *
 * Five subscriptions rather than one, since each of these lives in a
 * table of its own; what this adds is that they are read together and
 * reported as one list, so a menu can carry a count and a panel can
 * draw the lot of them in the order they arrived
 */
export function watchNotifications(uid: string, onChange: (notices: Notice[]) => void): Unwatch {
  let raids: Notice[] = [];
  let duels: Notice[] = [];
  let friends: Notice[] = [];
  let trades: Notice[] = [];
  let auctions: Notice[] = [];
  /** The player's own bids, re-read whenever a lot moves */
  let bids: BidHistoryEntry[] = [];

  const report = (): void => {
    onChange([...raids, ...duels, ...friends, ...trades, ...auctions].sort(byNewest));
  };

  const closers: Unwatch[] = [
    watchRaidInvites(uid, (invites) => {
      raids = invites.map((invite) => ({
        id: `raid:${invite.raid}`,
        kind: NoticeKind.RaidInvite,
        from: invite.sender,
        subject: invite.raid,
        at: invite.sentAt,
      }));
      report();
    }),
    watchDuelInvites(uid, (invites) => {
      duels = invites.map((invite) => ({
        id: `duel:${invite.duel}`,
        kind: NoticeKind.DuelInvite,
        from: invite.sender,
        subject: invite.duel,
        at: invite.sentAt,
      }));
      report();
    }),
    watchFriendRequests(uid, (waiting) => {
      // Only what is asked of them: what they asked of somebody else
      // is not waiting on them
      friends = waiting.incoming.map((request) => ({
        id: `friend:${request.uid}`,
        kind: NoticeKind.FriendRequest,
        from: request.uid,
        subject: request.uid,
        at: request.since,
      }));
      report();
    }),
    watchTrades(uid, (offers) => {
      trades = offers
        .filter(([, trade]) => trade.status === TradeStatus.Open && trade.receiver === uid)
        .map(([id, trade]) => ({
          id: `trade:${id}`,
          kind: NoticeKind.TradeOffer,
          from: trade.proposer,
          subject: id,
          at: trade.createdAt,
        }));
      report();
    }),
    watchOpenAuctions((lots) => {
      // The bids are the player's own rows rather than the lot's, so
      // they are read beside the lots rather than derived from them
      listBidHistory(uid)
        .then((placed) => {
          bids = placed;
        })
        .catch(() => {
          // A bid history that will not load leaves the lots saying
          // what they can on their own: won and unsold need no bids
        })
        .finally(() => {
          auctions = auctionNotices(lots, bids, uid, Date.now());
          report();
        });
    }),
  ];

  return () => {
    for (const close of closers) {
      close();
    }
  };
}
