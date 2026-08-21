import type { Items } from '../data/ids/items';
import { asNumber, asRecordArray } from './__normalize';
import { ITEM_STACKS, getStack, listStacks } from './stacks';
import getSupabase from './supabase';

/**
 * The bag as a list of stacks, which is how every picker in the game
 * wants it. What it is *stored* as is one map in one document — see
 * [`stacks.ts`](./stacks.ts) — so reading the whole bag is one read
 * however much is in it, and the candies come out of the same
 * document. Gold is not here: the balance lives on the profile
 */
export interface InventoryEntry {
  /**
   * The owning uid
   */
  user: string;
  /**
   * Which item the stack holds
   */
  item: Items;
  /**
   * How many are carried; a stack spent to its last is taken out of
   * the map rather than kept at zero
   */
  amount: number;
}

/**
 * The player's whole bag, in one read
 */
async function readBag(uid: string): Promise<unknown> {
  const { data } = await getSupabase().from('bag_items').select('item, count').eq('player', uid);

  return {
    items: Object.fromEntries(
      asRecordArray(data).map((row) => [asNumber(row.item), asNumber(row.count)]),
    ),
  };
}

/**
 * Every stack the user carries
 */
export async function getInventory(uid: string): Promise<InventoryEntry[]> {
  return listStacks(await readBag(uid), ITEM_STACKS).map(([item, amount]) => ({
    user: uid,
    // oxlint-disable-next-line typescript/no-unnecessary-type-assertion
    item: item as Items,
    amount,
  }));
}

/**
 * How many of one item the user carries
 */
export async function getItemCount(uid: string, item: Items): Promise<number> {
  return getStack(await readBag(uid), ITEM_STACKS, item);
}

/**
 * The bag is read here and written only by the server: items are
 * value, so `grantItem` and `consumeItem` live in
 * [`src/server/inventory.ts`](../server/inventory.ts) behind a
 * verified caller, and the rules leave the document read-only to
 * clients
 */
