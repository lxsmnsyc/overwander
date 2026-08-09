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
    flags: ItemFlags.Usable,
  });
  registerItem(Items.WaterStone, {
    name: 'Water Stone',
    type: ItemTypes.Evolution,
    flags: ItemFlags.Usable,
  });
  registerItem(Items.ThunderStone, {
    name: 'Thunder Stone',
    type: ItemTypes.Evolution,
    flags: ItemFlags.Usable,
  });
  registerItem(Items.LeafStone, {
    name: 'Leaf Stone',
    type: ItemTypes.Evolution,
    flags: ItemFlags.Usable,
  });
  registerItem(Items.MoonStone, {
    name: 'Moon Stone',
    type: ItemTypes.Evolution,
    flags: ItemFlags.Usable,
  });
}
