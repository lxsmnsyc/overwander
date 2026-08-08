import { ItemFlags, ItemTypes, Items } from '../ids/items';
import { registerItem } from './__create';

/**
 * Battle-only berries: held berries whose effect triggers on their
 * own during battle. All of them are consumed by their trigger.
 */
export default function registerBattleBerries(): void {
  // Cures paralysis
  registerItem(Items.CheriBerry, {
    name: 'Cheri Berry',
    type: ItemTypes.Berry,
    flags: ItemFlags.Holdable | ItemFlags.Consumable,
  });
  // Cures sleep
  registerItem(Items.ChestoBerry, {
    name: 'Chesto Berry',
    type: ItemTypes.Berry,
    flags: ItemFlags.Holdable | ItemFlags.Consumable,
  });
  // Cures poison
  registerItem(Items.PechaBerry, {
    name: 'Pecha Berry',
    type: ItemTypes.Berry,
    flags: ItemFlags.Holdable | ItemFlags.Consumable,
  });
  // Cures a burn
  registerItem(Items.RawstBerry, {
    name: 'Rawst Berry',
    type: ItemTypes.Berry,
    flags: ItemFlags.Holdable | ItemFlags.Consumable,
  });
  // Thaws the holder
  registerItem(Items.AspearBerry, {
    name: 'Aspear Berry',
    type: ItemTypes.Berry,
    flags: ItemFlags.Holdable | ItemFlags.Consumable,
  });
  // Restores PP of a depleted move
  registerItem(Items.LeppaBerry, {
    name: 'Leppa Berry',
    type: ItemTypes.Berry,
    flags: ItemFlags.Holdable | ItemFlags.Consumable,
  });
  // Restores a small amount of health when low
  registerItem(Items.OranBerry, {
    name: 'Oran Berry',
    type: ItemTypes.Berry,
    flags: ItemFlags.Holdable | ItemFlags.Consumable,
  });
  // Cures confusion
  registerItem(Items.PersimBerry, {
    name: 'Persim Berry',
    type: ItemTypes.Berry,
    flags: ItemFlags.Holdable | ItemFlags.Consumable,
  });
  // Cures any status condition
  registerItem(Items.LumBerry, {
    name: 'Lum Berry',
    type: ItemTypes.Berry,
    flags: ItemFlags.Holdable | ItemFlags.Consumable,
  });
  // Restores a quarter of max health when low
  registerItem(Items.SitrusBerry, {
    name: 'Sitrus Berry',
    type: ItemTypes.Berry,
    flags: ItemFlags.Holdable | ItemFlags.Consumable,
  });
}
