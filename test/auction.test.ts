import { describe, expect, it } from 'vitest';
import {
  AUCTION_DURATION,
  AUCTION_ESCROW,
  AuctionLot,
  type AuctionRecord,
  BidState,
  MAX_INCREMENT,
  MAX_STARTING_BID,
  MIN_INCREMENT,
  MIN_STARTING_BID,
  asAuctionRecord,
  asAuctionTerms,
  asGold,
  asPlayerBid,
  canBid,
  canClaim,
  canRebid,
  getBidState,
  hasEnded,
  isBidOn,
  isLive,
  nextBid,
} from '../src/auth/auction-record';
import { Items } from '../src/data/ids/items';

const OPENED = 1_000_000;

/**
 * A listing as the server would have written it, with whatever the
 * test is about overridden
 */
function auction(fields: Partial<AuctionRecord> = {}): AuctionRecord {
  return {
    seller: 'seller',
    lot: AuctionLot.Item,
    item: Items.GoldenBottleCap,
    caught: '',
    startingBid: 100,
    increment: 10,
    bid: 0,
    bidder: '',
    createdAt: OPENED,
    endsAt: OPENED + AUCTION_DURATION,
    offset: 480,
    settled: false,
    ...fields,
  };
}

describe('auction terms', () => {
  it('runs for a day', () => {
    expect(AUCTION_DURATION).toBe(24 * 60 * 60 * 1000);
  });

  it("reads a caller's gold as whole and never negative", () => {
    expect(asGold(12.7)).toBe(12);
    expect(asGold(-5)).toBe(0);
    expect(asGold(Number.NaN)).toBe(0);
    expect(asGold('100')).toBe(0);
  });

  it("brings the seller's terms into what they may ask", () => {
    expect(asAuctionTerms(0, 0)).toEqual({
      startingBid: MIN_STARTING_BID,
      increment: MIN_INCREMENT,
    });
    expect(asAuctionTerms(1e12, 1e12)).toEqual({
      startingBid: MAX_STARTING_BID,
      increment: MAX_INCREMENT,
    });
    // Nothing a number cannot be reads as nothing asked for, so it
    // lands on the floor rather than the ceiling
    expect(asAuctionTerms(Number.POSITIVE_INFINITY, Number.NaN)).toEqual({
      startingBid: MIN_STARTING_BID,
      increment: MIN_INCREMENT,
    });
    expect(asAuctionTerms(250.5, 25.9)).toEqual({ startingBid: 250, increment: 25 });
  });

  it('restores a stored listing, missing fields and all', () => {
    const restored = asAuctionRecord({ seller: 'seller', lot: AuctionLot.Catch, caught: 'abc' });

    expect(restored.item).toBeNull();
    expect(restored.caught).toBe('abc');
    expect(restored.bidder).toBe('');
    expect(restored.settled).toBe(false);
  });

  it('leaves an escrowed pokemon owned by nobody', () => {
    // Every write that touches a catch asks whether the caller is its
    // owner, and a uid is never empty, so escrow is refused to
    // everyone by the checks that were already there
    expect(AUCTION_ESCROW).toBe('');
  });
});

