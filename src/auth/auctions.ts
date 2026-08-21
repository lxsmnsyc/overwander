import type { Items } from '../data/ids/items';
import {
  placeBid as bidOnServerSide,
  claimAuction as claimOnServerSide,
  openAuction as openOnServerSide,
  reclaimAuction as reclaimOnServerSide,
} from '../server/auctions';
import { requireUid } from '../server/auth';
import {
  AuctionLot,
  type AuctionOffer,
  type AuctionRecord,
  type AuctionTerms,
  type PlayerBid,
  asAuctionRecord,
  asPlayerBid,
} from './auction-record';
import { syncServerClock } from './clock';
import getSupabase, { type Unwatch, watchRow, watchTable } from './supabase';
import { asNumber, asRecord, asRecordArray, asString } from './__normalize';
import { getLocalOffset } from './local-time';
import getIdToken from './session';

export {
  AUCTION_DURATION,
  AUCTION_ESCROW,
  AuctionLot,
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
  canReclaim,
  getBidState,
  hasEnded,
  isAuctionableCatch,
  isAuctionableItem,
  isBidOn,
  isLive,
  nextBid,
} from './auction-record';
export type { AuctionOffer, AuctionRecord, AuctionTerms, PlayerBid } from './auction-record';

/**
 * The auction house, as the browser sees it. Everything that moves —
 * listing a lot, bidding on one, collecting one — is decided by the
 * server in [`src/server/auctions.ts`](../server/auctions.ts); what is
 * read here is the board itself, which every signed-in player can see
 */

const AUCTION_TABLE = 'auctions';

const AUCTION_COLUMNS =
  'id, seller, lot, item, caught_id, starting_bid, increment, bid, bidder, ' +
  'created_at, ends_at, utc_offset, settled';

/** One auction row in the record shape the rules read */
function fromAuctionRow(row: Record<string, unknown>): AuctionRecord {
  return asAuctionRecord({
    seller: row.seller,
    lot: row.lot,
    item: row.item,
    caught: row.caught_id ?? '',
    startingBid: row.starting_bid,
    increment: row.increment,
    bid: row.bid,
    bidder: row.bidder ?? '',
    createdAt: row.created_at,
    endsAt: row.ends_at,
    offset: row.utc_offset,
    settled: row.settled,
  });
}

export async function getAuction(id: string): Promise<AuctionRecord | null> {
  const { data } = await getSupabase()
    .from(AUCTION_TABLE)
    .select(AUCTION_COLUMNS)
    .eq('id', id)
    .maybeSingle();

  return data == null ? null : fromAuctionRow(asRecord(data));
}

/**
 * Follow one auction: a bid raises it under whoever is looking at it
 */
export function watchAuction(
  id: string,
  onChange: (auction: AuctionRecord | null) => void,
): Unwatch {
  return watchRow(AUCTION_TABLE, `id=eq.${id}`, async () => getAuction(id), onChange);
}

/**
 * Every auction that has not been collected yet: the ones still taking
 * bids, and the ones whose winner has not come back for the lot.
 * Settled auctions drop out — the lot and the purse have both changed
 * hands, and there is nothing left to do about them.
 *
 * Whether one is still open is a question about the clock rather than
 * the document, so the caller answers it with `isLive` against the
 * server's time
 */
export function watchOpenAuctions(
  onChange: (auctions: [string, AuctionRecord][]) => void,
): Unwatch {
  const read = async (): Promise<[string, AuctionRecord][]> => {
    const { data } = await getSupabase()
      .from(AUCTION_TABLE)
      .select(AUCTION_COLUMNS)
      .eq('settled', false);

    return asRecordArray(data).map((row) => [String(row.id), fromAuctionRow(row)]);
  };

  // The subscription is unfiltered on purpose: the settling of a lot
  // is an UPDATE that leaves the set, which a settled=false filter
  // would never deliver
  return watchTable(AUCTION_TABLE, [], read, onChange);
}

/**
 * Everything this player has ever put up, newest last
 */
export async function listAuctionsBy(seller: string): Promise<[string, AuctionRecord][]> {
  const { data } = await getSupabase()
    .from(AUCTION_TABLE)
    .select(AUCTION_COLUMNS)
    .eq('seller', seller)
    .order('created_at', { ascending: true });

  return asRecordArray(data).map((row) => [String(row.id), fromAuctionRow(row)]);
}

/**
 * One entry of the player's bidding history: the lot, and what they
 * last bid on it
 */
export interface BidHistoryEntry {
  auction: string;
  lot: AuctionRecord;
  bid: PlayerBid;
}

/**
 * The player's bidding history, newest first: everything they have bid
 * on, whether they are still winning it or were outbid an hour later.
 *
 * The lot only ever keeps the bid that is standing, so the history is
 * read from the player's own bid documents and the lots are looked up
 * by the ids those name. Where they stand on each is `getBidState`,
 * and a lot they were outbid on while bidding is still open takes
 * another bid from here — being outbid is something a player finds out
 * by looking at this, so it is where the answer belongs
 */
