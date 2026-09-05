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

/**
 * The colour an apricorn's cell is called out in. An apricorn is named
 * for its colour, so the seven are written here rather than sampled:
 * the name is the fact, and the icon only illustrates it. Black and
 * white are pulled off their extremes so that both read as a ring on
 * ground that is sometimes grass and sometimes snow
 */
export const APRICORN_COLORS: Record<string, string> = {
  black: '#2f2f33',
  blue: '#2e6bcc',
  green: '#3f9e4d',
  pink: '#ed7fa2',
  red: '#de372b',
  white: '#e8e6df',
  yellow: '#d9ac24',
};

/** What colour one apricorn is, or null for a colour nobody has named */
export function apricornHex(item: Items): string | null {
  return APRICORN_COLORS[apricornColour(item)] ?? null;
}
