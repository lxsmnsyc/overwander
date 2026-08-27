import type { Items } from '../ids/items';
import { getItemData } from '../items';
import { berryFruit } from '../items/berries';

/**
 * Where a berry's plant is drawn from.
 *
 * A berry patch shows the berry growing in it, and the plants are
 * filed under the berry's own name rather than its number, which is
 * how the icons are filed too. Derived from the item rather than
 * tabled, so a berry that is renamed cannot quietly keep pointing at
 * the old drawing.
 */

/** The folder one berry's plant lives in, under the berry root. */
export function berryPlantName(item: Items): string {
  return berryFruit(getItemData(item).name);
}

/** The charset a berry's plant is loaded as. */
export default function berryPlantSheet(item: Items): string {
  return `landmarks-berry/${berryPlantName(item)}`;
}
