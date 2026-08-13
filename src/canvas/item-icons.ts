import type BasicSprite from './basic-sprite';
import loadBasicSprite, { UI_SPRITE_ROOT } from './basic-sprites';
import { getItemData } from '../data/items';
import type { Items } from '../data/ids/items';

/**
 * The pictures of the things a player carries.
 *
 * Every item names the sprite it prefers — see `ItemData.icon` — as a
 * sheet and a picture on it, written as `sheet/name`. That is the
 * whole of the mapping: it lives beside the price and the flags, in
 * the file that says what the item *is*, rather than in a table
 * somewhere else that would rot the first time an item was added.
 *
 * The sheets are shared and loaded once. A bag of thirty stacks is a
 * handful of sheets rather than thirty images, and a sheet already
 * fetched for one row is drawn from immediately for the next.
 */

export const ITEM_ICON_ROOT = `${UI_SPRITE_ROOT}/items`;

/**
 * One item sheet, loaded once however many callers want it
 */
export async function loadIconSheet(sheet: string): Promise<BasicSprite | null> {
  return loadBasicSprite(`${ITEM_ICON_ROOT}/${sheet}`);
}

export interface ItemIcon {
  sprite: BasicSprite;
  /**
   * Which picture on it. The sheet is shared, so the name has to
   * travel with it
   */
  name: string;
}

/**
 * The icon for one item, ready to draw.
 *
 * Resolves null when the item names no sprite, when the sheet it
 * names will not load, or when the sheet has no picture under that
 * name — a caller that has nothing to draw draws nothing, and the row
 * it was for still says what the item is in words
 */
export default async function loadItemIcon(item: Items): Promise<ItemIcon | null> {
  const icon = getItemData(item).icon;
  const cut = icon.lastIndexOf('/');

  if (cut <= 0) {
    return null;
  }

  const sprite = await loadIconSheet(icon.slice(0, cut));
  const name = icon.slice(cut + 1);

  return sprite?.has(name) === true ? { sprite, name } : null;
}
