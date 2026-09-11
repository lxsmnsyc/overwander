import Landmark from '../../data/overworld/landmark';
import { type TrainerClass, isAceTrainer } from '../../data/overworld/trainers';
import { RocketRank } from '../chunk-snapshot';
import {
  CHAMPION_TRAINING,
  ELITE_TRAINING,
  GYM_TRAINING,
  LEGEND_TRAINING,
  PLAIN_TRAINING,
  type StopTraining,
} from './training';

/** What a rank fields its party with: abilities, items and training */
export interface StopOutfit {
  /** Ordinary abilities each carries, the Shadow mark aside */
  abilities: number;
  /** Held items each carries */
  items: number;
  /** What was polished and trained into each */
  training: StopTraining;
  /**
   * Whether each is built rather than rolled: the four moves its
   * species is best with instead of the last four it levelled into.
   *
   * The ladder's top rungs only. A gym leader and everybody below
   * fields what a walk could have met, which is the difference
   * between a badge and a crown
   */
  best?: boolean;
}

/** What a duelling trainer and a Team Rocket grunt field: what they caught. */
export const PLAIN_OUTFIT: StopOutfit = { abilities: 1, items: 0, training: PLAIN_TRAINING };

/** A gym leader's party is geared but not doubled. */
export const GYM_OUTFIT: StopOutfit = { abilities: 1, items: 1, training: GYM_TRAINING };

/**
 * An Ace Trainer's: what they caught, raised the way the Elite Four
 * raise theirs. Nothing they field is beyond what a walk could have
 * met, and all of it is fast and hard to drop
 */
export const ACE_OUTFIT: StopOutfit = { abilities: 1, items: 0, training: ELITE_TRAINING };

/** The Elite Four's, and the executives who match them. */
export const ELITE_OUTFIT: StopOutfit = {
  abilities: 2,
  items: 1,
  training: ELITE_TRAINING,
  best: true,
};

/** A champion's, and Giovanni's: two of everything. */
export const CHAMPION_OUTFIT: StopOutfit = {
  abilities: 2,
  items: 2,
  training: CHAMPION_TRAINING,
  best: true,
};

/** A legend's: three of everything, on six at the ceiling. */
export const LEGEND_OUTFIT: StopOutfit = {
  abilities: 3,
  items: 3,
  training: LEGEND_TRAINING,
  best: true,
};

/**
 * A Frontier Brain's: a champion's training on three, and the items
 * are the house's business. The Pyramid bars them on both sides, and
 * the caller strips them there rather than here
 */
export const FRONTIER_OUTFIT: StopOutfit = {
  abilities: 2,
  items: 2,
  training: CHAMPION_TRAINING,
  best: true,
};

/** What the party at this stop is fielded with */
export function stopOutfit(
  landmark: Landmark,
  rank: RocketRank,
  legend = false,
  duellist?: TrainerClass,
): StopOutfit {
  if (landmark === Landmark.Trainer && duellist != null && isAceTrainer(duellist)) {
    return ACE_OUTFIT;
  }
  if (landmark === Landmark.GymLeader) {
    return GYM_OUTFIT;
  }
  if (landmark === Landmark.EliteFour) {
    return ELITE_OUTFIT;
  }
  if (landmark === Landmark.Champion) {
    return legend ? LEGEND_OUTFIT : CHAMPION_OUTFIT;
  }
  if (landmark === Landmark.FrontierBrain) {
    return FRONTIER_OUTFIT;
  }
  if (landmark === Landmark.TeamRocket) {
    if (rank === RocketRank.Boss) {
      return CHAMPION_OUTFIT;
    }
    return rank === RocketRank.Executive ? ELITE_OUTFIT : PLAIN_OUTFIT;
  }
  return PLAIN_OUTFIT;
}
