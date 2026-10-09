import { Moves } from '../ids/moves';
import { Species } from '../ids/species';
import { getMoveData } from '../moves/__create';
import { type EvolutionData, getSpeciesData } from './__create';

/**
 * A battle feat: something a pokemon has to do in battle to open its
 * `Special` evolution. Each bound left out is not asked for
 */
export interface BattleFeat {
  /** Critical hits it has to land */
  criticals?: number;
  /** Health it has to take, and still be standing at the end */
  endured?: number;
  /** A move it has to land, and how many times */
  landed?: { move: Moves; count: number };
  /** Recoil it has to take; a fight it faints in counts for nothing */
  recoil?: number;
  /**
   * Counted across every fight rather than met in one. A cumulative
   * feat asks one thing, `landed` or `recoil`, and its running total is
   * kept on the catch
   */
  cumulative?: true;
}

/** What one fight measured of one pokemon */
export interface FeatMeasure {
  criticals: number;
  taken: number;
  /** The health it walked out with; zero is fainted */
  health: number;
  /** Uses landed of the move its feat names */
  landed?: number;
  /** Recoil it took from its own moves */
  recoil?: number;
}

export const BATTLE_FEATS = new Map<Species, BattleFeat>([
  [Species.FarfetchdGalar, { criticals: 3 }],
  [Species.YamaskGalar, { endured: 49 }],
  [Species.Stantler, { landed: { move: Moves.PsyshieldBash, count: 20 }, cumulative: true }],
  [Species.QwilfishHisui, { landed: { move: Moves.BarbBarrage, count: 20 }, cumulative: true }],
  [Species.BasculinWhite, { recoil: 294, cumulative: true }],
]);

/** Whether one fight met the feat this species evolves on */
export function meetsBattleFeat(species: Species, measure: FeatMeasure): boolean {
  const feat = BATTLE_FEATS.get(species);

  if (feat == null || feat.cumulative === true) {
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

/** The move whose landed uses this species' feat counts, if any */
export function featMove(species: Species): Moves | undefined {
  return BATTLE_FEATS.get(species)?.landed?.move;
}

/** The total a cumulative feat asks for, or zero for a one-fight feat */
export function featGoal(feat: BattleFeat): number {
  if (feat.cumulative !== true) {
    return 0;
  }
  return feat.landed?.count ?? feat.recoil ?? 0;
}

/**
 * Where a feat stands after one more fight: the running total it is
 * kept at, capped at the goal, and whether it is met. A one-fight feat
 * keeps no total
 */
export function settleBattleFeat(
  species: Species,
  measure: FeatMeasure,
  progress: number,
): { progress: number; met: boolean } {
  const feat = BATTLE_FEATS.get(species);

  if (feat?.cumulative !== true) {
    return { progress, met: meetsBattleFeat(species, measure) };
  }
  let gained = 0;

  if (feat.landed != null) {
    gained += Math.max(0, Math.floor(measure.landed ?? 0));
  }
  if (feat.recoil != null && measure.health > 0) {
    gained += Math.max(0, Math.floor(measure.recoil ?? 0));
  }
  const goal = featGoal(feat);
  const total = Math.min(goal, Math.max(0, progress) + gained);

  return { progress: total, met: total >= goal };
}

/**
 * The feat an evolution asks of whoever takes it, read off the stage
 * it grows out of
 */
export function featOfEvolution(evolution: EvolutionData): BattleFeat | undefined {
  const from = getSpeciesData(evolution.species).evolvesFrom;

  return from == null ? undefined : BATTLE_FEATS.get(from);
}

/**
 * What a feat asks, as a clause: "land 3 critical hits in one fight".
 * A cumulative one given its running total says how far along it is
 */
export function describeFeat(feat: BattleFeat, progress?: number): string {
  const asks: string[] = [];

  if (feat.criticals != null) {
    asks.push(`land ${feat.criticals} critical hits`);
  }
  if (feat.endured != null) {
    asks.push(`take ${feat.endured} damage without fainting`);
  }
  if (feat.landed != null) {
    asks.push(`land ${getMoveData(feat.landed.move).name} ${feat.landed.count} times`);
  }
  if (feat.recoil != null) {
    asks.push(`take ${feat.recoil} recoil damage without fainting`);
  }
  const clause = asks.join(' and ');

  if (feat.cumulative !== true) {
    return `${clause} in one fight`;
  }
  return progress == null ? clause : `${clause} (${progress}/${featGoal(feat)})`;
}
