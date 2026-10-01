import 'server-only';
import { Items } from '../data/ids/items';
import { UTILITY_BELT_SLOT } from '../data/items/utility-belt';
import widenSlot from './slot-items';

/**
 * Widen one of the player's catches by an item slot, spending a belt.
 * Resolves the item slots it now has, or null when refused, see `widenSlot`
 */
export default async function useUtilityBelt(uid: string, catchId: string): Promise<number | null> {
  return widenSlot(uid, catchId, Items.UtilityBelt, UTILITY_BELT_SLOT);
}
