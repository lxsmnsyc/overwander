import Landmark from '../../data/overworld/landmark';
import type Biome from '../../data/ids/biome';
import { type ItemBandOdds, type ItemStack, pickItems } from '../../data/overworld/item-pool';
import { getItemPool } from '../../data/overworld/biome-items';
import { RocketRank } from '../chunk-snapshot';
import { BOSS_ALLIANCE, PLAYER_ALLIANCE } from '../raid';

/**
 * What the rungs above a gym leave behind besides the purse, as the
 * bands their stash is rolled off. The gym leader is not here: theirs
 * is a TM of their own type rather than a draw.
 *
 * Each rung reads three bands. A thief and the Elite Four reach from
 * scarce to prized; a champion and a legend from rare to special.
 * The champion's special is thin because the seat can be fought again
 * every window, and a legend, one window in sixty-four, is where the
 * special band is really reached.
 *
 * Each set sums to 1, so none of them falls through to the commoner
 * bands
 */
export const EXECUTIVE_LOOT_ODDS: ItemBandOdds = {
  special: 0,
  prized: 0.05,
  rare: 0.25,
  scarce: 0.7,
  uncommon: 0,
};

export const ELITE_LOOT_ODDS: ItemBandOdds = {
  special: 0,
  prized: 0.3,
  rare: 0.45,
  scarce: 0.25,
  uncommon: 0,
};

export const CHAMPION_LOOT_ODDS: ItemBandOdds = {
  special: 1 / 200,
  prized: 0.6,
  rare: 1 - 1 / 200 - 0.6,
  scarce: 0,
  uncommon: 0,
};

export const LEGEND_LOOT_ODDS: ItemBandOdds = {
  special: 0.1,
  prized: 0.65,
  rare: 0.25,
  scarce: 0,
  uncommon: 0,
};

/**
 * What a beaten expert leaves: a stash of one to three kinds, rolled
 * the way an item cache is, so the opening draw sets the best band and
 * a special is a single piece. Empty for the rungs that leave nothing:
 * a duelling trainer, a Team Rocket grunt, and the gym leader, whose
 * own gift is a machine
 */
export function rollStopLoot(
  landmark: Landmark,
  rank: RocketRank,
  biome: Biome,
  random: () => number,
  legend = false,
): ItemStack[] {
  // What they were carrying is what the ground they were beaten on
  // has to offer, the same as a stash dug up beside them
  const pool = getItemPool(biome);

  if (landmark === Landmark.EliteFour) {
    return pickItems(pool, random, ELITE_LOOT_ODDS);
  }
  if (landmark === Landmark.Champion) {
    return pickItems(pool, random, legend ? LEGEND_LOOT_ODDS : CHAMPION_LOOT_ODDS);
  }
  if (landmark === Landmark.TeamRocket && rank === RocketRank.Executive) {
    return pickItems(pool, random, EXECUTIVE_LOOT_ODDS);
  }
  return [];
}

/**
 * The level the pokemon a beaten grunt drops comes at. It is fixed,
 * so the prize is the same for everyone who put the same grunt down —
 * and low, because what is being handed over is a commoner taken off
 * a thief, not a raid boss' legendary
 */
export const ROCKET_REWARD_LEVEL = 10;

/**
 * The alliance a stop's party fights under: the side opposite the
 * player, the same number a raid boss takes. Nothing marks it as a
 * boss, so a fight that ends with nobody standing is a draw rather
 * than a win
 */
export const STOP_ALLIANCE = BOSS_ALLIANCE;

export { PLAYER_ALLIANCE };
