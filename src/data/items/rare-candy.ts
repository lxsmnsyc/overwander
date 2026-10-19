import { MAX_LEVEL } from '../constants/levels';
import { Items } from '../ids/items';
import { itemText } from './__create';

/**
 * The Rare Candy: one level for any pokemon, whatever its family.
 *
 * Family candy is earned by catching and spends only inside its own
 * family; a rare one is the universal exception, handed out rather
 * than bought — a prize, never stock — so levels stay paced by
 * playing and not by a purse.
 */

export function describeRareCandy(item: Items): string {
  if (item !== Items.RareCandyMax) {
    throw new Error(`No rare candy description for item ${item}`);
  }
  return itemText('rare-candy', 'max', { level: MAX_LEVEL });
}
