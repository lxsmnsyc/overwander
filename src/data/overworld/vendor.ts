import { BALL_ITEMS, ItemFlags, Items } from '../ids/items';
import { getItemData } from '../items';
import { BATTLE_ITEMS } from '../items/battle-items';
import { DRINKS } from '../items/drinks';
import { INCENSES } from '../items/incenses';
import { MEDICINES } from '../items/medicine';
import { TREATS } from '../items/treats';
import { PP_ITEMS, VITAMIN_STATS } from '../items/vitamins';

/**
 * What a vendor carries, and what he will take off a player's hands.
 *
 * A vendor comes in **kinds** now: the window that rolls him onto the
 * cell also rolls which counter he set up. The original one deals in
 * balls and medicine; the others each carry one shelf the mainline
 * kept behind a department-store counter — vitamins, incenses, or the
 * X items. The rule for what may be sold stays the registry's own: an
 * item is stocked only if it is **Marketable**, which is what keeps
 * the Master Ball and the Berry Juice out of the crates that would
 * otherwise list them.
 *
 * What he **buys** is wider than what he sells: anything Marketable at
 * all, so a walk that turned up nuggets and pearls has somewhere to
 * turn them into gold. The prices are the registry's `buy` and `sell`,
 * and `sell` is half of `buy` everywhere, so nothing can be bought
 * from him and sold back at a profit.
 */

/**
 * The counters a vendor may be standing behind. Which one he set up
 * is the window's roll, like the coat he turned up in
 */
export const enum VendorKind {
  Medicine = 0,
  Vitamins = 1,
  Incenses = 2,
  BattleItems = 3,
}

export const VENDOR_KINDS: VendorKind[] = [
  VendorKind.Medicine,
  VendorKind.Vitamins,
  VendorKind.Incenses,
  VendorKind.BattleItems,
];

/**
 * How many kinds one crate holds. Small enough that walking to the
 * next one is worth doing, large enough that a crate is a choice
 * rather than an offer
 */
export const VENDOR_STOCK_KINDS = 6;

/**
 * The two the medicine vendor always carries, whatever else the
 * window rolled. A trader who might have no balls and no potions is a
 * trader a player cannot plan a walk around; the other counters have
 * no staple, since their whole shelf is the plan
 */
export const VENDOR_STAPLES: Items[] = [Items.PokeBall, Items.Potion];

/**
 * The most of one kind that changes hands in a single trade. Gold is
 * the real limit; this is only so a slip of the keyboard cannot ask
 * for a hundred thousand potions
 */
export const VENDOR_TRADE_LIMIT = 99;

/**
 * Whether the market puts a price on the item at all. Everything the
 * vendor does on either side of the counter asks this first
 */
export function isMarketable(item: Items): boolean {
  return (getItemData(item).flags & ItemFlags.Marketable) !== 0;
}

/**
 * What a vendor pays for one, which is a wider question than what he
 * stocks.
 *
 * The `Marketable` flag says the market **lists** the item — that it
 * could be in a crate. What he takes off a player's hands is anything
 * the registry puts a `sell` figure on: the pearls and nuggets a walk
 * turns up exist for nothing else, and a berry picked off a bush is
 * worth something to him too.
 *
 * Zero means he will not take it at all. A Heart Scale, a Portal Key
 * and the stones nothing can spend yet are all priced at nothing on
 * purpose — what they are worth is not gold
 */
export function sellPrice(item: Items): number {
  return getItemData(item).sell;
}

/**
 * Everything each counter could conceivably carry, minus whatever the
 * registry declined to price.
 *
 * Worked out on the first ask rather than at import, because the
 * registry is filled by `registerItems()` and a module read at import
 * time would be reading an empty one
 */
const SHELVES = new Map<VendorKind, () => Items[]>([
  [VendorKind.Medicine, () => [...Object.values(BALL_ITEMS), ...MEDICINES.keys()]],
  [VendorKind.Vitamins, () => [...VITAMIN_STATS.keys(), ...PP_ITEMS.keys()]],
  [VendorKind.Incenses, () => [...INCENSES]],
  [VendorKind.BattleItems, () => [...BATTLE_ITEMS]],
]);

const stocked = new Map<VendorKind, Items[]>();

export function getVendorGoods(kind: VendorKind = VendorKind.Medicine): Items[] {
  const built = stocked.get(kind);

  if (built != null) {
    return built;
  }

  const goods = (SHELVES.get(kind)?.() ?? []).filter(isMarketable);

  stocked.set(kind, goods);
  return goods;
}

/**
 * What this vendor is carrying: the kind's staples, then kinds drawn
 * without repeats until the crate is full.
 *
 * The draw is the caller's, which is what makes a crate derived rather
 * than stored — every player who walks up to the same vendor in the
 * same window is shown the same six things
 */
export function rollVendorStock(
  random: () => number,
  kind: VendorKind = VendorKind.Medicine,
): Items[] {
  const staples = kind === VendorKind.Medicine ? VENDOR_STAPLES : [];

  return fillCrate(staples, getVendorGoods(kind), random);
}

/**
 * The chef's whole larder: the drinks a region bottles and the treats
 * somebody brings home from its cities. He is the only one who stocks
 * either
 */
let larder: Items[] | null = null;

export function getChefGoods(): Items[] {
  larder ??= [...DRINKS.keys(), ...TREATS.keys()].filter(isMarketable);
  return larder;
}

/**
 * What the chef has cooked up this window: six dishes off the larder,
 * drawn the way a vendor's crate is
 */
export function rollChefStock(random: () => number): Items[] {
  return fillCrate([], getChefGoods(), random);
}

/**
 * A crate off a shelf: the staples first, then draws without repeats
 * until it is full or the shelf runs out
 */
function fillCrate(staples: Items[], goods: Items[], random: () => number): Items[] {
  const held = new Set(staples);
  const rest = goods.filter((item) => !held.has(item));
  const stock = [...staples];

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
