import 'server-only';
import { ITEM_STACKS } from '../auth/stacks';
import type { Items } from '../data/ids/items';
import { grantStack, grantStacks, readStack, spendStack } from './stacks';
import { getSql } from './db';
import { asNumber } from './read';

/**
 * The bag, written over the owner connection. Items are value: a
 * client that could write these rows could mint Master Balls, so the
 * policies leave them read-only and every change lands here.
 *
 * What a stack *is* — how it is keyed, read and written — belongs to
 * [`src/server/stacks.ts`](./stacks.ts), which the candy pile shares.
 * These two say only which store is being spoken to, and keep the
 * names the rest of the game already calls them by.
 *
 * The uid is the one a verified token resolved to — these functions
 * are internal to the server and never take it from a request
 */

/**
 * Add items to the bag, creating the stack on first acquisition
 */
export async function grantItem(uid: string, item: Items, count = 1): Promise<void> {
  return grantStack(ITEM_STACKS, uid, item, count);
}

/**
 * Spend items; resolves false (and changes nothing) when the player
 * does not carry enough. A stack spent to its last is taken out of
 * the bag rather than kept at zero
 */
export async function consumeItem(uid: string, item: Items, count = 1): Promise<boolean> {
  return spendStack(ITEM_STACKS, uid, item, count);
}

/**
 * Whether the player carries any of it. A check rather than a spend,
 * for the places that ask to be holding something before doing
 * anything with it
 */
export async function holdsItem(uid: string, item: Items): Promise<boolean> {
  return (await readStack(ITEM_STACKS, uid, item)) > 0;
}

/**
 * Add several kinds at once, in one statement, so a stash cannot
 * half-land
 */
export async function grantItems(
  uid: string,
  granted: Iterable<[item: Items, count: number]>,
): Promise<void> {
  return grantStacks(ITEM_STACKS, uid, granted);
}

/** Every item and candy stack the player holds, as key and count pairs */
export async function readBag(
  uid: string,
): Promise<{ items: [number, number][]; candies: [number, number][] }> {
  const sql = getSql();
  const [items, candies] = await Promise.all([
    sql`select item, count from bag_items where player = ${uid}`,
    sql`select family, count from bag_candies where player = ${uid}`,
  ]);
  const bag: { items: [number, number][]; candies: [number, number][] } = {
    items: [],
    candies: [],
  };

  for (const row of items) {
    bag.items.push([asNumber(row.item), asNumber(row.count)]);
  }
  for (const row of candies) {
    bag.candies.push([asNumber(row.family), asNumber(row.count)]);
  }
  return bag;
}
