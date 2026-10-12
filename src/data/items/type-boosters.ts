import { TYPE_NAMES, Types } from '../constants/types';
import { Items } from '../ids/items';
import { itemText } from './__create';

/**
 * Type-enhancing held items: one per attacking type, each worth a
 * fifth more power to the moves of its own type and nothing to
 * anything else. They are held rather than used, and never consumed —
 * a Charcoal burns for as long as its holder carries it.
 *
 * The battle side of them lives in
 * [`src/battle/items/type-boosters.ts`](../../battle/items/type-boosters.ts);
 * this is only which type each one lifts.
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

export function describeTypeBooster(item: Items): string {
  const type = TYPE_BOOSTERS.get(item);

  if (type == null) {
    throw new Error(`No type booster line for item #${item}`);
  }
  return itemText('type-boosters', 'type', { type: TYPE_NAMES[type] });
}
