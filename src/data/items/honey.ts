import { Items } from '../ids/items';
import { itemText } from './__create';

/**
 * Honey: lathered on a honey tree to draw out what lives in it, or
 * held and eaten when its pokemon is nearly out. Sold at the medicine
 * stall and buried in caches
 */

/**
 * How far down the holder has to be. The same quarter a berry waits
 * for, since honey is food rather than the cheaper bought answer a
 * drink is
 */
export const HONEY_THRESHOLD = 0.25;

/**
 * What one jar gives back
 */
export const HONEY_RESTORE = 40;

export function describeHoney(item: Items): string {
  if (item !== Items.Honey) {
    throw new Error(`No honey description for item ${item}`);
  }
  return itemText('honey', 'honey', { restore: HONEY_RESTORE });
}
