import { DEOXYS_FORMS, Species } from '../ids/species';
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
export const FORM_ITEMS = new Map<Items, Species[]>([
  [Items.Meteorite, DEOXYS_FORMS],
  // One shape each rather than a set, so the orb is a switch a player
  // sets rather than the gamble a Meteorite is
  [Items.AdamantOrb, [Species.DialgaOrigin]],
  [Items.LustrousOrb, [Species.PalkiaOrigin]],
  [Items.GriseousOrb, [Species.GiratinaOrigin]],
  [Items.Gracidea, [Species.ShayminSky]],
]);

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

/**
 * What an orb costs. Dear as the meteorite is, and for the same
 * reason: it is the only way to the shape it holds
 */
export const ORB_PRICE = 12_000;

/**
 * What the flower costs. Less than an orb, since a Gracidea is a
 * thing that grows rather than a thing the world was made with
 */
export const GRACIDEA_PRICE = 8_000;

/** The three orbs, and the one the holder has to be */
const CREATION_ORBS: [item: Items, name: string, icon: string, holder: string][] = [
  [Items.AdamantOrb, 'Adamant Orb', 'adamant-orb', 'Dialga'],
  [Items.LustrousOrb, 'Lustrous Orb', 'lustrous-orb', 'Palkia'],
  [Items.GriseousOrb, 'Griseous Orb', 'griseous-orb', 'Giratina'],
];

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

  for (const [item, name, icon, holder] of CREATION_ORBS) {
    registerItem(item, {
      name,
      description: `A ${holder} holding it fights in its other shape.`,
      type: ItemTypes.Held,
      // The three are drawn on the held sheet, which is where the
      // collection packed them
      icon: `held/${icon}`,
      flags: ItemFlags.Holdable,
      buy: 0,
      sell: ORB_PRICE / 2,
    });
  }

  registerItem(Items.Gracidea, {
    name: 'Gracidea',
    description: 'A Shaymin holding it fights in its other shape.',
    type: ItemTypes.Held,
    // Drawn on the key sheet, which is where the collection packed it
    icon: 'key/gracidea',
    flags: ItemFlags.Holdable,
    buy: 0,
    sell: GRACIDEA_PRICE / 2,
  });
}
