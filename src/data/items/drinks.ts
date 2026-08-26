import { ItemFlags, ItemTypes, Items } from '../ids/items';
import { nameToIcon, registerItem } from './__create';

/**
 * The drinks: what a region bottles and sells to anybody walking past.
 *
 * They are the cheap end of the shelf and the only bought thing a
 * pokemon carries into a fight for itself. A potion is worth more per
 * gold and cannot be taken along; a berry is held but has to be grown
 * or found. A drink is bought, held, and drunk without being asked —
 * see [`src/battle/items/drinks.ts`](../../battle/items/drinks.ts) for
 * when.
 */

export interface Drink {
  name: string;
  /**
   * Health it gives back. Flat rather than a share, which is what
   * makes the cheap ones worth less to a big pokemon and the dear ones
   * worth carrying by anybody
   */
  restore: number;
  buy: number;
}

export const DRINKS: Map<Items, Drink> = new Map([
  [Items.FreshWater, { name: 'Fresh Water', restore: 30, buy: 200 }],
  [Items.SodaPop, { name: 'Soda Pop', restore: 60, buy: 300 }],
  [Items.Lemonade, { name: 'Lemonade', restore: 80, buy: 350 }],
  [Items.MoomooMilk, { name: 'Moomoo Milk', restore: 100, buy: 500 }],
  // Squeezed fresh by the chef rather than bottled, and what it gives
  // back is what one handful of berries is worth
  [Items.BerryJuice, { name: 'Berry Juice', restore: 20, buy: 300 }],
]);

const DRINK_RESALE = 0.5;

export function isDrink(item: Items): boolean {
  return DRINKS.has(item);
}

export default function registerDrinks(): void {
  for (const [item, drink] of DRINKS) {
    registerItem(item, {
      name: drink.name,
      description: `Restores ${drink.restore} HP when its holder drops to 1/5 of its HP.`,
      type: ItemTypes.Held,
      icon: nameToIcon('medicine', drink.name),
      flags: ItemFlags.Holdable | ItemFlags.Consumable | ItemFlags.Marketable,
      buy: drink.buy,
      sell: drink.buy * DRINK_RESALE,
    });
  }
}
