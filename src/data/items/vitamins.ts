import { MAX_EFFORT_PER_STAT, STAT_NAMES, Stats } from '../constants/stats';
import { Items } from '../ids/items';
import { PP_UP_LIMIT } from '../moves';
import { itemText } from './__create';

/**
 * The vitamins: ten points of effort in one stat, and gone.
 *
 * They are the wings' opposite number, and the pair of them is
 * deliberate. A wing is three points found on the ground, so training
 * is something a walk turns up a little of; a vitamin is ten points
 * off a shelf, so it is also something gold can buy. Both grant on top
 * of the level's allowance rather than out of it — see
 * [`useEffortItem`](../../server/training.ts) — which is what makes
 * either worth using on a pokemon that has already spent its own
 * pool.
 *
 * What they are not is a way past the ceiling: `MAX_EFFORT_PER_STAT`
 * holds whatever is poured into a stat, and a vitamin that would spill
 * over it is refused rather than partly drunk.
 */
export const VITAMIN_STATS = new Map<Items, Stats>([
  [Items.HPUp, Stats.HP],
  [Items.Protein, Stats.Attack],
  [Items.Iron, Stats.Defense],
  [Items.Calcium, Stats.SpecialAttack],
  [Items.Zinc, Stats.SpecialDefense],
  [Items.Carbos, Stats.Speed],
]);

/**
 * What one vitamin is worth: ten points, which is two and a half
 * levels' worth of allowance handed over in one bottle
 */
export const VITAMIN_EFFORT = 10;

/** The Max vitamins, each filling its stat's effort at once. Found, never bought */
export const MAX_VITAMIN_STATS = new Map<Items, Stats>([
  [Items.HPUpMax, Stats.HP],
  [Items.ProteinMax, Stats.Attack],
  [Items.IronMax, Stats.Defense],
  [Items.CalciumMax, Stats.SpecialAttack],
  [Items.ZincMax, Stats.SpecialDefense],
  [Items.CarbosMax, Stats.Speed],
]);

/** Whether the item is a vitamin, Max or not */
export function isVitamin(item: Items): boolean {
  return VITAMIN_STATS.has(item) || MAX_VITAMIN_STATS.has(item);
}

/**
 * Which items add points to a move, and how many each is worth
 */
export const PP_ITEMS = new Map<Items, number>([
  [Items.PPUp, 1],
  [Items.PPMax, PP_UP_LIMIT],
]);

export function isPPItem(item: Items): boolean {
  return PP_ITEMS.has(item);
}

export function describeVitamin(item: Items): string {
  const stat = VITAMIN_STATS.get(item);

  if (stat != null) {
    return itemText('vitamins', 'effort', { effort: VITAMIN_EFFORT, stat: STAT_NAMES[stat] });
  }

  const max = MAX_VITAMIN_STATS.get(item);

  if (max != null) {
    return itemText('vitamins', 'max', { stat: STAT_NAMES[max], max: MAX_EFFORT_PER_STAT });
  }
  throw new Error(`No vitamin description for item ${item}`);
}
