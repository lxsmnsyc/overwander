import { ItemFlags, ItemTypes, Items } from '../ids/items';
import { registerItem } from './__create';

/**
 * The Sacred Ash: what is left of a bird that burns and comes back.
 *
 * Nobody makes it and nobody stocks it — it is dug out of the world or
 * not had at all, which is what keeps a team from simply buying its way
 * out of losing. What it does in a fight is in
 * [`src/battle/items/sacred-ash.ts`](../../battle/items/sacred-ash.ts).
 */

/**
 * What somebody will pay to take one off a player's hands. Dear,
 * because a fight it turns around is a fight that was over
 */
const SACRED_ASH_RESALE = 20_000;

export function isSacredAsh(item: Items): boolean {
  return item === Items.SacredAsh;
}

export default function registerSacredAsh(): void {
  registerItem(Items.SacredAsh, {
    name: 'Sacred Ash',
    type: ItemTypes.Held,
    icon: 'medicine/sacred-ash',
    flags: ItemFlags.Holdable | ItemFlags.Consumable,
    buy: 0,
    sell: SACRED_ASH_RESALE,
  });
}
