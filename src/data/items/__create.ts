import type { ItemTypes, Items } from '../ids/items';

export interface ItemData {
  name: string;

  type: ItemTypes;

  /**
   * What it does, in one line, said the way this engine actually does
   * it rather than the way the mainline describes it — a Zoom Lens
   * answers a committed target here, not one that moved second.
   *
   * Required, so an item cannot be added without somebody saying what
   * it is for, and short enough to sit under the name in a list
   */
  description: string;

  /**
   * Which picture the game draws for it, as `sheet/name`.
   *
   * The sheets live under `public/sprites/ui/items/{sheet}` — a
   * `data.json` naming where each picture sits and an `image.png`
   * holding them — so `balls/poke` is the `poke` picture on the
   * `balls` sheet. It is written here, beside the price and the
   * flags, rather than in a table of its own: an item added without a
   * picture would otherwise be an item that quietly draws nothing,
   * and the field being required is what makes that impossible.
   *
   * A few items name a picture drawn for something else, because the
   * sheets do not have one of their own for them. Those say so where
   * they are registered
   */
  icon: string;

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

/**
 * The picture an item's own name points at.
 *
 * The sheets are cut from the same source the names come from, so a
 * "Never-Melt Ice" is `never-melt-ice` and an "Exp. Share" is
 * `exp-share`: lower case, and every run of anything that is not a
 * letter or a digit becomes one dash. Families whose sheet names them
 * after something else — a Fist Plate is on the `plates` sheet rather
 * than a `fighting` one — write their own instead of calling this
 */
export function nameToIcon(sheet: string, name: string): string {
  return `${sheet}/${name
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/g, '-')
    .replaceAll(/^-|-$/g, '')}`;
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
