import { TYPE_NAMES } from '../constants/types';
import { Items } from '../ids/items';
import { itemText } from './__create';
import recordsFile from './records/incenses.yaml';
import { recordField } from './yaml';

/**
 * The incenses: held smokes, each one a small edge somewhere.
 *
 * Five of them are type boosters by another name — an Odd Incense
 * does for Psychic exactly what a Twisted Spoon does — and the other
 * four each touch something else entirely: how easily their holder is
 * hit, how late it acts, how much a reward pays, how crowded the
 * world around it is.
 *
 * The battle side lives in
 * [`src/battle/items/incenses.ts`](../../battle/items/incenses.ts) and
 * [`src/battle/items/type-boosters.ts`](../../battle/items/type-boosters.ts);
 * what a buddy's incense changes about the overworld lives in
 * [`src/overworld/items/incenses.ts`](../../overworld/items/incenses.ts).
 */

/**
 * The incenses that lift a type, and the type each lifts. Two of them
 * lift Water: the sea and the waves are the same water
 */
export const INCENSE_TYPES = recordField('incenses', recordsFile, 'lifts');

/**
 * The incenses that do something other than lift a type
 */
export const FIELD_INCENSES = new Set<Items>([
  Items.FullIncense,
  Items.LaxIncense,
  Items.LuckIncense,
  Items.PureIncense,
]);

/**
 * Every incense, for callers that only care that it is one
 */
export const INCENSES: Items[] = [...INCENSE_TYPES.keys(), ...FIELD_INCENSES];

/** The line for an incense that lifts a type */
export function describeIncense(item: Items): string {
  const type = INCENSE_TYPES.get(item);

  if (type == null) {
    throw new Error(`No incense line for item #${item}`);
  }
  return itemText('incenses', 'type', { type: TYPE_NAMES[type] });
}
