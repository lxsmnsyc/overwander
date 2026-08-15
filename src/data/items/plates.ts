import { TYPE_NAMES, Types } from '../constants/types';
import { ItemFlags, ItemTypes, Items } from '../ids/items';
import { registerItem } from './__create';

/**
 * The plates: old stone tablets, one for every type but Normal, each
 * lifting the moves of its own type by a fifth.
 *
 * They do exactly what a type booster does — a Flame Plate and a
 * Charcoal are worth the same to a Fire move — and differ in where
 * they come from. A booster is stocked and expensive; a plate is
 * buried, found in the ground or not at all, and no shop will sell
 * one back to a player who parts with it.
 *
 * The battle side rides the type-booster listener in
 * [`src/battle/items/type-boosters.ts`](../../battle/items/type-boosters.ts),
 * so there is one place that decides what lifting a type means.
 */
export const PLATES = new Map<Items, Types>([
  [Items.FistPlate, Types.Fighting],
  [Items.SkyPlate, Types.Flying],
  [Items.ToxicPlate, Types.Poison],
  [Items.EarthPlate, Types.Ground],
  [Items.StonePlate, Types.Rock],
  [Items.InsectPlate, Types.Bug],
  [Items.SpookyPlate, Types.Ghost],
  [Items.IronPlate, Types.Steel],
  [Items.FlamePlate, Types.Fire],
  [Items.SplashPlate, Types.Water],
  [Items.MeadowPlate, Types.Grass],
  [Items.ZapPlate, Types.Electric],
  [Items.MindPlate, Types.Psychic],
  [Items.IciclePlate, Types.Ice],
  [Items.DracoPlate, Types.Dragon],
  [Items.DreadPlate, Types.Dark],
  [Items.PixiePlate, Types.Fairy],
]);

const NAMES: { [key in Items]?: string } = {
  [Items.FistPlate]: 'Fist Plate',
  [Items.SkyPlate]: 'Sky Plate',
  [Items.ToxicPlate]: 'Toxic Plate',
  [Items.EarthPlate]: 'Earth Plate',
  [Items.StonePlate]: 'Stone Plate',
  [Items.InsectPlate]: 'Insect Plate',
  [Items.SpookyPlate]: 'Spooky Plate',
  [Items.IronPlate]: 'Iron Plate',
  [Items.FlamePlate]: 'Flame Plate',
  [Items.SplashPlate]: 'Splash Plate',
  [Items.MeadowPlate]: 'Meadow Plate',
  [Items.ZapPlate]: 'Zap Plate',
  [Items.MindPlate]: 'Mind Plate',
  [Items.IciclePlate]: 'Icicle Plate',
  [Items.DracoPlate]: 'Draco Plate',
  [Items.DreadPlate]: 'Dread Plate',
  [Items.PixiePlate]: 'Pixie Plate',
};

/**
 * What a plate fetches from a shop that will never stock one
 */
export const PLATE_RESALE = 2000;

/**
 * Register the plates. Held, never spent, and never listed: a plate
 * is dug up rather than bought
 */
export default function registerPlates(): void {
  for (const [item, type] of PLATES) {
    registerItem(item, {
      name: NAMES[item] ?? `Item #${item}`,
      type: ItemTypes.Held,
      description: `${TYPE_NAMES[type]} moves hit 1.2x for as long as it is held.`,
      // A plate is not named for its type — a Fist Plate is Fighting
      // — so the picture is taken from the plate's own first word,
      // which is what the `plates` sheet names them by
      icon: `plates/${(NAMES[item] ?? '').split(' ')[0].toLowerCase()}`,
      flags: ItemFlags.Holdable,
      buy: 0,
      sell: PLATE_RESALE,
    });
  }
}
