import { ItemFlags, ItemTypes, Items } from '../ids/items';
import { registerItem } from './__create';

/**
 * Honey: sticky sweet food a pokemon carries and eats when it is
 * nearly out.
 *
 * The mainline uses it to bait a tree and nothing else, and the tree
 * belongs to a region this game has not reached. What it is in the
 * meantime is the thing a Teddiursa gathers, so it is held and eaten
 * rather than left as an id with nothing behind it. Baiting a tree
 * with the same jar stays open.
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
    flags: ItemFlags.Holdable | ItemFlags.Consumable,
    buy: 0,
    sell: 100,
  });
}
