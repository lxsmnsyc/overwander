import { MAX_EFFORT_PER_STAT, STAT_NAMES } from '../constants/stats';
import type { Items } from '../ids/items';
import { itemText } from './__create';
import recordsFile from './records/wings.yaml';
import { recordField } from './yaml';

/**
 * The wings: one stat, three points of effort, and gone.
 *
 * Every other point of effort a pokemon has was paid for by a level
 * it took. A wing is the exception — it is found rather than earned,
 * and what it grants sits on top of the level's allowance rather than
 * out of it, so a wing is worth the same to a pokemon at level 5 as
 * to one at 100.
 *
 * The rules the server enforces are in
 * [`src/server/training.ts`](../../server/training.ts); this is what a
 * wing is and which stat it belongs to.
 */
export const WING_STATS = recordField('wings', recordsFile, 'stat');

/**
 * What one wing is worth. Four points of effort buy one point of a
 * stat, so three is deliberately not a whole point on its own: wings
 * are a trickle, and the levels are the river
 */
export const WING_EFFORT = 3;

/** The Max wings, each filling its stat's effort at once. Only a flying shadow drops one */
export const MAX_WING_STATS = recordField('wings', recordsFile, 'fills');

/** Whether the item is a wing, Max or not */
export function isWing(item: Items): boolean {
  return WING_STATS.has(item) || MAX_WING_STATS.has(item);
}

export function describeWing(item: Items): string {
  const stat = WING_STATS.get(item);

  if (stat != null) {
    return itemText('wings', 'effort', { effort: WING_EFFORT, stat: STAT_NAMES[stat] });
  }

  const max = MAX_WING_STATS.get(item);

  if (max != null) {
    return itemText('wings', 'max', { stat: STAT_NAMES[max], max: MAX_EFFORT_PER_STAT });
  }
  throw new Error(`No wing description for item ${item}`);
}
