import type { Items } from '../data/ids/items';
import { asNumber, asRecordArray } from './__normalize';
import { ITEM_STACKS, listStacks } from './stacks';
import getSupabase from './supabase';

/**
 * The bag as a list of stacks, which is how every picker in the game
 * wants it. Stored as a row per kind in `bag_items`, read whole and
 * collapsed by [`stacks.ts`](./stacks.ts). Gold is not here: the
 * balance lives on the profile
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
   * How many are carried; a stack spent to its last is deleted rather
   * than kept at zero
   */
  amount: number;
}

/**
 * What a player is told when the bag cannot be read. The store's own
 * message says nothing a player can act on and describes the schema,
 * so it stays here
 */
export const BAG_UNREADABLE = 'Could not read your bag just now.';

/**
 * The player's whole bag, in one read. A refused read is raised rather
 * than answered as an empty bag, which would tell the player they
 * carry nothing
 */
async function readBag(uid: string): Promise<unknown> {
  const { data, error } = await getSupabase()
    .from('bag_items')
    .select('item, count')
    .eq('player', uid);

  if (error != null) {
    throw new Error(BAG_UNREADABLE);
  }

  const items: Record<number, number> = {};

  for (const row of asRecordArray(data)) {
    items[asNumber(row.item)] = asNumber(row.count);
  }
  return { items };
}

/**
 * Every stack the user carries
 */
export async function getInventory(uid: string): Promise<InventoryEntry[]> {
  const entries: InventoryEntry[] = [];

  for (const [item, amount] of listStacks(await readBag(uid), ITEM_STACKS)) {
    entries.push({
      user: uid,
      // oxlint-disable-next-line typescript/no-unnecessary-type-assertion
      item: item as Items,
      amount,
    });
  }
  return entries;
}

/**
 * How many of one item the user carries. One row asked for, not the
 * whole bag: a missing row is a stack spent to its last
 */
export async function getItemCount(uid: string, item: Items): Promise<number> {
  const { data, error } = await getSupabase()
    .from('bag_items')
    .select('count')
    .eq('player', uid)
    .eq('item', item)
    .maybeSingle();

  if (error != null) {
    throw new Error(BAG_UNREADABLE);
  }

  return asNumber((data as { count?: unknown } | null)?.count);
}

/**
 * The bag is read here and written only by the server: items are
 * value, so `grantItem` and `consumeItem` live in
 * [`src/server/inventory.ts`](../server/inventory.ts) behind a
 * verified caller, and the policies leave the rows read-only to
 * clients
 */
