import { TYPE_NAMES, Types } from '../constants/types';
import { ItemFlags, ItemTypes, Items } from '../ids/items';
import { nameToIcon, registerItem } from './__create';

/**
 * Type-enhancing held items: one per attacking type, each worth a
 * fifth more power to the moves of its own type and nothing to
 * anything else. They are held rather than used, and never consumed —
 * a Charcoal burns for as long as its holder carries it.
 *
 * The battle side of them lives in
 * [`src/battle/items/type-boosters.ts`](../../battle/items/type-boosters.ts);
 * this is only what they are and what they cost.
 */
export const TYPE_BOOSTERS = new Map<Items, Types>([
  [Items.SilkScarf, Types.Normal],
  [Items.BlackBelt, Types.Fighting],
  [Items.SharpBeak, Types.Flying],
  [Items.PoisonBarb, Types.Poison],
  [Items.SoftSand, Types.Ground],
  [Items.HardStone, Types.Rock],
  [Items.SilverPowder, Types.Bug],
  [Items.SpellTag, Types.Ghost],
  [Items.MetalCoat, Types.Steel],
  [Items.Charcoal, Types.Fire],
  [Items.MysticWater, Types.Water],
  [Items.MiracleSeed, Types.Grass],
  [Items.Magnet, Types.Electric],
  [Items.TwistedSpoon, Types.Psychic],
  [Items.NeverMeltIce, Types.Ice],
  [Items.DragonFang, Types.Dragon],
  [Items.BlackGlasses, Types.Dark],
  [Items.FairyFeather, Types.Fairy],
]);

const NAMES: { [key in Items]?: string } = {
  [Items.SilkScarf]: 'Silk Scarf',
  [Items.BlackBelt]: 'Black Belt',
  [Items.SharpBeak]: 'Sharp Beak',
  [Items.PoisonBarb]: 'Poison Barb',
  [Items.SoftSand]: 'Soft Sand',
  [Items.HardStone]: 'Hard Stone',
  [Items.SilverPowder]: 'Silver Powder',
  [Items.SpellTag]: 'Spell Tag',
  [Items.MetalCoat]: 'Metal Coat',
  [Items.Charcoal]: 'Charcoal',
  [Items.MysticWater]: 'Mystic Water',
  [Items.MiracleSeed]: 'Miracle Seed',
  [Items.Magnet]: 'Magnet',
  [Items.TwistedSpoon]: 'Twisted Spoon',
  [Items.NeverMeltIce]: 'Never-Melt Ice',
  [Items.DragonFang]: 'Dragon Fang',
  [Items.BlackGlasses]: 'Black Glasses',
  [Items.FairyFeather]: 'Fairy Feather',
};

/**
 * The one whose name points at nothing. Every other booster is on the
 * `held` sheet under its own name; no fairy feather is drawn anywhere,
 * so it borrows the Silver Wing — a plain pale feather, and one no
 * other item is using. The Pretty Wing it used to borrow belongs to
 * the Pretty Wing, and two items drawn the same picture are one item
 * as far as a tray of pictures is concerned
 */
const ICONS: { [key in Items]?: string } = {
  [Items.FairyFeather]: 'key/silver-wing',
};

/**
 * They all do the same job, so they all cost the same: a flat price
 * rather than one type being dearer than another
 */
export const TYPE_BOOSTER_PRICE = 4000;

const TYPE_BOOSTER_RESALE = 0.5;

/**
 * Register the type-enhancing items. Every attacking type has one, so
 * the list is the map above rather than eighteen near-identical
 * blocks
 */
export default function registerTypeBoosters(): void {
  for (const [item, type] of TYPE_BOOSTERS) {
    registerItem(item, {
      name: NAMES[item] ?? `Item #${item}`,
      type: ItemTypes.Held,
      description: `${TYPE_NAMES[type]} moves hit 1.2x for as long as it is held.`,
      icon: ICONS[item] ?? nameToIcon('held', NAMES[item] ?? ''),
      // Held for as long as its holder keeps it: nothing consumes a
      // Charcoal, and nothing uses one on a pokemon either
      flags: ItemFlags.Holdable | ItemFlags.Marketable,
      buy: TYPE_BOOSTER_PRICE,
      sell: TYPE_BOOSTER_PRICE * TYPE_BOOSTER_RESALE,
    });
  }
}
