import { TYPE_NAMES, Types } from '../constants/types';
import { ItemFlags, ItemTypes, Items } from '../ids/items';
import { registerItem } from './__create';

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

const NAMES: { [key in Items]?: string } = {
  [Items.NormalGem]: 'Normal Gem',
  [Items.FightingGem]: 'Fighting Gem',
  [Items.FlyingGem]: 'Flying Gem',
  [Items.PoisonGem]: 'Poison Gem',
  [Items.GroundGem]: 'Ground Gem',
  [Items.RockGem]: 'Rock Gem',
  [Items.BugGem]: 'Bug Gem',
  [Items.GhostGem]: 'Ghost Gem',
  [Items.SteelGem]: 'Steel Gem',
  [Items.FireGem]: 'Fire Gem',
  [Items.WaterGem]: 'Water Gem',
  [Items.GrassGem]: 'Grass Gem',
  [Items.ElectricGem]: 'Electric Gem',
  [Items.PsychicGem]: 'Psychic Gem',
  [Items.IceGem]: 'Ice Gem',
  [Items.DragonGem]: 'Dragon Gem',
  [Items.DarkGem]: 'Dark Gem',
  [Items.FairyGem]: 'Fairy Gem',
};

/**
 * A gem costs a fraction of the booster it out-hits, because it only
 * has the one hit in it
 */
export const GEM_PRICE = 1500;

const GEM_RESALE = 0.5;

/**
 * Register the gems. Unlike every other type item they are
 * consumable: landing the move is what spends one
 */
export default function registerGems(): void {
  for (const [item, type] of GEMS) {
    registerItem(item, {
      name: NAMES[item] ?? `Item #${item}`,
      type: ItemTypes.Held,
      // The `gems` sheet holds one per type, named after the type, so
      // the gem's own picture is the type it belongs to
      icon: `gems/${TYPE_NAMES[type].toLowerCase()}`,
      flags: ItemFlags.Holdable | ItemFlags.Consumable | ItemFlags.Marketable,
      buy: GEM_PRICE,
      sell: GEM_PRICE * GEM_RESALE,
    });
  }
}
