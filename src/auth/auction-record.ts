// Rows arrive untyped; the reads below restore const-enum fields via
// assertions that tsc requires but tsgolint (resolving const enums to
// number) considers unnecessary
// oxlint-disable typescript/no-unnecessary-type-assertion
import type { Items } from '../data/ids/items';
import { getItemBand } from '../data/overworld/item-pool';
import { asNumber, asRecord, asString } from './__normalize';

/**
 * What an auction is, and the rules both sides read it by. The shape
 * sits apart from the client that watches it and the server that
 * settles it, since both need it.
 *
 * The lot is named rather than copied: a catch lot names a `caught`
 * row every signed-in player can read, so nothing is duplicated here
 */

/**
 * What is on the block
 */
export const enum AuctionLot {
  /**
   * One item, already taken out of the seller's bag
   */
  Item = 0,
  /**
   * One pokemon, already out of the seller's records
   */
  Catch = 1,
}

/**
 * How long an auction runs. It is also what limits a player to one:
 * a seller may not open another while theirs is still running, and
 * since one runs a full day, that is one auction a day
 */
export const AUCTION_DURATION = 24 * 60 * 60 * 1000;

/**
 * What the seller may ask for. A lot has to cost something, and a
 * price nobody could ever meet is a lot nobody can win
 */
export const MIN_STARTING_BID = 1;
export const MAX_STARTING_BID = 1_000_000;

/**
 * The least a bid may raise the standing one by. A seller sets it, so
 * a long auction is not settled a single gold piece at a time
 */
export const MIN_INCREMENT = 1;
export const MAX_INCREMENT = 1_000_000;

/**
 * Who a catch on the block belongs to while it is there: nobody. Every
 * write asks whether the caller is the `owner` and a uid is never
 * empty, so escrow is refused to everybody by checks already in place
 */
export const AUCTION_ESCROW = '';

/**
 * What the seller is asking
 */
export interface AuctionTerms {
  /**
   * What the first bid has to be
   */
  startingBid: number;
  /**
   * What every bid after it has to add
   */
  increment: number;
}

/**
 * What is being sold, as the seller named it
 */
export type AuctionOffer =
  | { lot: AuctionLot.Item; item: Items }
  | { lot: AuctionLot.Catch; caught: string };

/**
 * What may go on the block at all.
 *
 * A player runs **one auction a day**, so the block is scarce and it
 * is only worth reading if what sits on it is what a player cannot go
 * and get for themselves. Both sides read the rules below: the pickers
 * leave out what fails, and `openAuction` asks again from the stored
 * record before it takes the lot.
 */

/**
 * Whether the item may be auctioned: the **special** band and nothing
 * else. Prized is deliberately below the line — a Bottle Cap is still
 * something walking turns up, and the block is for what it may not
 */
export function isAuctionableItem(item: Items): boolean {
  return getItemBand(item) === 'special';
}

/**
 * Whether the pokemon may be auctioned: perfect values, none at all,
 * shiny, or a special-tier species — everything else a bidder could go
 * and catch. Defined beside the record and only used here.
 *
 * The stored `auctionable` field exists so the store can be queried;
 * it is never read in place of this, since a stored answer can lag the
 * inputs and this decision takes somebody's pokemon off them
 */
export { isAuctionableCatch } from './caught-record';

/**
 * One auction at auctions/{auctionId}
 */
export interface AuctionRecord {
  /**
   * Who listed it. They may not bid on it, and they are paid when the
   * winner collects
   */
  seller: string;
  lot: AuctionLot;
  /**
   * The item on the block, or null for a catch lot. The seller's stack
   * came down by one when the auction opened
   */
  item: Items | null;
  /**
   * The `caught/{catchId}` on the block, or empty for an item lot. The
   * record still exists — it is held in escrow, owned by nobody —
   * so a bidder can read what they are bidding on
   */
  caught: string;
  startingBid: number;
  increment: number;
  /**
   * The standing bid, zero while nobody has bid
   */
  bid: number;
  /**
   * Who placed it, empty while nobody has. Their gold is already
   * taken: a bid is paid when it is made and handed back when it is
   * outbid, so the winner is somebody who could always afford it
   */
  bidder: string;
  createdAt: number;
  /**
   * When bidding closes, `AUCTION_DURATION` after it opened. Nothing
   * runs at that instant — the winner collects when they come back for
   * it
   */
  endsAt: number;
  /**
   * Minutes east of UTC the seller listed it in, so a listing can be
   * shown in the day it was made rather than the reader's
   */
  offset: number;
  /**
   * Whether the lot has been handed over. It is the claim marker: the
   * winner takes the lot, the seller takes the purse, and both ride
   * this one field so neither can happen twice
   */
  settled: boolean;
}

/**
 * A number a caller sent, as gold: whole, and never negative
 */
export function asGold(value: unknown): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return 0;
  }
  return Math.max(0, Math.floor(value));
}

/**
 * The terms as they will actually be written, brought into the range a
 * seller is allowed to ask for. A caller cannot be trusted with them,
 * and refusing an auction over a stray decimal helps nobody
 */
export function asAuctionTerms(startingBid: unknown, increment: unknown): AuctionTerms {
  return {
    startingBid: Math.min(MAX_STARTING_BID, Math.max(MIN_STARTING_BID, asGold(startingBid))),
    increment: Math.min(MAX_INCREMENT, Math.max(MIN_INCREMENT, asGold(increment))),
  };
}

