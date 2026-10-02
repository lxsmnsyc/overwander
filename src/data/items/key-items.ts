import { CAVE_LAMP_CELLS } from '../overworld/cave';
import { Items } from '../ids/items';
import { itemText } from './__create';

/**
 * Key items: one-of-a-kind belongings whose effect is passive. They
 * are holdable but never consumed — a key item spent would be gone
 * for good.
 */

export function describeKeyItem(item: Items): string {
  if (item !== Items.ExplorerKit) {
    throw new Error(`No key item description for item ${item}`);
  }
  return itemText('key-items', 'kit', { cells: CAVE_LAMP_CELLS });
}
