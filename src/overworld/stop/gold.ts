import AleaRNG from '../../core/alea';
import Landmark from '../../data/overworld/landmark';
import { type TrainerClass, isAceTrainer } from '../../data/overworld/trainers';
import { RocketRank } from '../chunk-snapshot';

/** The range a purse is rolled in, floor and ceiling included. */
export type GoldBand = [minimum: number, maximum: number];

/** What beating one is worth in gold */
/**
 * What a beaten stop pays, a rung at a time.
 *
 * The ladder is the level ladder: a fight worth more is a fight that
 * hits harder, so the purses climb in the same order the bands do and
 * a roadside Bug Catcher no longer pays what one of the Elite Four
 * pays.
 *
 * They are read against the **valuables**, which are the only prices
 * in the game the world sets rather than a shopkeeper: a nugget off
 * the ground is 10,000 and a Relic Crown is 600,000. A world where
 * beating the Champion is worth less than a nugget somebody tripped
 * over is not a world with a league in it, and a chunk holds one gym,
 * one seat and one champion behind a three-hour window, so nothing
 * here is farmed in an afternoon
 */
export const TYPE_TRAINER_GOLD: GoldBand = [5000, 15000];
export const ROCKET_GRUNT_GOLD: GoldBand = [5000, 15000];
export const GYM_GOLD: GoldBand = [20000, 50000];
export const ACE_TRAINER_GOLD: GoldBand = [25000, 60000];
export const EXECUTIVE_GOLD: GoldBand = [40000, 90000];
export const ELITE_GOLD: GoldBand = [50000, 110000];
export const GIOVANNI_GOLD: GoldBand = [120000, 250000];
export const CHAMPION_GOLD: GoldBand = [150000, 300000];
export const LEGEND_GOLD: GoldBand = [250000, 500000];

/**
 * And a house's, between a champion's purse and a legend's: the rank
 * is above the league, and what is really being paid for is a fight
 * under somebody else's rules
 */
export const FRONTIER_GOLD: GoldBand = [200000, 400000];

/**
 * Which purse a stop pays, by the same reading its level band takes:
 * the landmark, then the rank standing on a Team Rocket cell, then
 * the duellist's class
 */
export function stopGoldBand(
  landmark: Landmark,
  rank: RocketRank,
  trainer?: TrainerClass,
  legend = false,
): GoldBand {
  if (landmark === Landmark.GymLeader) {
    return GYM_GOLD;
  }
  if (landmark === Landmark.EliteFour) {
    return ELITE_GOLD;
  }
  if (landmark === Landmark.Champion) {
    return legend ? LEGEND_GOLD : CHAMPION_GOLD;
  }
  if (landmark === Landmark.FrontierBrain) {
    return FRONTIER_GOLD;
  }
  if (landmark === Landmark.Trainer) {
    return trainer != null && isAceTrainer(trainer) ? ACE_TRAINER_GOLD : TYPE_TRAINER_GOLD;
  }
  if (rank === RocketRank.Boss) {
    return GIOVANNI_GOLD;
  }
  return rank === RocketRank.Executive ? EXECUTIVE_GOLD : ROCKET_GRUNT_GOLD;
}

/**
 * The purse a beaten stop pays, seeded so each winner's roll is their
 * own and asking again answers the same
 */
export function rollStopGold(seed: string, [floor, ceiling]: GoldBand): number {
  const rng = new AleaRNG(seed);

  return floor + Math.floor(rng.random() * (ceiling - floor + 1));
}
