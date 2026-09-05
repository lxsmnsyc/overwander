import type { Items } from '../ids/items';
import { getItemData } from '../items';

/**
 * Where an apricorn tree is drawn from.
 *
 * A tree carries one colour of apricorn and is drawn bearing it, so
 * there are seven of them, filed under the colour the item's icon is
 * filed under. Derived from the item rather than tabled, the way a
 * berry's plant is, so an apricorn that is renamed cannot quietly keep
 * pointing at the old drawing.
 *
 * The drawings are the Nanab berry plant with its canopy painted green
 * and its fruit painted the apricorn's colour: nobody drew an apricorn
 * tree, and that plant is shaped like one. See
 * [`scripts/apricorn-trees.ts`](../../../scripts/apricorn-trees.ts).
 */

/** The colour half of an apricorn's name, which is how it is filed. */
export function apricornColour(item: Items): string {
  return getItemData(item)
    .name.replace(/ apricorn$/i, '')
    .toLowerCase();
}

/** The charset one apricorn's tree is loaded as. */
export default function apricornTreeSheet(item: Items): string {
  return `landmarks-apricorn/${apricornColour(item)}`;
}
