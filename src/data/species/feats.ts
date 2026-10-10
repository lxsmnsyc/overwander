import { Species } from '../ids/species';
import { type EvolutionData, getSpeciesData } from './__create';

/**
 * A battle feat: something a pokemon has to do in one fight to open
 * its `Special` evolution. Each bound left out is not asked for
 */
export interface BattleFeat {
  /** Critical hits it has to land */
  criticals?: number;
  /** Health it has to take, and still be standing at the end */
  endured?: number;
}

/** What one fight measured of one pokemon */
export interface FeatMeasure {
  criticals: number;
  taken: number;
  /** The health it walked out with; zero is fainted */
  health: number;
}

export const BATTLE_FEATS = new Map<Species, BattleFeat>([
  [Species.FarfetchdGalar, { criticals: 3 }],
  [Species.YamaskGalar, { endured: 49 }],
]);

/** Whether one fight met the feat this species evolves on */
export function meetsBattleFeat(species: Species, measure: FeatMeasure): boolean {
  const feat = BATTLE_FEATS.get(species);

  if (feat == null) {
    return false;
  }
  if (feat.criticals != null && measure.criticals < feat.criticals) {
    return false;
  }
  if (feat.endured != null && (measure.taken < feat.endured || measure.health <= 0)) {
    return false;
  }
  return true;
}

/**
 * The feat an evolution asks of whoever takes it, read off the stage
 * it grows out of
 */
export function featOfEvolution(evolution: EvolutionData): BattleFeat | undefined {
  const from = getSpeciesData(evolution.species).evolvesFrom;

  return from == null ? undefined : BATTLE_FEATS.get(from);
}

/** What a feat asks, as a clause: "land 3 critical hits in one fight" */
export function describeFeat(feat: BattleFeat): string {
  const asks: string[] = [];

  if (feat.criticals != null) {
    asks.push(`land ${feat.criticals} critical hits`);
  }
  if (feat.endured != null) {
    asks.push(`take ${feat.endured} damage without fainting`);
  }
  return `${asks.join(' and ')} in one fight`;
}
