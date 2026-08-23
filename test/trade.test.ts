import { describe, expect, it } from 'vitest';
import {
  TRADE_ESCROW,
  TRADE_GOLD_LIMIT,
  type TradeRecord,
  TradeStatus,
  asTradeGold,
  asTradeRecord,
  canAnswerTrade,
  canCancelTrade,
  isOpenTrade,
} from '../src/auth/trade-record';

const OPENED = 1_700_000_000_000;

function openTrade(changes: Partial<TradeRecord> = {}): TradeRecord {
  return {
    proposer: 'proposer',
    receiver: 'receiver',
    offered: 'offered-catch',
    asked: '',
    given: '',
    gold: 0,
    status: TradeStatus.Open,
    createdAt: OPENED,
    resolvedAt: 0,
    offset: 0,
    ...changes,
  };
}

describe('the gold riding a trade', () => {
  it('reads whole and inside the limit either way', () => {
    expect(asTradeGold(12.7)).toBe(12);
    expect(asTradeGold(-12.7)).toBe(-12);
    expect(asTradeGold(TRADE_GOLD_LIMIT * 2)).toBe(TRADE_GOLD_LIMIT);
    expect(asTradeGold(-TRADE_GOLD_LIMIT * 2)).toBe(-TRADE_GOLD_LIMIT);
  });

  it('reads nothing a number cannot be as nothing riding', () => {
    expect(asTradeGold(Number.NaN)).toBe(0);
    expect(asTradeGold(Number.POSITIVE_INFINITY)).toBe(0);
    expect(asTradeGold('100')).toBe(0);
  });
});

describe('restoring a stored trade', () => {
  it('fills missing fields with their idle values', () => {
    const restored = asTradeRecord({ proposer: 'a', receiver: 'b', offered: 'c' });

    expect(restored.asked).toBe('');
    expect(restored.given).toBe('');
    expect(restored.gold).toBe(0);
    expect(restored.status).toBe(TradeStatus.Open);
    expect(restored.resolvedAt).toBe(0);
  });

  it('leaves an escrowed pokemon owned by nobody', () => {
    // Every write that touches a catch asks whether the caller is its
    // owner, and a uid is never empty, so escrow is refused to
    // everyone by the checks that were already there
    expect(TRADE_ESCROW).toBe('');
  });
});

describe('who may do what to a trade', () => {
  it('lets only the receiver answer, only while open', () => {
    expect(canAnswerTrade(openTrade(), 'receiver')).toBe(true);
    expect(canAnswerTrade(openTrade(), 'proposer')).toBe(false);
    expect(canAnswerTrade(openTrade(), 'stranger')).toBe(false);
    expect(canAnswerTrade(openTrade({ status: TradeStatus.Accepted }), 'receiver')).toBe(false);
    expect(canAnswerTrade(openTrade({ status: TradeStatus.Cancelled }), 'receiver')).toBe(false);
  });

  it('lets only the proposer take it back, only while open', () => {
    expect(canCancelTrade(openTrade(), 'proposer')).toBe(true);
    expect(canCancelTrade(openTrade(), 'receiver')).toBe(false);
    expect(canCancelTrade(openTrade({ status: TradeStatus.Declined }), 'proposer')).toBe(false);
  });

  it('counts every settled state as closed', () => {
    expect(isOpenTrade(openTrade())).toBe(true);
    expect(isOpenTrade(openTrade({ status: TradeStatus.Accepted }))).toBe(false);
    expect(isOpenTrade(openTrade({ status: TradeStatus.Declined }))).toBe(false);
    expect(isOpenTrade(openTrade({ status: TradeStatus.Cancelled }))).toBe(false);
  });
});
