import type { Items } from '../data/ids/items';
import readHeldBag from './live-bag';
import { ITEM_STACKS, getStack, listStacks } from './stacks';

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
 * The player's whole bag, from the copy the browser keeps
 */
async function readBag(uid: string): Promise<unknown> {
  const items: Record<number, number> = {};

  for (const [item, count] of (await readHeldBag(uid)).items) {
    items[item] = count;
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
 * How many of one item the user carries
 */
export async function getItemCount(uid: string, item: Items): Promise<number> {
  return getStack(await readBag(uid), ITEM_STACKS, item);
}

/**
 * The bag is read here and written only by the server: items are
 * value, so `grantItem` and `consumeItem` live in
 * [`src/server/inventory.ts`](../server/inventory.ts) behind a
 * verified caller, and the policies leave the rows read-only to
 * clients
 */
