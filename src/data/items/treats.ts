import { ItemFlags, ItemTypes, Items } from '../ids/items';
import { NON_VOLATILE_STATUSES, type Statuses } from '../ids/status';
import { nameToIcon, registerItem } from './__create';

/**
 * The regional treats: what somebody brings back from a city they
 * went to.
 *
 * Nothing stocks them, which is what separates them from the drinks
 * beside them on the shelf. Most are a Full Heal in the hand; the one
 * candy bar is a bottle of water that came in a wrapper. What they do
 * in a fight is in
 * [`src/battle/items/treats.ts`](../../battle/items/treats.ts).
 */

export interface Treat {
  name: string;
  /**
   * Health it gives back. Zero for the sweets, which only cure
   */
  restore: number;
  sell: number;
}

/**
 * What a sweet takes off: the same six a Full Heal answers, so a
 * souvenir is never worth more than the bottle it stands in for
 */
export const TREAT_CURES: Set<Statuses> = new Set(NON_VOLATILE_STATUSES);

/**
 * What one fetches when sold. A sweet undercuts the Full Heal it
 * copies, since nobody chose to carry it
 */
const SWEET_RESALE = 300;

export const TREATS: Map<Items, Treat> = new Map([
  [Items.LavaCookie, { name: 'Lava Cookie', restore: 0, sell: SWEET_RESALE }],
  [Items.OldGateau, { name: 'Old Gateau', restore: 0, sell: SWEET_RESALE }],
  [Items.Casteliacone, { name: 'Casteliacone', restore: 0, sell: SWEET_RESALE }],
  [Items.LumioseGalette, { name: 'Lumiose Galette', restore: 0, sell: SWEET_RESALE }],
  [Items.ShalourSable, { name: 'Shalour Sable', restore: 0, sell: SWEET_RESALE }],
  [Items.BigMalasada, { name: 'Big Malasada', restore: 0, sell: SWEET_RESALE }],
  [Items.PewterCrunchies, { name: 'Pewter Crunchies', restore: 0, sell: SWEET_RESALE }],
  // The two that feed their holder rather than curing them, which
  // puts them with the drinks and not with the sweets
  [Items.RageCandyBar, { name: 'Rage Candy Bar', restore: 20, sell: 150 }],
  [Items.SweetHeart, { name: 'Sweet Heart', restore: 20, sell: 150 }],
]);

export function isTreat(item: Items): boolean {
  return TREATS.has(item);
}

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
      flags: ItemFlags.Holdable | ItemFlags.Consumable,
      buy: 0,
      sell: treat.sell,
    });
  }
}
