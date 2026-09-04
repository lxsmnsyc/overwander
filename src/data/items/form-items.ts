import { DEOXYS_FORMS, type Species } from '../ids/species';
import { ItemFlags, ItemTypes, Items } from '../ids/items';
import { registerItem } from './__create';

/**
 * The form items: held for the shape they put their holder into.
 *
 * A form item names a set of shapes one species comes in, and while a
 * pokemon of that species is holding it, the shape it fights in is
 * one of them. It is the first of its kind here, so the map is what a
 * later one is added to rather than a special case for this one.
 *
 * The battle side lives in
 * [`src/battle/items/forms.ts`](../../battle/items/forms.ts).
 */
export const FORM_ITEMS = new Map<Items, Species[]>([[Items.Meteorite, DEOXYS_FORMS]]);

/**
 * The shapes this item rearranges its holder into, or an empty list
 * for everything else in the bag
 */
export function getItemForms(item: Items): Species[] {
  return FORM_ITEMS.get(item) ?? [];
}

/**
 * What a rock that fell out of the sky is worth. Dear: it is the only
 * way to any shape but the one a Deoxys arrives in
 */
export const METEORITE_PRICE = 12_000;

export default function registerFormItems(): void {
  registerItem(Items.Meteorite, {
    name: 'Meteorite',
    description: 'Its holder takes one of its own shapes at random as a fight begins.',
    type: ItemTypes.Held,
    // The rock is drawn on the key sheet, which is where the
    // collection packed it
    icon: 'key/meteorite',
    flags: ItemFlags.Holdable,
    buy: 0,
    sell: METEORITE_PRICE / 2,
  });
}
