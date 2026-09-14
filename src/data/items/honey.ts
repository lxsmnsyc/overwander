import { ItemFlags, ItemTypes, Items } from '../ids/items';
import { registerItem } from './__create';

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

export default function registerHoney(): void {
  registerItem(Items.Honey, {
    name: 'Honey',
    description: `Restores ${HONEY_RESTORE} HP to the pokemon holding it once it drops to a quarter.`,
    type: ItemTypes.Held,
    icon: 'other/honey',
    flags: ItemFlags.Holdable | ItemFlags.Consumable | ItemFlags.Marketable,
    buy: 200,
    sell: 100,
  });
}
