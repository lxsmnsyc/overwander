import { ItemFlags, ItemTypes, Items } from '../ids/items';
import { nameToIcon, registerItem } from './__create';

/**
 * The trinkets: held items whose whole effect happens outside a
 * fight.
 *
 * A pokemon carrying one of these fights exactly as it would carrying
 * nothing, which is what separates them from the gear. What they
 * change is everything around the fight — whether their holder is
 * allowed to grow up, what a purse pays the player who owns it, and
 * how much of the world comes near while it walks.
 *
 * Two of the three have twins already in the game, the way the
 * mainline has them: a Luck Incense pays what an Amulet Coin pays,
 * and a Pure Incense keeps away what a Cleanse Tag keeps away. What
 * separates each pair here is where it comes from — the incenses are
 * bought and the coin is found, and the found one pays more for being
 * unbuyable.
 *
 * The Everstone's side of it lives in the evolution rules
 * ([`src/data/species/evolution.ts`](../species/evolution.ts)) and in
 * breeding; what the other two change about the overworld lives in
 * [`src/overworld/items/trinkets.ts`](../../overworld/items/trinkets.ts).
 */

/**
 * What the market lists. The tag is the one of the three somebody
 * could plausibly make more of, and it does what a Pure Incense does,
 * so it is priced as one
 */
export const MARKET_TRINKETS: Map<Items, string> = new Map([[Items.CleanseTag, 'Cleanse Tag']]);

/**
 * The two nobody sells.
 *
 * A stone that stops a pokemon growing up is dug out of the ground,
 * and a coin that triples a purse is not something a shopkeeper would
 * ever part with for gold — selling one would cost him more than it
 * made him. Both are found or not had at all, which is also what
 * keeps the coin from simply being a better Luck Incense on the same
 * shelf: the incense is what a player buys, and the coin is what a
 * player is lucky enough to dig up
 */
export const FOUND_TRINKETS: Map<Items, string> = new Map([
  [Items.Everstone, 'Everstone'],
  [Items.AmuletCoin, 'Amulet Coin'],
]);

/**
 * Every trinket, for callers that only care that it is one
 */
export const TRINKETS: Map<Items, string> = new Map([...MARKET_TRINKETS, ...FOUND_TRINKETS]);

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
  for (const [item, name] of MARKET_TRINKETS) {
    registerItem(item, {
      name,
      type: ItemTypes.Held,
      icon: nameToIcon('held', name),
      // Held for as long as its holder keeps it: none of them is
      // spent, and none is used on a pokemon
      flags: ItemFlags.Holdable | ItemFlags.Marketable,
      buy: TRINKET_PRICE,
      sell: TRINKET_PRICE * TRINKET_RESALE,
    });
  }

  for (const [item, name] of FOUND_TRINKETS) {
    registerItem(item, {
      name,
      type: ItemTypes.Held,
      icon: nameToIcon('held', name),
      flags: ItemFlags.Holdable,
      buy: 0,
      sell: FOUND_TRINKET_RESALE,
    });
  }
}
