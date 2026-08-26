import { ItemFlags, ItemTypes, Items } from '../ids/items';
import { NON_VOLATILE_STATUSES, type Statuses } from '../ids/status';
import { nameToIcon, registerItem } from './__create';

/**
 * The regional treats: what somebody brings back from a city they
 * went to.
 *
 * The wandering chef is the one counter that stocks them. Most are a
 * Full Heal in the hand; the one candy bar is a bottle of water that
 * came in a wrapper. What they do in a fight is in
 * [`src/battle/items/treats.ts`](../../battle/items/treats.ts).
 */

export interface Treat {
  name: string;
  /**
   * Health it gives back. Zero for the sweets, which only cure
   */
  restore: number;
  buy: number;
}

/**
 * What a sweet takes off: the same six a Full Heal answers, so a
 * souvenir is never worth more than the bottle it stands in for
 */
export const TREAT_CURES: Set<Statuses> = new Set(NON_VOLATILE_STATUSES);

/**
 * What the chef charges for a sweet. It undercuts the Full Heal it
 * copies, and sells back at half like everything else on a counter
 */
const SWEET_PRICE = 600;

export const TREATS: Map<Items, Treat> = new Map([
  [Items.LavaCookie, { name: 'Lava Cookie', restore: 0, buy: SWEET_PRICE }],
  [Items.OldGateau, { name: 'Old Gateau', restore: 0, buy: SWEET_PRICE }],
  [Items.Casteliacone, { name: 'Casteliacone', restore: 0, buy: SWEET_PRICE }],
  [Items.LumioseGalette, { name: 'Lumiose Galette', restore: 0, buy: SWEET_PRICE }],
  [Items.ShalourSable, { name: 'Shalour Sable', restore: 0, buy: SWEET_PRICE }],
  [Items.BigMalasada, { name: 'Big Malasada', restore: 0, buy: SWEET_PRICE }],
  [Items.PewterCrunchies, { name: 'Pewter Crunchies', restore: 0, buy: SWEET_PRICE }],
  // The two that feed their holder rather than curing them, which
  // puts them with the drinks and not with the sweets
  [Items.RageCandyBar, { name: 'Rage Candy Bar', restore: 20, buy: 300 }],
  [Items.SweetHeart, { name: 'Sweet Heart', restore: 20, buy: 300 }],
]);

export function isTreat(item: Items): boolean {
  return TREATS.has(item);
}

const TREAT_RESALE = 0.5;

export default function registerTreats(): void {
  for (const [item, treat] of TREATS) {
    registerItem(item, {
      name: treat.name,
      description:
        treat.restore > 0
          ? `Restores ${treat.restore} HP when its holder drops to 1/5 of its HP.`
          : 'Cures every status a second after one lands on its holder.',
      type: ItemTypes.Held,
      icon: nameToIcon('medicine', treat.name),
      flags: ItemFlags.Holdable | ItemFlags.Consumable | ItemFlags.Marketable,
      buy: treat.buy,
      sell: treat.buy * TREAT_RESALE,
    });
  }
}
