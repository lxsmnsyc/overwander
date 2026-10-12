import { MOUTH_SEARCH } from '../overworld/cave';
import { Items } from '../ids/items';
import { itemText } from './__create';

/**
 * The Escape Rope: the way out of a cave that is not the walk back
 * through it. Spent rather than carried, so the walk stays the usual
 * cost of having gone in.
 */

export function isEscapeRope(item: Items): boolean {
  return item === Items.EscapeRope;
}

export function describeEscapeRope(item: Items): string {
  if (!isEscapeRope(item)) {
    throw new Error(`No escape rope description for item ${item}`);
  }
  return itemText('escape-rope', 'rope', { chunks: MOUTH_SEARCH });
}
