import type { Items } from '../../data/ids/items';
import type { ToastState } from '../styled';
import { describeItem } from '../details';
import ItemSprite from './ItemSprite';

/**
 * Items handed over, said in the corner: **one line per kind**, with
 * the item drawn beside its name.
 *
 * Every payout in the game reads the same way because of this. A
 * landmark's stash already did, and a quest, a gift and a buddy's find
 * used to be a sentence listing what had been received with no picture
 * of any of it, which is the one thing a player wants to see.
 */

/** How large the item is drawn beside the line */
const ICON_SIZE = 24;

/** What a payout looks like, whoever is paying */
export interface SaidStack {
  item: Items;
  amount: number;
}

/**
 * `title` is who paid, since a line on its own says what was received
 * and not where from. A landmark needs none: the player pressed it
 */
export default function sayItems(toast: ToastState, items: SaidStack[], title?: string): void {
  for (const stack of items) {
    toast.push({
      title,
      message: `${describeItem(stack.item)} ×${stack.amount}`,
      art: () => <ItemSprite item={stack.item} size={ICON_SIZE} label="" />,
      tone: 'leaf',
    });
  }
}
