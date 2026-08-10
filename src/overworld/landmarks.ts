import type { SpawnEntry } from '../data/biome';
import { boostFamilyWeights, getSpawnPool } from '../data/biome';
import type Biome from '../data/ids/biome';
import type { TimeOfDay } from '../data/ids/biome';
import type Families from '../data/ids/families';
import type { Items } from '../data/ids/items';
import type { Species } from '../data/ids/species';
import BERRY_POOL from '../data/overworld/berry-pool';
import type { ItemBandOdds } from '../data/overworld/item-pool';
import { ITEM_POOL, pickItem } from '../data/overworld/item-pool';
import { SPECIES_DAY_WEIGHT_BOOST, getBaseSpecies } from '../data/species';

/**
 * Half the grottos hold a cache, the other half a pokemon
 */
export const GROTTO_CACHE_CHANCE = 0.5;

/**
 * A grotto's item bands: one in sixty-four reaches the one-per-world
 * tier, one in eight the stones, and everything else is uncommon —
 * the base tier never shows up in a grotto
 */
export const GROTTO_ITEM_ODDS: ItemBandOdds = {
  special: 1 / 64,
  rare: 1 / 8,
  uncommon: 1,
};

/**
 * A grotto's pokemon bands: one in eight is rare, the rest uncommon.
 * Legendaries stay out of grottos entirely
 */
export const GROTTO_RARE_CHANCE = 1 / 8;

export type GrottoReward = { kind: 'pokemon'; species: Species } | { kind: 'item'; item: Items };

/**
 * A nest landmark: the species whose egg is lying in it.
 *
 * The three ordinary bands are drawn from together rather than in
 * tiers — what a nest lays is reduced to the first stage of its line,
 * so a rare draw and the base one below it would usually come to the
 * same egg anyway. The special tier is left out entirely: a legendary
 * has no nest, and a mythical is called with a relic or not at all.
 *
 * Answers null for a pool with nothing ordinary awake in it
 */
export function resolveNest(
  biome: Biome,
  time: TimeOfDay,
  random: () => number,
  featured: Families | null = null,
): Species | null {
  const biomePool = getSpawnPool(biome, time);
  const pool =
    featured == null
      ? biomePool
      : boostFamilyWeights(biomePool, featured, SPECIES_DAY_WEIGHT_BOOST);
  const entries: SpawnEntry[] = [...pool.base, ...pool.uncommon, ...pool.rare];

  if (entries.length === 0) {
    return null;
  }

  let total = 0;
  for (const entry of entries) {
    total += entry.weight;
  }

  let target = random() * total;
  for (const entry of entries) {
    target -= entry.weight;
    if (target < 0) {
      return getBaseSpecies(entry.species);
    }
  }
  return getBaseSpecies(entries[entries.length - 1].species);
}

/**
 * An item cache landmark: one roll from the overworld item pool
 */
export function resolveItemCache(random: () => number, odds?: ItemBandOdds): Items | null {
  return pickItem(ITEM_POOL, random, odds);
}

/**
 * A berry patch landmark: one roll from the berry pool, on the same
 * bands the spawn pool uses — the better berries are the rarer ones
 */
export function resolveBerryPatch(random: () => number): Items | null {
  return pickItem(BERRY_POOL, random);
}

/**
 * A hidden grotto landmark: either an uncommon/rare pokemon from
 * the biome's current pool, or an item cache of better rarity. The
 * day's featured family, when one is given, crowds the grotto's pool
 * exactly as it crowds the overworld's
 */
export function resolveHiddenGrotto(
  biome: Biome,
  time: TimeOfDay,
  random: () => number,
  featured: Families | null = null,
): GrottoReward | null {
  if (random() < GROTTO_CACHE_CHANCE) {
    const item = resolveItemCache(random, GROTTO_ITEM_ODDS);

    return item == null ? null : { kind: 'item', item };
  }

  const biomePool = getSpawnPool(biome, time);
  const pool =
    featured == null
      ? biomePool
      : boostFamilyWeights(biomePool, featured, SPECIES_DAY_WEIGHT_BOOST);
  // The rare band owns one draw in eight; the rest is uncommon, and
  // either band stands in for the other when it comes up empty
  const rare = random() < GROTTO_RARE_CHANCE;
  const preferred = rare ? pool.rare : pool.uncommon;
  const fallback = rare ? pool.uncommon : pool.rare;
  const entries: SpawnEntry[] = preferred.length > 0 ? preferred : fallback;

  if (entries.length === 0) {
    return null;
  }

  let total = 0;
  for (const entry of entries) {
    total += entry.weight;
  }

  let target = random() * total;
  for (const entry of entries) {
    target -= entry.weight;
    if (target < 0) {
      return { kind: 'pokemon', species: entry.species };
    }
  }
  return { kind: 'pokemon', species: entries[entries.length - 1].species };
}
