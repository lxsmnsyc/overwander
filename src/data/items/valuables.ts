import { ItemTypes, Items } from '../ids/items';
import { registerItem } from './__create';

/**
 * Valuables: dug out of the overworld and worth only what they
 * fetch. None of them are marketable — a nugget is found, never
 * bought — so their buy price stays zero and the market never lists
 * them.
 */
export default function registerValuables(): void {
  registerItem(Items.Pearl, {
    name: 'Pearl',
    type: ItemTypes.Valuable,
    flags: 0,
    buy: 0,
    sell: 1400,
  });
  registerItem(Items.Stardust, {
    name: 'Stardust',
    type: ItemTypes.Valuable,
    flags: 0,
    buy: 0,
    sell: 2000,
  });
  registerItem(Items.BigPearl, {
    name: 'Big Pearl',
    type: ItemTypes.Valuable,
    flags: 0,
    buy: 0,
    sell: 7500,
  });
  registerItem(Items.StarPiece, {
    name: 'Star Piece',
    type: ItemTypes.Valuable,
    flags: 0,
    buy: 0,
    sell: 9800,
  });
  // The prize of the pile, and the rarest thing the overworld hides
  registerItem(Items.Nugget, {
    name: 'Nugget',
    type: ItemTypes.Valuable,
    flags: 0,
    buy: 0,
    sell: 10000,
  });
}
