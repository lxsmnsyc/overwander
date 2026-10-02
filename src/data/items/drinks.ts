import { Items } from '../ids/items';
import { itemText } from './__create';

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
  /**
   * Health it gives back. Flat rather than a share, which is what
   * makes the cheap ones worth less to a big pokemon and the dear ones
   * worth carrying by anybody
   */
  restore: number;
}

export const DRINKS: Map<Items, Drink> = new Map([
  [Items.FreshWater, { restore: 30 }],
  [Items.SodaPop, { restore: 60 }],
  [Items.Lemonade, { restore: 80 }],
  [Items.MoomooMilk, { restore: 100 }],
  // Squeezed fresh by the chef rather than bottled, and what it gives
  // back is what one handful of berries is worth
  [Items.BerryJuice, { restore: 20 }],
]);

export function isDrink(item: Items): boolean {
  return DRINKS.has(item);
}

export function describeDrink(item: Items): string {
  return itemText('drinks', 'drink', { restore: DRINKS.get(item)?.restore ?? 0 });
}
