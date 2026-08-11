import type { ItemTypes, Items } from '../ids/items';

export interface ItemData {
  name: string;

  type: ItemTypes;

  /**
   * ItemFlags bitfield
   */
  flags: number;

  /**
   * What the market charges for one, in gold. Zero for anything the
   * market does not stock — everything without the Marketable flag,
   * and the odd listed item that is only ever given away
   */
  buy: number;

  /**
   * What one fetches when sold, in gold. A found item is worth this
   * and nothing else: nuggets and pearls are carried for it
   */
  sell: number;
}

const ITEM_DATA = new Map<Items, ItemData>();

export function registerItem(item: Items, data: ItemData): void {
  ITEM_DATA.set(item, data);
}

/**
 * Every registered item of one kind. It is a scan of the registry
 * rather than a list kept beside it, so a shelf cannot fall out of
 * step with what is actually on it
 */
export function listItemsByType(type: ItemTypes): Items[] {
  const found: Items[] = [];

  for (const [item, data] of ITEM_DATA) {
    if (data.type === type) {
      found.push(item);
    }
  }
  return found;
}

export function getItemData(item: Items): ItemData {
  const result = ITEM_DATA.get(item);
  if (result) {
    return result;
  }
  throw new Error('Missing item data for ' + item);
}
