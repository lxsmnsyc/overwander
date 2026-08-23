// Rows arrive untyped; the reads below restore const-enum fields via
// assertions that tsc requires but tsgolint (resolving const enums to
// number) considers unnecessary
// oxlint-disable typescript/no-unnecessary-type-assertion
import { asNumber, asRecord, asString } from './__normalize';

/**
 * What a trade is, and the rules both sides read it by: one pokemon
 * for another between two friends, with gold riding along either way.
 *
 * The offered catch sits in escrow while the trade is open, so an
 * offer is something the receiver can trust; the asked catch stays
 * with the receiver and is checked again when they accept.
 */

export const enum TradeStatus {
  Open = 0,
  Accepted = 1,
  Declined = 2,
  Cancelled = 3,
}

/** The most gold that may ride on a trade, in either direction */
export const TRADE_GOLD_LIMIT = 1_000_000;

/**
 * Who the offered catch belongs to while the trade is open: nobody,
 * the same sentinel the auction house escrows under. Every write asks
 * whether the caller is the `owner`, so escrow refuses everybody
 */
export const TRADE_ESCROW = '';

/**
 * One trade at trades/{tradeId}
 */
export interface TradeRecord {
  proposer: string;
  receiver: string;
  /** The catch the proposer put up, in escrow while the trade is open */
  offered: string;
  /** The catch asked in return, or empty for the receiver's own pick */
  asked: string;
  /** What the receiver actually gave, empty until accepted */
  given: string;
  /**
   * Gold riding on the trade: positive comes with the offer and was
   * taken when the offer was made, negative is asked of the receiver
   * and is taken when they accept
   */
  gold: number;
  status: TradeStatus;
  createdAt: number;
  /** When it was answered or taken back, zero while open */
  resolvedAt: number;
  /** Minutes east of UTC the proposer offered in */
  offset: number;
}

/**
 * A number a caller sent, as the gold riding a trade: whole, and
 * inside the limit either way
 */
export function asTradeGold(value: unknown): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return 0;
  }
  return Math.max(-TRADE_GOLD_LIMIT, Math.min(TRADE_GOLD_LIMIT, Math.trunc(value)));
}

/**
 * Restore a trade from an untyped row; the client and the privileged
 * server read through the same normalizer
 */
export function asTradeRecord(value: unknown): TradeRecord {
  const data = asRecord(value);

  return {
    proposer: asString(data.proposer),
    receiver: asString(data.receiver),
    offered: asString(data.offered),
    asked: asString(data.asked),
    given: asString(data.given),
    gold: asTradeGold(asNumber(data.gold)),
    status: asNumber(data.status) as TradeStatus,
    createdAt: asNumber(data.createdAt),
    resolvedAt: asNumber(data.resolvedAt),
    offset: asNumber(data.offset),
  };
}

export function isOpenTrade(trade: TradeRecord): boolean {
  return trade.status === TradeStatus.Open;
}

/** Whether this player may accept or decline it: the receiver, while open */
export function canAnswerTrade(trade: TradeRecord, uid: string): boolean {
  return isOpenTrade(trade) && trade.receiver === uid;
}

/** Whether this player may take it back: the proposer, while open */
export function canCancelTrade(trade: TradeRecord, uid: string): boolean {
  return isOpenTrade(trade) && trade.proposer === uid;
}
