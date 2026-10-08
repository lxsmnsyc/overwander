import { type Items, getApricornBall } from '../ids/items';
import { getItemData, itemText } from './__create';

/**
 * The seven apricorns.
 *
 * Each is picked off a tree and carried to Kurt, who carves it into
 * the one ball its colour makes. That is the whole of what an
 * apricorn does, so none of them is usable, held, or worth anything
 * to a vendor: an apricorn is a ball nobody has carved yet.
 */

/**
 * The one thing it is for, named: an apricorn nobody can carve is a
 * fruit, and which ball it makes is the only reason to pick one over
 * another
 */
export function describeApricorn(item: Items): string {
  const ball = getApricornBall(item);

  return itemText('apricorns', 'apricorn', {
    ball: ball == null ? 'ball' : getItemData(ball).name,
  });
}
