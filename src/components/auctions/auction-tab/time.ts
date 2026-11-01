import { type AuctionRecord, isBidOn } from '../../../auth/auctions';
import { m } from '../../../i18n/paraglide/messages.js';

const HOUR = 60 * 60 * 1000;

const MINUTE = 60 * 1000;

/**
 * The reader's own clock. Nothing about an auction happens at a
 * particular instant — a lot that closed is only a lot nobody may bid
 * on any more, and the winner collects it whenever they come back — so
 * the board asks the time when it draws rather than following it. The
 * server decides both questions again when a bid or a claim actually
 * arrives
 */
export function now(): number {
  return Date.now();
}

/**
 * How long there is left, in the units a seller would say it in
 */
export function describeRemaining(endsAt: number, at: number): string {
  const left = endsAt - at;

  if (left <= 0) {
    return m.auction_closed();
  }

  const hours = Math.floor(left / HOUR);

  if (hours > 0) {
    return m.auction_left_hours({ hours });
  }
  return m.auction_left_minutes({ minutes: Math.max(1, Math.floor(left / MINUTE)) });
}

/**
 * What the lot stands at: what it has been bid up to, or what it is
 * asking for where nobody has bid yet.
 *
 * One number rather than two. The row used to carry what it stood at
 * *and* what the next bid would have to be, which is the same figure
 * said twice over for a reader who is about to be shown it again in
 * the dialog the Bid button opens — and it made the busiest column on
 * the board the one nobody reads
 */
export function describeStanding(auction: AuctionRecord): string {
  return m.ui_gold({ amount: isBidOn(auction) ? auction.bid : auction.startingBid });
}
