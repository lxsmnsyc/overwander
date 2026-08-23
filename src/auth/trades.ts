import {
  type TradeOffer,
  acceptTrade as acceptOnServerSide,
  cancelTrade as cancelOnServerSide,
  declineTrade as declineOnServerSide,
  offerTrade as offerOnServerSide,
} from '../server/trades';
import { requireUid } from '../server/auth';
import { type TradeRecord, asTradeRecord } from './trade-record';
import { syncServerClock } from './clock';
import getSupabase, { type Unwatch, watchTable } from './supabase';
import { asRecordArray } from './__normalize';
import { getLocalOffset } from './local-time';
import getIdToken from './session';

export {
  TRADE_ESCROW,
  TRADE_GOLD_LIMIT,
  TradeStatus,
  asTradeGold,
  asTradeRecord,
  canAnswerTrade,
  canCancelTrade,
  isOpenTrade,
} from './trade-record';
export type { TradeRecord } from './trade-record';

/**
 * Trading, as the browser sees it. Everything that moves — offering,
 * accepting, declining, cancelling — is decided by the server in
 * [`src/server/trades.ts`](../server/trades.ts); what is read here is
 * the player's own trades, which are all their row policy yields
 */

const TRADE_TABLE = 'trades';

const TRADE_COLUMNS =
  'id, proposer, receiver, offered_caught, asked_caught, given_caught, ' +
  'gold, status, created_at, resolved_at, utc_offset';

/** One trade row in the record shape the rules read */
function fromTradeRow(row: Record<string, unknown>): TradeRecord {
  return asTradeRecord({
    proposer: row.proposer,
    receiver: row.receiver,
    offered: row.offered_caught,
    asked: row.asked_caught ?? '',
    given: row.given_caught ?? '',
    gold: row.gold,
    status: row.status,
    createdAt: row.created_at,
    resolvedAt: row.resolved_at ?? 0,
    offset: row.utc_offset,
  });
}

/**
 * Every trade the player is on either end of, newest first: the open
 * ones to answer or take back, and the settled ones as history
 */
export async function listTrades(uid: string): Promise<[string, TradeRecord][]> {
  const { data } = await getSupabase()
    .from(TRADE_TABLE)
    .select(TRADE_COLUMNS)
    .or(`proposer.eq.${uid},receiver.eq.${uid}`)
    .order('created_at', { ascending: false });

  return asRecordArray(data).map((row) => [String(row.id), fromTradeRow(row)]);
}

/**
 * Follow the player's trades from both ends: an offer arriving, an
 * answer landing, an offer taken back
 */
export function watchTrades(
  uid: string,
  onChange: (trades: [string, TradeRecord][]) => void,
): Unwatch {
  return watchTable(
    TRADE_TABLE,
    [`proposer=eq.${uid}`, `receiver=eq.${uid}`],
    async () => listTrades(uid),
    onChange,
  );
}

/**
 * Offer a friend a trade: one of the player's pokemon for a named one
 * of the friend's, or for whatever the friend picks when `asked` is
 * empty. Positive gold rides with the offer and is taken now; negative
 * gold is asked of the friend and taken when they accept.
 *
 * Resolves the trade id, or null when they are not friends, an offer
 * to this friend is already open, the pokemon is not one to give away,
 * or the gold offered is more than the player holds
 */
export async function offerTrade(
  friend: string,
  caught: string,
  asked: string,
  gold: number,
): Promise<string | null> {
  return offerTradeOnServer(await getIdToken(), { friend, caught, asked, gold }, getLocalOffset());
}

async function offerTradeOnServer(
  token: string,
  offer: TradeOffer,
  offset: number,
): Promise<string | null> {
  'use server';
  return offerOnServerSide(await requireUid(token), offer, await syncServerClock(), offset);
}

/**
 * Accept a trade. `pick` answers an open ask with one of the player's
 * own and is ignored where the proposer named one; the two pokemon
 * change hands in one stroke and both arrive able to trade-evolve.
 *
 * Resolves false when the trade is no longer open, the two are no
 * longer friends, the pokemon going back is not the player's to give,
 * or the gold asked is more than they hold
 */
export async function acceptTrade(id: string, pick: string): Promise<boolean> {
  return acceptTradeOnServer(await getIdToken(), id, pick, getLocalOffset());
}

async function acceptTradeOnServer(
  token: string,
  id: string,
  pick: string,
  offset: number,
): Promise<boolean> {
  'use server';
  return acceptOnServerSide(await requireUid(token), id, pick, await syncServerClock(), offset);
}

/**
 * Turn a trade down: the offered pokemon and any gold riding with it
 * go back to the proposer
 */
export async function declineTrade(id: string): Promise<boolean> {
  return declineTradeOnServer(await getIdToken(), id);
}

async function declineTradeOnServer(token: string, id: string): Promise<boolean> {
  'use server';
  return declineOnServerSide(await requireUid(token), id, await syncServerClock());
}

/**
 * Take an offer back before it is answered: the pokemon comes out of
 * escrow and the gold comes home
 */
export async function cancelTrade(id: string): Promise<boolean> {
  return cancelTradeOnServer(await getIdToken(), id);
}

async function cancelTradeOnServer(token: string, id: string): Promise<boolean> {
  'use server';
  return cancelOnServerSide(await requireUid(token), id, await syncServerClock());
}
