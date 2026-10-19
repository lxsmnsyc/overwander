import { Items } from '../ids/items';

/**
 * The trinkets: held items whose whole effect happens outside a fight.
 * A pokemon carrying one fights exactly as it would carrying nothing.
 *
 * The Everstone acts in the evolution rules
 * ([`src/data/species/evolution.ts`](../species/evolution.ts)) and in
 * breeding; the other two act in
 * [`src/overworld/items/trinkets.ts`](../../overworld/items/trinkets.ts).
 */

/** What the market lists */
export const MARKET_TRINKETS = new Set<Items>([Items.CleanseTag]);

/**
 * The two no stall sells: a stone the geologist digs up, and a coin no
 * shopkeeper would part with for gold. Being unbuyable is what keeps
 * the coin from simply being a better Luck Incense on the same shelf
 */
export const FOUND_TRINKETS = new Set<Items>([Items.Everstone, Items.AmuletCoin]);

/**
 * Every trinket, for callers that only care that it is one
 */
export const TRINKETS = new Set<Items>([...MARKET_TRINKETS, ...FOUND_TRINKETS]);

export function isTrinket(item: Items): boolean {
  return TRINKETS.has(item);
}
