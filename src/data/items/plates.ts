import { TYPE_NAMES } from '../constants/types';
import type { Items } from '../ids/items';
import { itemText } from './__create';
import recordsFile from './records/plates.yaml';
import { recordField } from './yaml';

/**
 * The plates: old stone tablets, one for every type but Normal, each
 * lifting the moves of its own type by a fifth.
 *
 * They do exactly what a type booster does — a Flame Plate and a
 * Charcoal are worth the same to a Fire move — and differ in where
 * they come from. A booster is stocked and expensive; a plate is
 * buried, found in the ground or not at all, and no shop will sell
 * one back to a player who parts with it.
 *
 * The battle side rides the type-booster listener in
 * [`src/battle/items/type-boosters.ts`](../../battle/items/type-boosters.ts),
 * so there is one place that decides what lifting a type means.
 */
export const PLATES = recordField('plates', recordsFile, 'lifts');

export function describePlate(item: Items): string {
  const type = PLATES.get(item);

  if (type == null) {
    throw new Error(`Item #${item} is not a plate`);
  }
  return itemText('plates', 'plate', { type: TYPE_NAMES[type] });
}
