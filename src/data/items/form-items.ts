import type { Species } from '../ids/species';
import { ItemFlags, ItemTypes, Items } from '../ids/items';
import { registerItem } from './__create';

/**
 * The form items: held for the shape they put their holder into.
 *
 * A form item names a set of shapes one species comes in, and while a
 * pokemon of that species is holding it, the shape it fights in is
 * one of them.
 *
 * Nothing uses it today. Deoxys did, and now rearranges itself
 * through the evolution route instead, which lets a player pick the
 * shape rather than roll for it. The seam is kept because a shape
 * worn for one fight is a different thing from a shape a pokemon is
 * put into and keeps, and a later species may want the first.
 *
 * The battle side lives in
 * [`src/battle/items/forms.ts`](../../battle/items/forms.ts).
 */
export const FORM_ITEMS = new Map<Items, Species[]>();

/**
 * The shapes this item rearranges its holder into, or an empty list
 * for everything else in the bag
 */
export function getItemForms(item: Items): Species[] {
  return FORM_ITEMS.get(item) ?? [];
}

/**
 * What a rock that fell out of the sky is worth. Dear: it is the only
 * way to any shape but the one a Deoxys arrives in, and it is spent
 * on every rearrangement rather than held through them
 */
export const METEORITE_PRICE = 12_000;

export default function registerFormItems(): void {
  registerItem(Items.Meteorite, {
    name: 'Meteorite',
    description: 'Rearranges the Deoxys it is used on into another of its shapes.',
    type: ItemTypes.Evolution,
    // The rock is drawn on the key sheet, which is where the
    // collection packed it
    icon: 'key/meteorite',
    flags: ItemFlags.Usable,
    buy: 0,
    sell: METEORITE_PRICE / 2,
  });
}
