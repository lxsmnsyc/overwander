import { MAX_LEVEL } from '../constants/levels';
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
    description:
      'Raises any pokemon 1 level, whatever candy its family takes. The level restores full HP, clears status and revives a fainted pokemon.',
    type: ItemTypes.Medicine,
    icon: 'medicine/rare-candy',
    flags: ItemFlags.Consumable | ItemFlags.Usable,
    buy: 0,
    sell: 0,
  });
  // Found as a special, never bought: every level-up move on the way stays on offer
  registerItem(Items.RareCandyMax, {
    name: 'Rare Candy Max',
    description: `Raises any pokemon to level ${MAX_LEVEL}, offering every move it learns on the way. The levels restore full HP, clear status and revive a fainted pokemon.`,
    type: ItemTypes.Medicine,
    icon: 'medicine/rare-candy-max',
    flags: ItemFlags.Consumable | ItemFlags.Usable,
    buy: 0,
    sell: 0,
  });
}
