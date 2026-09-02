import {
  boostFamilyEntries,
  boostFamilyWeights,
  getEggPool,
  getSpawnPool,
  pickFromEntries,
} from '../data/biome';
import type { SpawnEntry } from '../data/biome';
import type Biome from '../data/ids/biome';
import type { TimeOfDay } from '../data/ids/biome';
import EggGroups from '../data/ids/egg-groups';
import { APRICORNS, type Items } from '../data/ids/items';
import type Families from '../data/ids/families';
import type { Species } from '../data/ids/species';
import BERRY_POOL from '../data/overworld/berry-pool';
import type { ItemBandOdds, ItemStack } from '../data/overworld/item-pool';
import { ITEM_POOL, PHENOMENON_BAND_ODDS, pickItem, pickItems } from '../data/overworld/item-pool';
import Phenomenon, {
  GROTTO_EGG_CHANCE,
  PHENOMENON_ITEM_CHANCE,
  PHENOMENON_RARE_CHANCE,
  getPhenomenonGroups,
} from '../data/overworld/phenomenon';
import { SPECIES_DAY_WEIGHT_BOOST, getSpeciesData } from '../data/species';

/**
 * What a phenomenon turned out to be: something to meet, something to
 * pick up, or — a grotto alone, and rarely — an egg of the biome
 */
export type PhenomenonReward =
  | { kind: 'pokemon'; species: Species }
  | { kind: 'item'; items: ItemStack[] }
  | { kind: 'egg'; species: Species };

/**
 * A nest landmark: the species whose egg is lying in it.
 *
 * Everything that makes a nest a nest is in the biome's **egg pool** —
 * the three ordinary bands already reduced to first stages and merged,
 * with the special tier left out — so what is left here is one
 * weighted draw, and a species day is the same boost it is everywhere
 * else.
 *
 * Answers null for a pool with nothing ordinary awake in it
 */
export function resolveNest(
  biome: Biome,
  time: TimeOfDay,
  random: () => number,
  featured: Families | null = null,
): Species | null {
  const pool = getEggPool(biome, time);

  return pickFromEntries(
    featured == null ? pool : boostFamilyEntries(pool, featured, SPECIES_DAY_WEIGHT_BOOST),
    random,
  );
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
 * Which apricorn a tree bears. Every colour is equally likely: an
 * apricorn is a ball nobody has carved yet, and the seven balls are
 * worth about the same as each other, so there is no rarer colour to
 * hunt
 */
export function resolveApricornColour(random: () => number): Items {
  return APRICORNS[Math.floor(random() * APRICORNS.length)];
}

/**
 * What one apricorn tree is carrying.
 *
 * Two draws rather than one, because they turn over on different
 * clocks: the colour is the tree's for good, since the tree is
 * **drawn** bearing it and one that changed colour every quarter-hour
 * would be a different tree each time, and the crop is the window's,
 * the way a berry patch's is
 */
export function resolveApricornTree(colour: () => number, crop: () => number): ItemStack {
  return {
    item: resolveApricornColour(colour),
    amount: MIN_BERRY_PICK + Math.floor(crop() * (MAX_BERRY_PICK - MIN_BERRY_PICK + 1)),
  };
}

/**
 * The egg groups a phenomenon insists on: rippling water startles the
 * three water groups, a flying shadow the flying one. The others take
 * whatever the biome has
 */
const PHENOMENON_EGG_GROUPS: Partial<Record<Phenomenon, Set<EggGroups>>> = {
  [Phenomenon.RipplingWater]: new Set([EggGroups.Water1, EggGroups.Water2, EggGroups.Water3]),
  [Phenomenon.FlyingShadow]: new Set([EggGroups.Flying]),
};

/**
 * The band's entries that fit what the phenomenon looks like; the
 * whole band when it insists on nothing
 */
function fitting(entries: SpawnEntry[], groups: Set<EggGroups> | undefined): SpawnEntry[] {
  if (groups == null) {
    return entries;
  }
  return entries.filter((entry) =>
    getSpeciesData(entry.species).eggGroups.some((group) => groups.has(group)),
  );
}

/**
 * The pokemon a phenomenon startled out: the biome's **uncommon** band
 * most of the time and its **rare** band one draw in eight, with
 * either standing in for the other when it comes up empty. The base
 * band is not in it at all — what a player can meet by walking is not
 * worth stopping for — and neither is the special one.
 *
 * Rippling water and a flying shadow look like something particular,
 * and that is binding rather than a preference: a shadow overhead that
 * turned out to be a Rattata is the picture lying. A biome with
 * nothing of the kind answers null, and the caller hands over what the
 * phenomenon was carrying instead.
 *
 * The day's featured family, when one is given, crowds the pool
 * exactly as it crowds the overworld's
 */
function startled(
  phenomenon: Phenomenon,
  biome: Biome,
  time: TimeOfDay,
  random: () => number,
  featured: Families | null,
): Species | null {
  const biomePool = getSpawnPool(biome, time);
  const pool =
    featured == null
      ? biomePool
      : boostFamilyWeights(biomePool, featured, SPECIES_DAY_WEIGHT_BOOST);
  const groups = PHENOMENON_EGG_GROUPS[phenomenon];
  const rare = random() < PHENOMENON_RARE_CHANCE;
  const preferred = rare ? pool.rare : pool.uncommon;
  const fallback = rare ? pool.uncommon : pool.rare;
  // Either band, so a thin rare band borrows the uncommon one. What is
  // never borrowed is a species of the wrong kind
  const bands =
    groups == null
      ? [preferred, fallback]
      : [fitting(preferred, groups), fitting(fallback, groups)];

  return pickFromEntries(bands.find((band) => band.length > 0) ?? [], random);
}

/**
 * A phenomenon landmark: what the thing going on at the cell turns out
 * to be.
 *
 * Every kind can be a **pokemon**, and every kind but the grotto can
 * be an **item** instead: half the time, through the phenomenon's own
 * bands, which are the ground's one step richer. A grotto has no item
 * side: what it has instead is one draw in sixty-four on an **egg** of
 * the biome, decided before anything else, which is the rarest thing
 * any landmark hands over without a fee or a walk.
 *
 * Answers null when the biome has nothing in the bands a phenomenon
 * draws from
 */
export function resolvePhenomenon(
  phenomenon: Phenomenon,
  biome: Biome,
  time: TimeOfDay,
  random: () => number,
  featured: Families | null = null,
): PhenomenonReward | null {
  // One piece. Everything a phenomenon leaves is worth carrying home
  // on its own, so a handful of them would be a different landmark
  const dropped = (): PhenomenonReward | null => {
    const item = pickItem(getPhenomenonGroups(phenomenon), random, PHENOMENON_BAND_ODDS);

    return item == null ? null : { kind: 'item', items: [{ item, amount: 1 }] };
  };

  if (phenomenon === Phenomenon.HiddenGrotto) {
    if (random() < GROTTO_EGG_CHANCE) {
      const species = resolveNest(biome, time, random, featured);

      return species == null ? null : { kind: 'egg', species };
    }
  } else if (random() < PHENOMENON_ITEM_CHANCE) {
    return dropped();
  }

  const species = startled(phenomenon, biome, time, random, featured);

  // A shadow over a biome with nothing that flies drops what it was
  // carrying rather than turning out to be nothing at all
  return species == null ? dropped() : { kind: 'pokemon', species };
}
