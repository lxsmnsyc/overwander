import { MAX_EFFORT_PER_STAT, MAX_IV, STAT_ORDER, Stats, setIV } from '../../data/constants/stats';
import type { Species } from '../../data/ids/species';
import { getSpeciesData } from '../../data/species';

/** How well a rank raised what it fields: polish, effort and values */
function zeroEffortValues(): Record<Stats, number> {
  return {
    [Stats.HP]: 0,
    [Stats.Attack]: 0,
    [Stats.Defense]: 0,
    [Stats.SpecialAttack]: 0,
    [Stats.SpecialDefense]: 0,
    [Stats.Speed]: 0,
  };
}

/**
 * What a stop's party is fielded with above what a wild pokemon
 * carries.
 *
 * A league seat and everybody above a Team Rocket grunt field trained
 * pokemon rather than caught ones: a second ability, which no wild
 * meeting ever rolls, gear chosen for the species holding it, and the
 * values and effort of something raised for the fight. The rungs
 * climb by adding one at a time
 */
/**
 * How the stop's party was raised: what its values were polished to
 * and what was trained into it, on top of the roll the spawn gave it.
 *
 * The polished stats are taken best-first, `polishedStats` order: a
 * rank that polishes two takes HP and Speed, one that polishes four
 * takes the side of its own spread the species leans on as well
 */
export interface StopTraining {
  /** Stats raised to a perfect value and trained to the ceiling */
  polished: number;
  /** What every other stat is trained to */
  effort: number;
  /** What every other value is set to, or null to keep the roll */
  values: number | null;
}

/** Nobody raised it: what the roll gave, with nothing spent on it. */
export const PLAIN_TRAINING: StopTraining = { polished: 0, effort: 0, values: null };

/** A gym leader's party is evenly raised rather than pointed. */
export const GYM_TRAINING: StopTraining = { polished: 0, effort: 50, values: 10 };

/** The Elite Four's, and the executives': fast and hard to drop. */
export const ELITE_TRAINING: StopTraining = { polished: 2, effort: 50, values: null };

/** A champion's, and Giovanni's: that, and the side they attack on. */
export const CHAMPION_TRAINING: StopTraining = { polished: 4, effort: 50, values: null };

/** A legend's: nothing left to raise. */
export const LEGEND_TRAINING: StopTraining = {
  polished: STAT_ORDER.length,
  effort: MAX_EFFORT_PER_STAT,
  values: MAX_IV,
};

/**
 * The six stats in the order a rank polishes them: HP and Speed
 * first, since every party wants to move first and stay up, then the
 * attacking and defending stat the species' own spread leans on, then
 * the two it does not
 */
export function polishedStats(species: Species): Stats[] {
  const base = getSpeciesData(species).stats;
  const physical = base[Stats.Attack] >= base[Stats.SpecialAttack];
  const sturdy = base[Stats.Defense] >= base[Stats.SpecialDefense];

  return [
    Stats.HP,
    Stats.Speed,
    physical ? Stats.Attack : Stats.SpecialAttack,
    sturdy ? Stats.Defense : Stats.SpecialDefense,
    physical ? Stats.SpecialAttack : Stats.Attack,
    sturdy ? Stats.SpecialDefense : Stats.Defense,
  ];
}

/**
 * The values and effort one of the stop's pokemon fields. The spawn
 * tuple is read and never written, so what a beaten stop hands over
 * is the pokemon the roll made, not the one it raised
 */
export function trainStop(
  species: Species,
  rolled: number,
  training: StopTraining,
): { ivs: number; effortValues: Record<Stats, number> } {
  const polished = new Set(polishedStats(species).slice(0, training.polished));
  const effortValues = zeroEffortValues();
  let ivs = rolled;

  for (const stat of STAT_ORDER) {
    if (polished.has(stat)) {
      ivs = setIV(ivs, stat, MAX_IV);
      effortValues[stat] = MAX_EFFORT_PER_STAT;
      continue;
    }
    if (training.values != null) {
      ivs = setIV(ivs, stat, training.values);
    }
    effortValues[stat] = training.effort;
  }
  return { ivs, effortValues };
}
