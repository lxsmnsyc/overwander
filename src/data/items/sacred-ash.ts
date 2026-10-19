import { Items } from '../ids/items';

/**
 * The Sacred Ash: what is left of a bird that burns and comes back.
 *
 * Nobody makes it and nobody stocks it — it is dug out of the world or
 * not had at all, which is what keeps a team from simply buying its way
 * out of losing. What it does in a fight is in
 * [`src/battle/items/sacred-ash.ts`](../../battle/items/sacred-ash.ts).
 */

export function isSacredAsh(item: Items): boolean {
  return item === Items.SacredAsh;
}
