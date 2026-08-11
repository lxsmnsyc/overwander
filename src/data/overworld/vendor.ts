import { BALL_ITEMS, ItemFlags, Items } from '../ids/items';
import { getItemData } from '../items';
import { MEDICINES } from '../items/medicine';

/**
 * What a vendor carries, and what he will take off a player's hands.
 *
 * He is the first thing in the game that sells anything, so the rule
 * for what may be sold is deliberately the item registry's own rather
 * than a second list to keep in step: an item is stocked if it is
 * **Marketable**, and it is a ball or medicine. That is what keeps the
 * Master Ball out of his crate without naming it — it is the one ball
 * registered without the flag, because nothing was ever meant to put a
 * price on it.
 *
 * What he **buys** is wider than what he sells: anything Marketable at
 * all, so a walk that turned up nuggets and pearls has somewhere to
 * turn them into gold. The prices are the registry's `buy` and `sell`,
 * and `sell` is half of `buy` everywhere, so nothing can be bought
 * from him and sold back at a profit.
 */

/**
 * How many kinds one vendor's crate holds. Small enough that walking
 * to the next one is worth doing, large enough that a crate is a
 * choice rather than an offer
 */
export const VENDOR_STOCK_KINDS = 6;

/**
 * The two every vendor carries, whatever else the window rolled. A
 * trader who might have no balls and no potions is a trader a player
 * cannot plan a walk around
 */
export const VENDOR_STAPLES: Items[] = [Items.PokeBall, Items.Potion];

/**
 * The most of one kind that changes hands in a single trade. Gold is
 * the real limit; this is only so a slip of the keyboard cannot ask
 * for a hundred thousand potions
 */
export const VENDOR_TRADE_LIMIT = 99;

let stocked: Items[] | null = null;

/**
 * Whether the market puts a price on the item at all. Everything the
 * vendor does on either side of the counter asks this first
 */
export function isMarketable(item: Items): boolean {
  return (getItemData(item).flags & ItemFlags.Marketable) !== 0;
}

/**
 * Everything a vendor could conceivably have in his crate: the balls
 * and the medicine, minus whatever the registry declined to price.
 *
 * Worked out on the first ask rather than at import, because the
 * registry is filled by `registerItems()` and a module read at import
 * time would be reading an empty one
 */
export function getVendorGoods(): Items[] {
  stocked ??= [...Object.values(BALL_ITEMS), ...MEDICINES.keys()].filter(isMarketable);
  return stocked;
}

/**
 * What this vendor is carrying: the staples, then kinds drawn without
 * repeats until the crate is full.
 *
 * The draw is the caller's, which is what makes a crate derived rather
 * than stored — every player who walks up to the same vendor in the
 * same window is shown the same six things
 */
export function rollVendorStock(random: () => number): Items[] {
  const staples = new Set(VENDOR_STAPLES);
  const rest = getVendorGoods().filter((item) => !staples.has(item));
  const stock = [...VENDOR_STAPLES];

  while (stock.length < VENDOR_STOCK_KINDS && rest.length > 0) {
    const at = Math.floor(random() * rest.length);

    stock.push(rest[at]);
    // The last kind is moved into the hole rather than the array being
    // spliced: order within the crate is not meaningful, and this way
    // a draw stays one swap however long the list is
    rest[at] = rest[rest.length - 1];
    rest.pop();
  }
  return stock;
}
