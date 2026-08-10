import type { SpawnEntry } from '../data/biome';
import { boostFamilyWeights, getSpawnPool } from '../data/biome';
import type Biome from '../data/ids/biome';
import type { TimeOfDay } from '../data/ids/biome';
import type Families from '../data/ids/families';
import type { Species } from '../data/ids/species';
import BERRY_POOL from '../data/overworld/berry-pool';
import type { ItemBandOdds, ItemStack } from '../data/overworld/item-pool';
import { ITEM_POOL, pickItem, pickItems } from '../data/overworld/item-pool';
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

export type GrottoReward =
  | { kind: 'pokemon'; species: Species }
  | { kind: 'item'; items: ItemStack[] };

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
 * An item cache landmark: a stash from the overworld item pool. It
 * holds up to three kinds — one rare, one uncommon, one base — of up
 * to `MAX_STACK` pieces each, or a single piece of one special when
 * the roll reaches that far. Answers an empty list for a cache that
 * came up with nothing
 */
export function resolveItemCache(random: () => number, odds?: ItemBandOdds): ItemStack[] {
  return pickItems(ITEM_POOL, random, odds);
}

/**
 * How much a patch bears when it fruits. A patch is a bush rather
 * than a buried box: whatever it grew, it grew a handful of, so the
 * pick is never a single berry
 */
export const MIN_BERRY_PICK = 3;
export const MAX_BERRY_PICK = 5;

/**
 * A berry patch landmark: one roll from the berry pool, on the same
 * bands the spawn pool uses — the better berries are the rarer ones —
 * and then how many of it the bush is carrying.
 *
 * One kind, `MIN_BERRY_PICK` to `MAX_BERRY_PICK` pieces: a patch
 * grows what it grows, so the rarity is the interesting draw and the
 * count is only how good a season it had
 */
export function resolveBerryPatch(random: () => number): ItemStack | null {
  const item = pickItem(BERRY_POOL, random);

  if (item == null) {
    return null;
  }
  return {
    item,
    amount: MIN_BERRY_PICK + Math.floor(random() * (MAX_BERRY_PICK - MIN_BERRY_PICK + 1)),
  };
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
    const items = resolveItemCache(random, GROTTO_ITEM_ODDS);

    return items.length === 0 ? null : { kind: 'item', items };
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