/**
 * Restore an auction from an untyped row; the client and the
 * privileged server read through the same normalizer
 */
export function asAuctionRecord(value: unknown): AuctionRecord {
  const data = asRecord(value);

  return {
    seller: asString(data.seller),
    lot: asNumber(data.lot) as AuctionLot,
    item: data.item == null ? null : (asNumber(data.item) as Items),
    caught: asString(data.caught),
    startingBid: asNumber(data.startingBid),
    increment: asNumber(data.increment),
    bid: asNumber(data.bid),
    bidder: asString(data.bidder),
    createdAt: asNumber(data.createdAt),
    endsAt: asNumber(data.endsAt),
    offset: asNumber(data.offset),
    settled: data.settled === true,
  };
}

/**
 * Whether bidding has closed
 */
export function hasEnded(auction: AuctionRecord, now: number): boolean {
  return now >= auction.endsAt;
}

/**
 * Whether the auction is still taking bids
 */
export function isLive(auction: AuctionRecord, now: number): boolean {
  return !auction.settled && !hasEnded(auction, now);
}

/**
 * Whether anybody has bid at all. An auction that closes without one
 * has no winner to hand the lot to, so it goes back to the seller
 * instead — see `canReclaim`
 */
export function isBidOn(auction: AuctionRecord): boolean {
  return auction.bidder !== '';
}

/**
 * The least the next bid may be: the asking price while the lot is
 * untouched, and the standing bid plus the seller's increment after
 * that
 */
export function nextBid(auction: AuctionRecord): number {
  return isBidOn(auction) ? auction.bid + auction.increment : auction.startingBid;
}

/**
 * Whether this player may bid this much, right now. Three refusals:
 * the seller cannot buy from themselves, the standing bidder cannot
 * bid against themselves, and a bid must clear `nextBid`.
 *
 * There is no ceiling — the increment is a floor on the raise, not its
 * size — and what the bidder can afford is read where the gold moves
 */
export function canBid(auction: AuctionRecord, uid: string, amount: number, now: number): boolean {
  return (
    isLive(auction, now) &&
    uid !== auction.seller &&
    uid !== auction.bidder &&
    amount >= nextBid(auction)
  );
}

/**
 * Whether this player may collect the lot. Only the last bidder, only
 * once bidding has closed, and only once — a settled auction has
 * already handed everything over
 */
export function canClaim(auction: AuctionRecord, uid: string, now: number): boolean {
  return !auction.settled && hasEnded(auction, now) && isBidOn(auction) && auction.bidder === uid;
}

/**
 * Whether the seller may take their lot back: only once bidding has
 * closed with **nobody having bid**. A running lot cannot be pulled,
 * which is what makes a listing something a bidder can trust.
 *
 * It shares `settled` with collecting, so a lot can never be both
 * reclaimed and collected
 */
export function canReclaim(auction: AuctionRecord, uid: string, now: number): boolean {
  return !auction.settled && hasEnded(auction, now) && !isBidOn(auction) && auction.seller === uid;
}

/**
 * One player's bid on one lot, a `bids` row keyed by the two.
 *
 * The auction keeps only the standing bid, which is all it needs to
 * settle, so a player's own history lives on their side: one row per
 * lot, rewritten with the last amount they named. This says they took
 * part; the auction says whether they are still winning
 */
export interface PlayerBid {
  player: string;
  /**
   * The `auctions/{auctionId}` bid on
   */
  auction: string;
  /**
   * The last amount they bid on it. It is not necessarily the standing
   * bid — somebody may have raised it since — and their gold is only
   * still in if it is
   */
  amount: number;
  /**
   * When they last bid, on the server's clock
   */
  bidAt: number;
}

export function asPlayerBid(value: unknown): PlayerBid {
  const data = asRecord(value);

  return {
    player: asString(data.player),
    auction: asString(data.auction),
    amount: asNumber(data.amount),
    bidAt: asNumber(data.bidAt),
  };
}

/**
 * Where a player stands on a lot they have bid on
 */
export const enum BidState {
  /**
   * Theirs unless somebody raises it
   */
  Leading = 0,
  /**
   * Somebody did, and bidding is still open. Their gold came back with
   * the raise, and they may bid again — the one state worth acting on
   */
  Outbid = 1,
  /**
   * Bidding closed with them in front. Nothing is handed over on its
   * own, so this one needs them to come and collect
   */
  Won = 2,
  /**
   * Bidding closed with somebody else in front
   */
  Lost = 3,
  /**
   * Won and collected
   */
  Collected = 4,
}

/**
 * Where the player stands on the lot. Everything it needs is on the
 * auction, so the state is read off the lot rather than off what they
 * paid
 */
export function getBidState(auction: AuctionRecord, uid: string, now: number): BidState {
  if (auction.bidder !== uid) {
    // Settled is asked as well as ended, so a reader whose clock is
    // behind the close cannot be offered a bid on a lot that has
    // already been handed over
    return auction.settled || hasEnded(auction, now) ? BidState.Lost : BidState.Outbid;
  }
  if (auction.settled) {
    return BidState.Collected;
  }
  return hasEnded(auction, now) ? BidState.Won : BidState.Leading;
}

/**
 * Whether the player can still do something about this lot: outbid,
 * and bidding still open. The Bids panel offers a bid box on it, so a
 * player answers where they found out rather than hunting the board
 */
export function canRebid(auction: AuctionRecord, uid: string, now: number): boolean {
  return getBidState(auction, uid, now) === BidState.Outbid;
}
