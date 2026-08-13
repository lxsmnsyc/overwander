import { ItemFlags, ItemTypes, Items } from '../ids/items';
import { registerItem } from './__create';

/**
 * The two items a buddy carries for candy. Neither does anything in a
 * battle and neither is ever spent: they are worth carrying for what
 * happens every time their owner catches something.
 *
 * They pull in opposite directions, which is the point of having
 * both. An Exp. Share pays the **buddy's** family, so it is what a
 * player carries while raising one particular pokemon. A Lucky Egg
 * pays the family of whatever was just caught, so it is what a player
 * carries while filling out a dex. A catch holds one item at a time,
 * so the two are a choice rather than a stack.
 *
 * The field side of them is in
 * [`src/overworld/items/candy-items.ts`](../../overworld/items/candy-items.ts).
 */

export const CANDY_ITEM_PRICE = 6000;

const CANDY_ITEM_RESALE = 0.5;

export default function registerCandyItems(): void {
  registerItem(Items.ExpShare, {
    name: 'Exp. Share',
    type: ItemTypes.Held,
    icon: 'key/exp-share',
    flags: ItemFlags.Holdable | ItemFlags.Marketable,
    buy: CANDY_ITEM_PRICE,
    sell: CANDY_ITEM_PRICE * CANDY_ITEM_RESALE,
  });

  registerItem(Items.LuckyEgg, {
    name: 'Lucky Egg',
    type: ItemTypes.Held,
    icon: 'held/lucky-egg',
    flags: ItemFlags.Holdable | ItemFlags.Marketable,
    buy: CANDY_ITEM_PRICE,
    sell: CANDY_ITEM_PRICE * CANDY_ITEM_RESALE,
  });
}
