import { ItemTypes } from '../ids/items';

/**
 * What each kind of item is called. The enum carries ids alone, and a
 * bag that can be narrowed down to one kind needs a word for each of
 * them — plural, because the filter names a shelf rather than a thing
 */
export const ITEM_TYPE_NAMES: Record<ItemTypes, string> = {
  [ItemTypes.Medicine]: 'Medicine',
  [ItemTypes.PokeBall]: 'Poke Balls',
  [ItemTypes.Berry]: 'Berries',
  [ItemTypes.Held]: 'Held items',
  [ItemTypes.Machine]: 'Machines',
  [ItemTypes.KeyItem]: 'Key items',
  [ItemTypes.Evolution]: 'Evolution',
  [ItemTypes.Valuable]: 'Valuables',
  [ItemTypes.Training]: 'Training',
  [ItemTypes.Fossil]: 'Fossils',
};

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
