import { ItemTypes } from '../ids/items';
import { ITEM_TYPE_IDS } from '../ids/names';
import itemTypeNamesFile from '../text/en/item-types.yaml';
import { stringTable } from '../yaml';

/**
 * What each kind of item is called. The enum carries ids alone, and a
 * bag that can be narrowed down to one kind needs a word for each
 */
export const ITEM_TYPE_NAMES = stringTable<ItemTypes>(
  ITEM_TYPE_IDS,
  itemTypeNamesFile,
  'text/en/item-types.yaml',
);

/**
 * The order the bag is read in: what is thrown and what mends first,
 * since those are what a player reaches for mid-window, then what is
 * carried or taught, and last what is only kept
 */
export const ITEM_TYPE_ORDER: ItemTypes[] = [
  ItemTypes.PokeBall,
  ItemTypes.Medicine,
  ItemTypes.Berry,
  ItemTypes.Held,
  ItemTypes.Evolution,
  ItemTypes.Training,
  ItemTypes.Machine,
  ItemTypes.KeyItem,
  // Carried rather than used, both of them: a fossil until somebody
  // with a bench is found, a nugget until somebody with a purse is
  ItemTypes.Fossil,
  ItemTypes.Valuable,
];
