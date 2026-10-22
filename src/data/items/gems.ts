import { TYPE_NAMES } from '../constants/types';
import type { Items } from '../ids/items';
import { itemText } from './__create';
import recordsFile from './records/gems.yaml';
import { recordField } from './yaml';

/**
 * The gems: one per attacking type, and each is spent the moment its
 * holder lands a move of that type.
 *
 * They are the one-shot answer to a type booster. A Charcoal burns
 * for every Fire move its holder ever throws and lifts each by a
 * fifth; a Fire Gem lifts one by half and is gone. Carrying one is a
 * bet on a single hit mattering more than every later one.
 *
 * The battle side lives in
 * [`src/battle/items/gems.ts`](../../battle/items/gems.ts).
 */
export const GEMS = recordField('gems', recordsFile, 'lifts');

export function describeGem(item: Items): string {
  const type = GEMS.get(item);

  if (type == null) {
    throw new Error(`No gem line for item #${item}`);
  }
  return itemText('gems', 'type', { type: TYPE_NAMES[type] });
}
