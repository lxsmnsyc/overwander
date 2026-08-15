import { ItemFlags, ItemTypes, Items } from '../ids/items';
import { nameToIcon, registerItem } from './__create';

/**
 * The trinkets: held items whose whole effect happens outside a fight.
 * A pokemon carrying one fights exactly as it would carrying nothing.
 *
 * The Everstone acts in the evolution rules
 * ([`src/data/species/evolution.ts`](../species/evolution.ts)) and in
 * breeding; the other two act in
 * [`src/overworld/items/trinkets.ts`](../../overworld/items/trinkets.ts).
 */

/**
 * What the market lists. The tag does what a Pure Incense does, so it
 * is priced as one
 */
export const MARKET_TRINKETS: Map<Items, [name: string, description: string]> = new Map([
  [Items.CleanseTag, ['Cleanse Tag', 'Fewer wild spawns around the buddy carrying it.']],
]);

/**
 * The two nobody sells: a stone dug out of the ground, and a coin no
 * shopkeeper would part with for gold. Being unbuyable is what keeps
 * the coin from simply being a better Luck Incense on the same shelf
 */
export const FOUND_TRINKETS: Map<Items, [name: string, description: string]> = new Map([
  [
    Items.Everstone,
    ['Everstone', 'Its holder will not evolve, whatever it meets the conditions for.'],
  ],
  [Items.AmuletCoin, ['Amulet Coin', 'Three times the gold from any fight its holder is in.']],
]);

/**
 * Every trinket, for callers that only care that it is one
 */
export const TRINKETS: Map<Items, [name: string, description: string]> = new Map([
  ...MARKET_TRINKETS,
  ...FOUND_TRINKETS,
]);

/**
 * What a listed one costs. It is the incense price rather than the
 * gear price because the tag is an incense by another name
 */
export const TRINKET_PRICE = 3000;

const TRINKET_RESALE = 0.5;

/**
 * What a found one fetches. Nothing stocks them, so this is only what
 * somebody will pay to take one away
 */
const FOUND_TRINKET_RESALE = 1000;

export function isTrinket(item: Items): boolean {
  return TRINKETS.has(item);
}

export default function registerTrinkets(): void {
  for (const [item, [name, description]] of MARKET_TRINKETS) {
    registerItem(item, {
      name,
      description,
      type: ItemTypes.Held,
      icon: nameToIcon('held', name),
      flags: ItemFlags.Holdable | ItemFlags.Marketable,
      buy: TRINKET_PRICE,
      sell: TRINKET_PRICE * TRINKET_RESALE,
    });
  }

  for (const [item, [name, description]] of FOUND_TRINKETS) {
    registerItem(item, {
      name,
      description,
      type: ItemTypes.Held,
      icon: nameToIcon('held', name),
      flags: ItemFlags.Holdable,
      buy: 0,
      sell: FOUND_TRINKET_RESALE,
    });
  }
}
