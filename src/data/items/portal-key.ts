import { ItemFlags, ItemTypes, Items } from '../ids/items';
import { registerItem } from './__create';

/**
 * The Portal Key: the only thing that crosses the world without
 * walking it.
 *
 * A portal stands where the ground put it and does nothing at all on
 * its own. The key opens one, and it is **spent opening it** — which
 * is the whole of the balance. A key that could be kept would turn the
 * world's geography into a menu: the walk to a biome, the search for a
 * lair, the hours a landmark keeps its window would all stop mattering
 * the moment a player found one. Spent, it is a rare shortcut a player
 * chooses where to use, which is a different and better decision.
 *
 * It is found in the world's rarest band and nowhere else. Nothing
 * sells it, and nothing holds it: a key is used, not carried into a
 * fight.
 */

export function isPortalKey(item: Items): boolean {
  return item === Items.PortalKey;
}

export default function registerPortalKey(): void {
  registerItem(Items.PortalKey, {
    name: 'Portal Key',
    description: 'Pays for one crossing at a portal you are standing on. Spent on use.',
    type: ItemTypes.KeyItem,
    // Its own picture, tinted out of the Intriguing Stone by
    // `scripts/item-icons.ts`: no rip drew a portal key, and the two
    // stones it used to borrow are spoken for
    icon: 'key/portal-key',
    flags: ItemFlags.Usable | ItemFlags.Consumable,
    buy: 0,
    sell: 0,
  });
}
