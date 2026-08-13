import { ItemFlags, ItemTypes, Items } from '../ids/items';
import { registerItem } from './__create';

/**
 * Evolution stones: used on a pokemon to trigger a UsedItem
 * evolution.
 */
export default function registerEvolutionStones(): void {
  registerItem(Items.FireStone, {
    name: 'Fire Stone',
    type: ItemTypes.Evolution,
    icon: 'evolutions/fire-stone',
    flags: ItemFlags.Usable | ItemFlags.Marketable,
    buy: 3000,
    sell: 1500,
  });
  registerItem(Items.WaterStone, {
    name: 'Water Stone',
    type: ItemTypes.Evolution,
    icon: 'evolutions/water-stone',
    flags: ItemFlags.Usable | ItemFlags.Marketable,
    buy: 3000,
    sell: 1500,
  });
  registerItem(Items.ThunderStone, {
    name: 'Thunder Stone',
    type: ItemTypes.Evolution,
    icon: 'evolutions/thunder-stone',
    flags: ItemFlags.Usable | ItemFlags.Marketable,
    buy: 3000,
    sell: 1500,
  });
  registerItem(Items.LeafStone, {
    name: 'Leaf Stone',
    type: ItemTypes.Evolution,
    icon: 'evolutions/leaf-stone',
    flags: ItemFlags.Usable | ItemFlags.Marketable,
    buy: 3000,
    sell: 1500,
  });
  registerItem(Items.MoonStone, {
    name: 'Moon Stone',
    type: ItemTypes.Evolution,
    icon: 'evolutions/moon-stone',
    flags: ItemFlags.Usable | ItemFlags.Marketable,
    buy: 3000,
    sell: 1500,
  });
}
