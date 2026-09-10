import { Species } from '../ids/species';
import { PLATES } from './plates';
import { Types } from '../constants/types';
import { ItemFlags, ItemTypes, Items } from '../ids/items';
import { registerItem } from './__create';

/**
 * The form items: held for the shape they put their holder into.
 *
 * A form item names a set of shapes one species comes in, and while a
 * pokemon of that species is holding it, the shape it fights in is
 * one of them. A shape worn for a fight is a different thing from one
 * a pokemon is put into and keeps: Deoxys and Rotom are rearranged
 * for good through the evolution route, and everything here is put on
 * and taken off with the item.
 *
 * The battle side lives in
 * [`src/battle/items/forms.ts`](../../battle/items/forms.ts).
 */
/** Which shape each Plate paints an Arceus, by the type it lifts */
const ARCEUS_TYPE_FORMS: { [key in Types]?: Species } = {
  [Types.Bug]: Species.ArceusBug,
  [Types.Dark]: Species.ArceusDark,
  [Types.Dragon]: Species.ArceusDragon,
  [Types.Electric]: Species.ArceusElectric,
  [Types.Fairy]: Species.ArceusFairy,
  [Types.Fighting]: Species.ArceusFighting,
  [Types.Fire]: Species.ArceusFire,
  [Types.Flying]: Species.ArceusFlying,
  [Types.Ghost]: Species.ArceusGhost,
  [Types.Grass]: Species.ArceusGrass,
  [Types.Ground]: Species.ArceusGround,
  [Types.Ice]: Species.ArceusIce,
  [Types.Poison]: Species.ArceusPoison,
  [Types.Psychic]: Species.ArceusPsychic,
  [Types.Rock]: Species.ArceusRock,
  [Types.Steel]: Species.ArceusSteel,
  [Types.Water]: Species.ArceusWater,
};

/** The Plate rows, derived so a Plate added later brings its shape */
const ARCEUS_PLATES: [Items, Species[]][] = [...PLATES].flatMap(([plate, type]) => {
  const shape = ARCEUS_TYPE_FORMS[type];

  return shape == null ? [] : [[plate, [shape]] as [Items, Species[]]];
});

export const FORM_ITEMS = new Map<Items, Species[]>([
  // One shape each rather than a set, so an orb is a switch a player
  // sets rather than a roll
  [Items.AdamantOrb, [Species.DialgaOrigin]],
  [Items.LustrousOrb, [Species.PalkiaOrigin]],
  [Items.GriseousOrb, [Species.GiratinaOrigin]],
  [Items.Gracidea, [Species.ShayminSky]],
  // The seventeen Plates, each of which is already a type booster.
  // Holding one paints an Arceus the type it lifts, which is what the
  // mainline calls Multitype: there is no battle code behind it, only
  // the shape the stone puts it in
  ...ARCEUS_PLATES,
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
 * way to any shape but the one a Deoxys arrives in, and it is spent
 * on every rearrangement rather than held through them
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
    description: 'Rearranges the Deoxys it is used on into another of its shapes.',
    type: ItemTypes.Evolution,
    // The rock is drawn on the key sheet, which is where the
    // collection packed it
    icon: 'key/meteorite',
    flags: ItemFlags.Usable,
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
