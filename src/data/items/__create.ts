import type { ItemTypes, Items } from '../ids/items';

export interface ItemData {
  name: string;

  type: ItemTypes;

  /**
   * ItemFlags bitfield
   */
  flags: number;
}

const ITEM_DATA = new Map<Items, ItemData>();

export function registerItem(item: Items, data: ItemData): void {
  ITEM_DATA.set(item, data);
}

export function getItemData(item: Items): ItemData {
  const result = ITEM_DATA.get(item);
  if (result) {
    return result;
  }
  throw new Error('Missing item data for ' + item);
}
