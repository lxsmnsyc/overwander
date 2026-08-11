import {
  EFFORT_PER_LEVEL,
  MAX_EFFORT_PER_STAT,
  STAT_ORDER,
  type Stats,
} from '../data/constants/stats';

/**
 * What a pokemon has been trained into, and what it has left to spend.
 *
 * The mainline earns effort from whatever a pokemon happens to have
 * fought, a species at a time. This game pays it out with the levels
 * instead — five points a level — and lets the player put them where
 * they want. The arithmetic is here rather than on either side of the
 * wire because both need it: the catch sheet has to say how many
 * points are left before it offers to spend one, and the server has to
 * decide the same thing again for real when the spend arrives.
 */

/**
 * The parts of a catch this file reads. Anything with a level, six
 * values and a wing allowance can be measured — a stored record, or
 * one being written
 */
export interface EffortTrained {
  level: number;
  effortValues: Record<Stats, number>;
  effortBonus: number;
}

/**
 * Every point the pokemon may spend: what its levels came with, plus
 * what wings have added on top
 */
export function effortBudget(caught: EffortTrained): number {
  return caught.level * EFFORT_PER_LEVEL + Math.max(0, caught.effortBonus);
}

/**
 * Every point already in a stat
 */
export function effortSpent(caught: EffortTrained): number {
  let total = 0;

  for (const stat of STAT_ORDER) {
    total += Math.max(0, caught.effortValues[stat]);
  }
  return total;
}

/**
 * What is left to put somewhere. It cannot go below zero: a pokemon
 * whose budget shrank under what it has already spent — which nothing
 * does today, but a level is easier to give than to take back — is
 * simply a pokemon with nothing left to spend
 */
export function unusedEffort(caught: EffortTrained): number {
  return Math.max(0, effortBudget(caught) - effortSpent(caught));
}

/**
 * The most that may be added to one stat right now: what is left to
 * spend, held to what the stat itself can still take
 */
export function assignableEffort(caught: EffortTrained, stat: Stats): number {
  return Math.min(unusedEffort(caught), MAX_EFFORT_PER_STAT - caught.effortValues[stat]);
}

/**
 * The six values with `amount` moved into one stat, or null when the
 * move is not one the pokemon can make.
 *
 * A negative amount takes training back off, which is what a bitter
 * berry does; those points return to the unspent pool rather than
 * being lost, since the levels that paid for them have not been
 * un-taken
 */
export function assignEffort(
  caught: EffortTrained,
  stat: Stats,
  amount: number,
): Record<Stats, number> | null {
  const step = Math.trunc(amount);

  if (step === 0) {
    return null;
  }

  const current = caught.effortValues[stat];
  const wanted = current + step;

  if (wanted < 0 || wanted > MAX_EFFORT_PER_STAT) {
    return null;
  }
  if (step > unusedEffort(caught)) {
    return null;
  }
  return { ...caught.effortValues, [stat]: wanted };
}
