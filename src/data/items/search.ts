import { ITEM_TYPE_NAMES } from './names';
import { getItemData } from './__create';
import { ItemFlags, type Items, getMachineMove, isMachineItem } from '../ids/items';
import parseQuery, { holds, within } from '../../core/query';
import { getMoveData } from '../moves';

/**
 * What a search box over a bag can be asked.
 *
 * The grammar is the one a box of pokemon takes — a plain word, then
 * `field:value` pairs that narrow, `is:` for the yes-or-no facts —
 * because it is the same box to a player: they type what they
 * remember and the shelf answers.
 *
 * There is **no query half** here, and there is nothing to plan. A bag
 * is one document holding one map, so it is read whole however much
 * is in it — see [`inventory.ts`](../../auth/inventory.ts) — and
 * everything below is answered over what that read returned.
 */

/** How much of it is carried, where the caller knows */
export interface ItemHolding {
  amount?: number;
}

/** One yes-or-no fact about an item, by the word a search calls it */
const MARKS = new Map<string, (item: Items) => boolean>(
  Object.entries<(item: Items) => boolean>({
    consumable: (item) => (getItemData(item).flags & ItemFlags.Consumable) !== 0,
    holdable: (item) => (getItemData(item).flags & ItemFlags.Holdable) !== 0,
    usable: (item) => (getItemData(item).flags & ItemFlags.Usable) !== 0,
    // What the market stocks, which is not the same as what sells for
    // something: a nugget is carried to be sold and never bought
    marketable: (item) => (getItemData(item).flags & ItemFlags.Marketable) !== 0,
    machine: isMachineItem,
  }),
);

function marked(item: Items, word: string, wanted: boolean): boolean {
  const mark = MARKS.get(word.trim().toLowerCase());

  return mark?.(item) === wanted;
}

/** What one field asks of one item */
type ItemField = (item: Items, value: string, holding: ItemHolding) => boolean;

const FIELDS = new Map<string, ItemField>(
  Object.entries<ItemField>({
    type: (item, value) => holds(ITEM_TYPE_NAMES[getItemData(item).type], value),
    // The line under the name, so "paralysis" finds what cures it
    // without anybody having to remember which item that is
    about: (item, value) => holds(getItemData(item).description, value),
    // A machine is named after the thing it teaches, which is what a
    // player is actually looking for
    move: (item, value) => {
      const move = getMachineMove(item);

      return move != null && holds(getMoveData(move).name, value);
    },
    is: (item, value) => marked(item, value, true),
    not: (item, value) => marked(item, value, false),
    buy: (item, value) => within(value, getItemData(item).buy),
    sell: (item, value) => within(value, getItemData(item).sell),
    // How many are in the bag. A shelf that does not carry counts — a
    // gift, a lot on the block — cannot answer it, and a term that
    // cannot be answered matches nothing
    amount: (_item, value, holding) => holding.amount != null && within(value, holding.amount),
  }),
);

/**
 * Whether one item answers the whole search. A field nobody has heard
 * of matches nothing, the same as in a box of pokemon: a search that
 * quietly dropped the half typed most carefully is worse than one
 * that comes back empty
 */
export default function matchesItem(
  item: Items,
  query: string,
  holding: ItemHolding = {},
): boolean {
  return parseQuery(query).every((term) => {
    if (term.field === '') {
      return holds(getItemData(item).name, term.value);
    }

    const field = FIELDS.get(term.field);

    return field?.(item, term.value, holding) === true;
  });
}
