import { RARE_SPAWN_ODDS, SPECIAL_SPAWN_ODDS, UNCOMMON_SPAWN_ODDS } from '../biome/__create';
import { Items } from '../ids/items';

/**
 * One weighted slot of an item pool
 */
export interface ItemPoolEntry {
  item: Items;
  weight: number;
}

/**
 * An item pool's entries, split by rarity band like a biome's spawn
 * pool
 */
export interface ItemRarityGroups {
  base: ItemPoolEntry[];
  uncommon: ItemPoolEntry[];
  rare: ItemPoolEntry[];
  special: ItemPoolEntry[];
}

/**
 * The overworld item pool: for now the balls and the evolution
 * items, with plain balls as the commons, utility balls uncommon,
 * evolution stones rare and the Master Ball one-per-world class
 */
export const ITEM_POOL: ItemRarityGroups = {
  base: [
    { item: Items.PokeBall, weight: 30 },
    { item: Items.GreatBall, weight: 10 },
    { item: Items.PremierBall, weight: 5 },
    { item: Items.HealBall, weight: 5 },
    { item: Items.LuxuryBall, weight: 5 },
  ],
  uncommon: [
    { item: Items.UltraBall, weight: 15 },
    { item: Items.NetBall, weight: 10 },
    { item: Items.DiveBall, weight: 10 },
    { item: Items.NestBall, weight: 10 },
    { item: Items.RepeatBall, weight: 10 },
    { item: Items.TimerBall, weight: 10 },
    { item: Items.QuickBall, weight: 10 },
    { item: Items.DuskBall, weight: 10 },
  ],
  rare: [
    { item: Items.FireStone, weight: 10 },
    { item: Items.WaterStone, weight: 10 },
    { item: Items.ThunderStone, weight: 10 },
    { item: Items.LeafStone, weight: 10 },
    { item: Items.MoonStone, weight: 10 },
  ],
  special: [{ item: Items.MasterBall, weight: 10 }],
};

/**
 * Cumulative band thresholds for an item roll: the special band owns
 * the first slice of the draw, the rare band the next, the uncommon
 * band the next, and whatever remains falls to base
 */
export interface ItemBandOdds {
  special: number;
  rare: number;
  uncommon: number;
}

/**
 * The default bands, mirroring the spawn pool's
 */
export const ITEM_BAND_ODDS: ItemBandOdds = {
  special: SPECIAL_SPAWN_ODDS,
  rare: RARE_SPAWN_ODDS,
  uncommon: UNCOMMON_SPAWN_ODDS,
};

/**
 * Roll one item from a pool, mirroring the spawn roll: the first
 * draw picks the rarity band (falling back to base when a band is
 * empty), the second picks within the band by weight. Callers with
 * their own odds — a hidden grotto, say — pass their bands in, and
 * bands summing to 1 shut the base tier out entirely
 */
export function pickItem(
  groups: ItemRarityGroups,
  random: () => number,
  odds: ItemBandOdds = ITEM_BAND_ODDS,
): Items | null {
  const band = random();
  let tier = groups.base;

  if (band < odds.special && groups.special.length > 0) {
    tier = groups.special;
  } else if (band < odds.special + odds.rare && groups.rare.length > 0) {
    tier = groups.rare;
  } else if (band < odds.special + odds.rare + odds.uncommon && groups.uncommon.length > 0) {
    tier = groups.uncommon;
  }
  if (tier.length === 0) {
    return null;
  }

  let total = 0;
  for (const entry of tier) {
    total += entry.weight;
  }

  let target = random() * total;
  for (const entry of tier) {
    target -= entry.weight;
    if (target < 0) {
      return entry.item;
    }
  }
  return tier[tier.length - 1].item;
}
