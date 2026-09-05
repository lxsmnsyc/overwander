import Landmark from '../../data/overworld/landmark';
import type { Items } from '../../data/ids/items';
import type Biome from '../../data/ids/biome';
import { type ItemBandOdds, pickItem } from '../../data/overworld/item-pool';
import { getItemPool } from '../../data/overworld/biome-items';
import { RocketRank } from '../chunk-snapshot';
import { BOSS_ALLIANCE, PLAYER_ALLIANCE } from '../raid';

/** What a beaten stop leaves behind besides the purse */
/**
 * What the rungs above a gym leave behind besides the purse, as the
 * bands their one item is rolled off.
 *
 * The gym leader is not here: theirs is a TM of their own type rather
 * than a draw. An executive drops what a thief was carrying, which is
 * the rare band and little else; the Elite Four reach the prized band
 * properly; and a champion mostly does.
 *
 * **Nobody drops out of the special band.** A chunk keeps a champion's
 * seat the way it keeps a gym's, and it can be fought again every
 * window: at that frequency a Master Ball or a Shiny Charm would stop
 * being a find of a lifetime within a week. The special band stays
 * the ground's alone.
 *
 * Each set sums to 1, so none of them can fall through to the base
 * band either
 */
export const EXECUTIVE_LOOT_ODDS: ItemBandOdds = {
  special: 0,
  prized: 0.05,
  rare: 0.95,
  uncommon: 0,
};

export const ELITE_LOOT_ODDS: ItemBandOdds = {
  special: 0,
  prized: 0.3,
  rare: 0.7,
  uncommon: 0,
};

export const CHAMPION_LOOT_ODDS: ItemBandOdds = {
  special: 0,
  prized: 0.6,
  rare: 0.4,
  uncommon: 0,
};

/**
 * The one exception, and the reason a legend is worth walking into: a
 * rare or a special at twenty to one. It is the only fight in the
 * game that reaches the special band, which is what one window in
 * sixty-four should be worth
 */
export const LEGEND_LOOT_ODDS: ItemBandOdds = {
  special: 1 / 21,
  prized: 0,
  rare: 20 / 21,
  uncommon: 0,
};

/**
 * The one item a beaten expert leaves, or null for the rungs that
 * leave none: a duelling trainer, a Team Rocket grunt, and the gym
 * leader, whose own gift is a machine
 */
export function rollStopLoot(
  landmark: Landmark,
  rank: RocketRank,
  biome: Biome,
  random: () => number,
  legend = false,
): Items | null {
  // What they were carrying is what the ground they were beaten on
  // has to offer, the same as a stash dug up beside them
  const pool = getItemPool(biome);

  if (landmark === Landmark.EliteFour) {
    return pickItem(pool, random, ELITE_LOOT_ODDS);
  }
  if (landmark === Landmark.Champion) {
    return pickItem(pool, random, legend ? LEGEND_LOOT_ODDS : CHAMPION_LOOT_ODDS);
  }
  if (landmark === Landmark.TeamRocket && rank === RocketRank.Executive) {
    return pickItem(pool, random, EXECUTIVE_LOOT_ODDS);
  }
  return null;
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
