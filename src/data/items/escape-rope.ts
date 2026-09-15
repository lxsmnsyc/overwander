import { MOUTH_SEARCH } from '../overworld/cave';
import { ItemFlags, ItemTypes, Items } from '../ids/items';
import { registerItem } from './__create';

/**
 * The Escape Rope: the way out of a cave that is not the walk back
 * through it. Spent rather than carried, so the walk stays the usual
 * cost of having gone in.
 */

export function isEscapeRope(item: Items): boolean {
  return item === Items.EscapeRope;
}

export default function registerEscapeRope(): void {
  registerItem(Items.EscapeRope, {
    name: 'Escape Rope',
    description: `Climbs out of a cave at the nearest mouth, up to ${MOUTH_SEARCH} chunks away. Spent on use.`,
    type: ItemTypes.KeyItem,
    icon: 'other/escape-rope',
    flags: ItemFlags.Usable | ItemFlags.Consumable,
    buy: 0,
    sell: 0,
  });
}
