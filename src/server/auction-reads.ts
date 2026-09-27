import 'server-only';
import type { Fragment, Sql } from 'postgres';
import { getSql } from './db';
import { asNumber, asString } from './read';

/**
 * The auction house's reads, as raw rows for the browser's own
 * converter. Lots are public to every signed-in player; bids and the
 * seller standing are the player's own
 */

/** The lot's columns, as a fragment spliced into each query and never awaited */
// oxlint-disable-next-line typescript/promise-function-async
function columns(sql: Sql): Fragment {
  return sql`
    a.id, a.seller, a.lot, a.item, a.caught_id, a.starting_bid, a.increment, a.bid, a.bidder,
    a.created_at, a.ends_at, a.utc_offset, a.settled
  `;
}

/** Lots by id */
export async function readAuctionsIn(ids: string[]): Promise<Record<string, unknown>[]> {
  if (ids.length === 0) {
    return [];
  }

  const sql = getSql();

  return [...(await sql`select ${columns(sql)} from auctions a where a.id = any(${ids})`)];
}

/** Every lot not yet collected */
export async function readOpenAuctions(): Promise<Record<string, unknown>[]> {
  const sql = getSql();

  return [...(await sql`select ${columns(sql)} from auctions a where not a.settled`)];
}

/** Everything one seller has put up, oldest first */
export async function readAuctionsBy(seller: string): Promise<Record<string, unknown>[]> {
  const sql = getSql();

  return [
    ...(await sql`
      select ${columns(sql)} from auctions a where a.seller = ${seller} order by a.created_at
    `),
  ];
}

/** The open lots this player sells, and the open lots they bid on in id order */
export async function readStakes(
  uid: string,
): Promise<{ selling: Record<string, unknown>[]; bidding: Record<string, unknown>[] }> {
  const sql = getSql();
  const [selling, bidding] = await Promise.all([
    sql`select ${columns(sql)} from auctions a where a.seller = ${uid} and not a.settled`,
    sql`
      select ${columns(sql)} from bids b join auctions a on a.id = b.auction
      where b.player = ${uid} and not a.settled
      order by b.auction
    `,
  ]);

  return { selling: [...selling], bidding: [...bidding] };
}

/** This player's own bids, one per lot they bid on */
export async function readPlayerBids(
  uid: string,
): Promise<{ player: string; auction: string; amount: number; bidAt: number }[]> {
  const rows = await getSql()`
    select player, auction, amount, bid_at from bids where player = ${uid}
  `;
  const bids: { player: string; auction: string; amount: number; bidAt: number }[] = [];

  for (const row of rows) {
    bids.push({
      player: asString(row.player),
      auction: asString(row.auction),
      amount: asNumber(row.amount),
      bidAt: asNumber(row.bid_at),
    });
  }
  return bids;
}

/** The auction this player last listed and when it closes, or null */
export async function readSellerStanding(
  uid: string,
): Promise<{ auction: string; endsAt: number } | null> {
  const rows = await getSql()`
    select auction, ends_at from auction_sellers where player = ${uid}
  `;
  const row = rows.at(0);

  return row == null ? null : { auction: asString(row.auction), endsAt: asNumber(row.ends_at) };
}

/** This player's own bids, with every lot they name */
export async function readBidHistory(uid: string): Promise<{
  bids: { player: string; auction: string; amount: number; bidAt: number }[];
  lots: Record<string, unknown>[];
}> {
  const bids = await readPlayerBids(uid);
  const named = new Set<string>();

  for (const bid of bids) {
    named.add(bid.auction);
  }
  return { bids, lots: await readAuctionsIn([...named]) };
}
