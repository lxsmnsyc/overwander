import type { Items } from '../../data/ids/items';
import type Overworld from '../core';

/**
 * A held item's field effect registers only when the buddy is
 * actually carrying it. What a buddy holds is fixed for the life of
 * an overworld instance, so the check happens once, at registration —
 * the same shape the field abilities use
 */
export default function createHeldItem(
  item: Items,
  setup: (overworld: Overworld) => void,
): (overworld: Overworld) => void {
  return (overworld: Overworld): void => {
    if (overworld.holds(item)) {
      setup(overworld);
    }
  };
}
