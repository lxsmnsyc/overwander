import { TYPE_NAMES } from '../constants/types';
import type { Items } from '../ids/items';
import { itemText } from './__create';
import recordsFile from './records/type-boosters.yaml';
import { recordField } from './yaml';

/**
 * Type-enhancing held items: one per attacking type, each worth a
 * fifth more power to the moves of its own type and nothing to
 * anything else. They are held rather than used, and never consumed —
 * a Charcoal burns for as long as its holder carries it.
 *
 * The battle side of them lives in
 * [`src/battle/items/type-boosters.ts`](../../battle/items/type-boosters.ts);
 * this is only which type each one lifts.
 */
export const TYPE_BOOSTERS = recordField('type-boosters', recordsFile, 'lifts');

export function describeTypeBooster(item: Items): string {
  const type = TYPE_BOOSTERS.get(item);

  if (type == null) {
    throw new Error(`No type booster line for item #${item}`);
  }
  return itemText('type-boosters', 'type', { type: TYPE_NAMES[type] });
}
