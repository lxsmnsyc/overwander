import { TYPE_NAMES, Types } from '../constants/types';
import { Items } from '../ids/items';
import { itemText } from './__create';

/**
 * The gems: one per attacking type, and each is spent the moment its
 * holder lands a move of that type.
 *
 * They are the one-shot answer to a type booster. A Charcoal burns
 * for every Fire move its holder ever throws and lifts each by a
 * fifth; a Fire Gem lifts one by half and is gone. Carrying one is a
 * bet on a single hit mattering more than every later one.
 *
 * The battle side lives in
 * [`src/battle/items/gems.ts`](../../battle/items/gems.ts).
 */
export const GEMS = new Map<Items, Types>([
  [Items.NormalGem, Types.Normal],
  [Items.FightingGem, Types.Fighting],
  [Items.FlyingGem, Types.Flying],
  [Items.PoisonGem, Types.Poison],
  [Items.GroundGem, Types.Ground],
  [Items.RockGem, Types.Rock],
  [Items.BugGem, Types.Bug],
  [Items.GhostGem, Types.Ghost],
  [Items.SteelGem, Types.Steel],
  [Items.FireGem, Types.Fire],
  [Items.WaterGem, Types.Water],
  [Items.GrassGem, Types.Grass],
  [Items.ElectricGem, Types.Electric],
  [Items.PsychicGem, Types.Psychic],
  [Items.IceGem, Types.Ice],
  [Items.DragonGem, Types.Dragon],
  [Items.DarkGem, Types.Dark],
  [Items.FairyGem, Types.Fairy],
]);

export function describeGem(item: Items): string {
  const type = GEMS.get(item);

  if (type == null) {
    throw new Error(`No gem line for item #${item}`);
  }
  return itemText('gems', 'type', { type: TYPE_NAMES[type] });
}
