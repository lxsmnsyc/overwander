import 'server-only';
import Npc from '../../data/overworld/npc';
import { VENDOR_TRADE_LIMIT, sellPrice } from '../../data/overworld/vendor';
import type { Items } from '../../data/ids/items';
import { getItemData } from '../../data/items';
import { tx } from '../db';
import { readStacksIn, writeStackIn } from '../stacks';
import { ITEM_STACKS } from '../../auth/stacks';
import { Metric } from '../../auth/quest-record';
import { bumpProgress } from '../quest-progress';
import { asNumber } from '../read';
import type { TradeResult } from './moves';
import { resolveNpc } from './visits';

/** The counter itself: what is bought and what is sold back */
/**
 * Move gold and one stack of items in the same transaction, in
 * whichever direction the trade goes.
 *
 * A shop is the one place in the game where two stores have to agree:
 * a player charged for a potion that was never handed over is worse
 * off than one who was refused, and a potion handed over for gold that
 * was never taken is a mint. The purse and the stack are read and
 * written together, so neither can happen.
 *
 * Resolves null when the player cannot cover their side of it
 */
export async function trade(
  uid: string,
  basket: [item: Items, amount: number][],
  gold: number,
): Promise<TradeResult | null> {
  const traded = await tx(async (transaction) => {
    const profiles = await transaction`
      select gold from profiles where id = ${uid} for update
    `;
    const carried = await readStacksIn(
      transaction,
      ITEM_STACKS,
      uid,
      basket.map(([item]) => item),
    );
    const balance = asNumber(profiles[0]?.gold) + gold;
    const held = basket.map(([item, amount]) => (carried.get(item) ?? 0) + amount);

    // The player cannot pay, or is selling what they have not got.
    // The whole basket is refused rather than the affordable part of
    // it: a trade a player agreed to is one trade
    if (balance < 0 || held.some((count) => count < 0)) {
      return null;
    }

    await transaction`update profiles set gold = ${balance} where id = ${uid}`;
    for (const [at, [item]] of basket.entries()) {
      await writeStackIn(transaction, ITEM_STACKS, uid, item, held[at]);
    }
    return { gold: balance, carried: held.reduce((total, count) => total + count, 0) };
  });

  // Signed the way the balance moved: buying spends, selling earns
  if (traded != null && gold !== 0) {
    await bumpProgress(uid, [
      gold > 0 ? [Metric.GoldEarned, 0, gold] : [Metric.GoldSpent, 0, -gold],
    ]);
  }
  return traded;
}

/**
 * What a basket comes to, or null when any of it is something the
 * vendor will not trade. Nothing is charged for a basket that has one
 * bad line in it
 */
function priced(
  basket: [item: Items, amount: number][],
  price: (item: Items) => number,
): number | null {
  let total = 0;

  for (const [item, amount] of basket) {
    const each = price(item);

    if (!Number.isInteger(amount) || amount < 1 || amount > VENDOR_TRADE_LIMIT || each <= 0) {
      return null;
    }
    total += each * amount;
  }
  return basket.length === 0 ? null : total;
}

/**
 * Buy from a trader's crate — the vendor's, or the chef's larder. The
 * crate is derived from the same seed the trader is, so the basket has
 * to be what they are actually standing behind, and the price is the
 * registry's `buy`.
 *
 * The whole basket is one transaction — six kinds or none — and the
 * traders are the wanderers not limited to once per window.
 *
 * Resolves the balance and what the bag now holds, or null when the
 * trader is not there, is not carrying it, or the player cannot pay
 */
export async function buyFromVendor(
  uid: string,
  x: number,
  y: number,
  cell: number,
  basket: [item: Items, amount: number][],
  now: number,
  offset: number,
  trader: Npc = Npc.Vendor,
): Promise<TradeResult | null> {
  if (trader !== Npc.Vendor && trader !== Npc.Chef) {
    return null;
  }

  const snapshot = resolveNpc(x, y, cell, now, offset, trader);

  if (snapshot == null) {
    return null;
  }

  const stock = new Set(snapshot.getVendorStock(cell));
  // A crate is only ever filled with priced goods, so a zero price is
  // a registry that changed under the vendor rather than a free item
  const owed = priced(basket, (item) => (stock.has(item) ? getItemData(item).buy : 0));

  return owed == null ? null : trade(uid, basket, -owed);
}

/**
 * Sell to the vendor.
 *
 * What he takes is wider than what he sells: anything the market puts
 * a price on, so the pearls and nuggets a walk turns up have somewhere
 * to go. What he pays is the registry's `sell`, which is half of what
 * he charges for the same item — buying from him and selling it
 * straight back is a way to lose money, which is the point.
 *
 * The basket is one trade here too, so a bag that turns out to be
 * short of one line sells nothing rather than part of it.
 *
 * Resolves the balance and what is left, or null when he is not
 * standing there, will not price something, or the player has not got
 * that many
 */
export async function sellToVendor(
  uid: string,
  x: number,
  y: number,
  cell: number,
  basket: [item: Items, amount: number][],
  now: number,
  offset: number,
  trader: Npc = Npc.Vendor,
): Promise<TradeResult | null> {
  if (trader !== Npc.Vendor && trader !== Npc.Chef) {
    return null;
  }

  const snapshot = resolveNpc(x, y, cell, now, offset, trader);

  if (snapshot == null) {
    return null;
  }

  // What he pays is the registry's price, not whether he stocks it:
  // the pearls and nuggets a walk turns up are never in a crate, and
  // selling them is the only thing they are for
  const paid = priced(basket, sellPrice);

  return paid == null
    ? null
    : trade(
        uid,
        basket.map(([item, amount]) => [item, -amount]),
        paid,
      );
}