describe('bidding', () => {
  const now = OPENED + 1000;

  it('opens at the asking price and climbs by the increment', () => {
    expect(nextBid(auction())).toBe(100);
    expect(nextBid(auction({ bid: 100, bidder: 'buyer' }))).toBe(110);
  });

  it('refuses the seller their own lot', () => {
    expect(canBid(auction(), 'seller', 100, now)).toBe(false);
    expect(canBid(auction(), 'buyer', 100, now)).toBe(true);
  });

  it('refuses a bid that does not clear the raise', () => {
    const standing = auction({ bid: 100, bidder: 'buyer' });

    expect(canBid(standing, 'other', 105, now)).toBe(false);
    expect(canBid(standing, 'other', 110, now)).toBe(true);
  });

  it('takes any amount above the floor, not only the floor itself', () => {
    // The increment is the least a raise may be, not the size of it:
    // a lot worth having can be put out of reach in one bid
    const standing = auction({ bid: 100, bidder: 'buyer' });

    expect(canBid(standing, 'other', 500, now)).toBe(true);
    expect(canBid(standing, 'other', 1_000_000, now)).toBe(true);
  });

  it('refuses the standing bidder a raise until somebody outbids them', () => {
    // They are already winning it, so bidding against themselves could
    // only cost them gold
    const standing = auction({ bid: 100, bidder: 'buyer' });

    expect(canBid(standing, 'buyer', 110, now)).toBe(false);
    expect(canBid(standing, 'buyer', 5000, now)).toBe(false);
    // ...and they may again once they have been outbid
    expect(canBid(auction({ bid: 110, bidder: 'other' }), 'buyer', 120, now)).toBe(true);
  });

  it('closes bidding a day after it opened', () => {
    const listed = auction();

    expect(isLive(listed, listed.endsAt - 1)).toBe(true);
    expect(hasEnded(listed, listed.endsAt - 1)).toBe(false);
    expect(isLive(listed, listed.endsAt)).toBe(false);
    expect(hasEnded(listed, listed.endsAt)).toBe(true);
    expect(canBid(listed, 'buyer', 1000, listed.endsAt)).toBe(false);
  });

  it('takes no more bids once the lot has been collected', () => {
    const collected = auction({ bid: 100, bidder: 'buyer', settled: true });

    expect(isLive(collected, now)).toBe(false);
    expect(canBid(collected, 'other', 1000, now)).toBe(false);
  });
});

describe('collecting', () => {
  const ended = OPENED + AUCTION_DURATION;

  it('waits for bidding to close', () => {
    const standing = auction({ bid: 100, bidder: 'buyer' });

    expect(canClaim(standing, 'buyer', ended - 1)).toBe(false);
    expect(canClaim(standing, 'buyer', ended)).toBe(true);
  });

  it('pays out to the last bidder and nobody else', () => {
    const standing = auction({ bid: 110, bidder: 'buyer' });

    expect(canClaim(standing, 'other', ended)).toBe(false);
    expect(canClaim(standing, 'seller', ended)).toBe(false);
  });

  it('hands nothing over twice', () => {
    const collected = auction({ bid: 100, bidder: 'buyer', settled: true });

    expect(canClaim(collected, 'buyer', ended)).toBe(false);
  });

  it('leaves a lot nobody bid on where it was put', () => {
    // The seller gave it up when they listed it, and there is no
    // winner to hand it to: an unbid lot is simply gone
    const unbid = auction();

    expect(isBidOn(unbid)).toBe(false);
    expect(canClaim(unbid, 'seller', ended)).toBe(false);
    expect(canClaim(unbid, 'buyer', ended)).toBe(false);
  });
});

describe("a player's bidding history", () => {
  const open = OPENED + 1000;
  const ended = OPENED + AUCTION_DURATION;

  it('restores a stored bid, missing fields and all', () => {
    const restored = asPlayerBid({ player: 'buyer', auction: 'lot', amount: 250, bidAt: OPENED });

    expect(restored).toEqual({ player: 'buyer', auction: 'lot', amount: 250, bidAt: OPENED });
    expect(asPlayerBid(null).auction).toBe('');
  });

  it('reads where the player stands off the lot itself', () => {
    // The auction keeps only the bid that is standing; what the player
    // put in is their own record, and the state comes from the lot
    const mine = auction({ bid: 100, bidder: 'buyer' });
    const theirs = auction({ bid: 200, bidder: 'other' });

    expect(getBidState(mine, 'buyer', open)).toBe(BidState.Leading);
    expect(getBidState(theirs, 'buyer', open)).toBe(BidState.Outbid);
    expect(getBidState(mine, 'buyer', ended)).toBe(BidState.Won);
    expect(getBidState(theirs, 'buyer', ended)).toBe(BidState.Lost);
    expect(getBidState({ ...mine, settled: true }, 'buyer', ended)).toBe(BidState.Collected);
  });

  it('offers another bid only where one would still be taken', () => {
    // Outbid while bidding is open is the one state a player can do
    // something about, and it is answered from their history rather
    // than by finding the lot again
    const theirs = auction({ bid: 200, bidder: 'other' });

    expect(canRebid(theirs, 'buyer', open)).toBe(true);
    expect(canRebid(theirs, 'buyer', ended)).toBe(false);
    expect(canRebid(auction({ bid: 200, bidder: 'buyer' }), 'buyer', open)).toBe(false);
    expect(canRebid({ ...theirs, settled: true }, 'buyer', open)).toBe(false);
  });
});
