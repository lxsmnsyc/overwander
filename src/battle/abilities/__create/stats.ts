import { Stages, Stats } from '../../../data/constants/stats';
import type Unit from '../../unit';

/** How abilities read a unit's stats against each other */

/**
 * The five a fight is fought with. HP is left out: it is not a stat a
 * pokemon leans on, it is the room it has to be wrong in
 */
export const BATTLE_STATS = [
  Stats.Attack,
  Stats.Defense,
  Stats.SpecialAttack,
  Stats.SpecialDefense,
  Stats.Speed,
];

/**
 * Reads which of a unit's five stats stand highest and lowest. Asking
 * for a stat emits the same event the caller is answering, so the
 * measurement raises a flag the caller checks before it does anything
 */
export function createStatExtremes(): {
  measuring(): boolean;
  extremes(unit: Unit): { highest: Stats; lowest: Stats };
} {
  let measuring = false;

  return {
    measuring: () => measuring,
    extremes(unit) {
      measuring = true;

      let highest = BATTLE_STATS[0];
      let lowest = BATTLE_STATS[0];
      let highestValue = Number.NEGATIVE_INFINITY;
      let lowestValue = Number.POSITIVE_INFINITY;

      for (const stat of BATTLE_STATS) {
        const value = unit.checkStat(stat, 0);

        if (value > highestValue) {
          highest = stat;
          highestValue = value;
        }

        if (value < lowestValue) {
          lowest = stat;
          lowestValue = value;
        }
      }

      measuring = false;

      return { highest, lowest };
    },
  };
}

/** Which stage answers each of the five battle stats */
export const STAT_STAGES: Partial<Record<Stats, Stages>> = {
  [Stats.Attack]: Stages.Attack,
  [Stats.Defense]: Stages.Defense,
  [Stats.SpecialAttack]: Stages.SpecialAttack,
  [Stats.SpecialDefense]: Stages.SpecialDefense,
  [Stats.Speed]: Stages.Speed,
};