export async function listBidHistory(uid: string): Promise<BidHistoryEntry[]> {
  const { data: bids } = await getSupabase()
    .from('bids')
    .select('player, auction, amount, bid_at')
    .eq('player', uid);
  const placed = asRecordArray(bids)
    .map((row) =>
      asPlayerBid({
        player: row.player,
        auction: row.auction,
        amount: row.amount,
        bidAt: row.bid_at,
      }),
    )
    .filter((bid) => bid.auction !== '')
    .sort((one, other) => other.bidAt - one.bidAt);

  if (placed.length === 0) {
    return [];
  }

  const { data: found } = await getSupabase()
    .from(AUCTION_TABLE)
    .select(AUCTION_COLUMNS)
    .in('id', [...new Set(placed.map((bid) => bid.auction))]);
  const lots = new Map<string, AuctionRecord>();

  for (const row of asRecordArray(found)) {
    lots.set(String(row.id), fromAuctionRow(row));
  }

  // A bid whose lot has vanished has nothing left to show; nothing
  // deletes an auction today, so this is only for the sake of a
  // history that outlives one
  return placed
    .filter((bid) => lots.has(bid.auction))
    .map((bid) => ({
      auction: bid.auction,
      // The lot is present — the filter above just checked
      lot: lots.get(bid.auction) ?? asAuctionRecord(null),
      bid,
    }));
}

/**
 * The auction the player has running and when it closes, or null when
 * they have never listed anything. A seller may not open another until
 * this one has closed, so it is what the sell form asks before it
 * offers to list anything
 */
export async function getSellerStanding(
  uid: string,
): Promise<{ auction: string; endsAt: number } | null> {
  const { data } = await getSupabase()
    .from('auction_sellers')
    .select('auction, ends_at')
    .eq('player', uid)
    .maybeSingle();

  if (data == null) {
    return null;
  }
  return { auction: asString(data.auction), endsAt: asNumber(data.ends_at) };
}

/**
 * Put an item up for auction. The item leaves the bag as the auction
 * opens — a seller cannot take their own lot off the block while it
 * runs, and cannot bid on it either. It comes back only if the day
 * ends with nobody having bid at all.
 *
 * Resolves the auction id, or null when the player already has one
 * running or does not carry the item
 */
export async function openItemAuction(item: Items, terms: AuctionTerms): Promise<string | null> {
  return openAuctionOnServer(
    await getIdToken(),
    { lot: AuctionLot.Item, item },
    terms,
    getLocalOffset(),
  );
}

/**
 * Put one of the player's pokemon up for auction. It leaves their
 * records as the auction opens — held items and all — and comes back
 * only if the day ends with nobody having bid at all.
 *
 * Resolves the auction id, or null when the player already has one
 * running, does not own the pokemon, or it is fighting or waiting in a
 * raid lobby
 */
export async function openCatchAuction(
  catchId: string,
  terms: AuctionTerms,
): Promise<string | null> {
  return openAuctionOnServer(
    await getIdToken(),
    { lot: AuctionLot.Catch, caught: catchId },
    terms,
    getLocalOffset(),
  );
}

async function openAuctionOnServer(
  token: string,
  offer: AuctionOffer,
  terms: AuctionTerms,
  offset: number,
): Promise<string | null> {
  'use server';
  return openOnServerSide(await requireUid(token), offer, terms, await syncServerClock(), offset);
}

/**
 * Bid on somebody else's auction. The gold is taken as the bid is
 * placed and handed back if somebody outbids it, so a standing bid is
 * always money already paid.
 *
 * Resolves the standing bid, or null when the auction has closed, the
 * bidder is the seller, the bid does not clear the seller's increment,
 * or the balance cannot cover it
 */
export async function placeBid(id: string, amount: number): Promise<number | null> {
  return placeBidOnServer(await getIdToken(), id, amount);
}

async function placeBidOnServer(token: string, id: string, amount: number): Promise<number | null> {
  'use server';
  return bidOnServerSide(await requireUid(token), id, amount, await syncServerClock());
}

/**
 * Collect a lot that was won. Nothing hands it over when bidding
 * closes — the winner comes back for it — and the seller is paid out
 * of the same claim, so an uncollected lot is an unpaid one.
 *
 * Resolves false when the caller did not win it, bidding has not
 * closed, or it has already been collected
 */
export async function claimAuction(id: string): Promise<boolean> {
  return claimAuctionOnServer(await getIdToken(), id, getLocalOffset());
}

async function claimAuctionOnServer(token: string, id: string, offset: number): Promise<boolean> {
  'use server';
  return claimOnServerSide(await requireUid(token), id, await syncServerClock(), offset);
}

/**
 * Take back a lot that closed without a single bid on it. The item
 * returns to the bag and the pokemon to the player's records, exactly
 * as they left — nothing was sold, so nothing is paid.
 *
 * Resolves false when the caller is not the seller, bidding is still
 * open, somebody did bid on it, or it has already been handed over
 */
export async function reclaimAuction(id: string): Promise<boolean> {
  return reclaimAuctionOnServer(await getIdToken(), id);
}

async function reclaimAuctionOnServer(token: string, id: string): Promise<boolean> {
  'use server';
  return reclaimOnServerSide(await requireUid(token), id, await syncServerClock());
}
