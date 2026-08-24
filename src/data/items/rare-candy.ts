import { ItemFlags, ItemTypes, Items } from '../ids/items';
import { registerItem } from './__create';

/**
 * The Rare Candy: one level for any pokemon, whatever its family.
 *
 * Family candy is earned by catching and spends only inside its own
 * family; a rare one is the universal exception, handed out rather
 * than bought — a prize, never stock — so levels stay paced by
 * playing and not by a purse.
 */

export default function registerRareCandy(): void {
  registerItem(Items.RareCandy, {
    name: 'Rare Candy',
    description: 'Raises any pokemon one level, whatever candy its family takes.',
    type: ItemTypes.Medicine,
    icon: 'medicine/rare-candy',
    flags: ItemFlags.Consumable | ItemFlags.Usable,
    buy: 0,
    sell: 0,
  });
}
