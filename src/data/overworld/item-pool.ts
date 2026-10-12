import { SPECIAL_SPAWN_ODDS } from '../biome/__create';
import * as v from 'valibot';
import type { Items } from '../ids/items';
import { ITEM_IDS } from '../ids/names';
import { idOf } from '../yaml';
import poolFile from './item-pool.yaml';
import { DRIVES } from '../items/drives';
import { MARKET_GEAR } from '../items/gear';
import { ONE_SHOTS } from '../items/one-shots';
import { ORBS } from '../items/orbs';
import { MEGA_STONES } from '../items/mega-stones';
import { MEMORIES } from '../items/memories';
import { PLATES } from '../items/plates';
import { SIGNATURE_CRYSTALS, TYPE_CRYSTALS } from '../items/z-crystals';
import { MAX_VITAMIN_STATS, VITAMIN_STATS } from '../items/vitamins';
import { MINT_NATURES } from '../items/mints';
import { POWER_ITEMS } from '../items/power-items';
import { GENERAL_STAT_BOOSTERS } from '../items/stat-boosters';
import { TYPE_BOOSTERS } from '../items/type-boosters';
import { MAX_WING_STATS, WING_STATS } from '../items/wings';

/**
 * One weighted slot of an item pool
 */
export interface ItemPoolEntry {
  item: Items;
  weight: number;
}

/** One slot per item, all at the same weight */
export function evenlyWeighted(items: Iterable<Items>, weight: number): ItemPoolEntry[] {
  const entries: ItemPoolEntry[] = [];

  for (const item of items) {
    entries.push({ item, weight });
  }
  return entries;
}

/**
 * An item pool's entries, split by rarity band like a biome's spawn
 * pool
 */
export interface ItemRarityGroups {
  base: ItemPoolEntry[];
  uncommon: ItemPoolEntry[];
  /**
   * Between uncommon and rare: what changes a fight or a build rather
   * than restocking a bag
   */
  scarce: ItemPoolEntry[];
  rare: ItemPoolEntry[];
  /**
   * Between rare and special: the things that change a pokemon for
   * good rather than getting it through the next fight. A pool with
   * nothing worth setting apart leaves it empty, and the band is
   * skipped the way any empty band is
   */
  prized: ItemPoolEntry[];
  special: ItemPoolEntry[];
}

/**
 * The families a pool can name as one key, each at the weight it is
 * written with apiece. A family's members are its own table's, so an
 * item added to a family is in the pool without being written twice
 */
const ITEM_FAMILIES: Record<string, () => Iterable<Items>> = {
  wings: () => WING_STATS.keys(),
  'one-shots': () => ONE_SHOTS.keys(),
  'type-boosters': () => TYPE_BOOSTERS.keys(),
  'market-gear': () => MARKET_GEAR.keys(),
  vitamins: () => VITAMIN_STATS.keys(),
  plates: () => PLATES.keys(),
  drives: () => DRIVES.keys(),
  'mega-stones': () => MEGA_STONES.keys(),
  memories: () => MEMORIES.keys(),
  'type-crystals': () => TYPE_CRYSTALS.keys(),
  'signature-crystals': () => SIGNATURE_CRYSTALS.keys(),
  orbs: () => ORBS.keys(),
  'stat-boosters': () => GENERAL_STAT_BOOSTERS.keys(),
  'power-items': () => POWER_ITEMS.keys(),
  mints: () => MINT_NATURES.keys(),
  'max-vitamins': () => MAX_VITAMIN_STATS.keys(),
};

const BAND = v.record(v.string(), v.number());

const POOL = v.object({
  base: BAND,
  uncommon: BAND,
  scarce: BAND,
  rare: BAND,
  prized: BAND,
  special: BAND,
});

/** One band as written, in its order, each family laid down in its own */
function readBand(written: Record<string, number>, band: string): ItemPoolEntry[] {
  const entries: ItemPoolEntry[] = [];

  for (const [key, weight] of Object.entries(written)) {
    const family = ITEM_FAMILIES[key];

    if (Object.hasOwn(ITEM_FAMILIES, key)) {
      entries.push(...evenlyWeighted(family(), weight));
    } else {
      entries.push({ item: idOf(ITEM_IDS, key, `item-pool.yaml: ${band}`), weight });
    }
  }
  return entries;
}

function readItemPool(): ItemRarityGroups {
  const written = v.parse(POOL, poolFile);

  return {
    base: readBand(written.base, 'base'),
    uncommon: readBand(written.uncommon, 'uncommon'),
    scarce: readBand(written.scarce, 'scarce'),
    rare: readBand(written.rare, 'rare'),
    prized: readBand(written.prized, 'prized'),
    special: readBand(written.special, 'special'),
  };
}

/**
 * The overworld item pool: balls, evolution stones, the held-item
 * shelves, the valuables the ground hides, and the Shiny Charm.
 *
 * The line between **rare** and **prized** is permanence. Rare is what
 * gets a party through the next fight — a stone, a Revive. Prized is
 * what changes a pokemon for good: a Bottle Cap, a Purifying Gem, a
 * Max Revive.
 *
 * The **valuables** climb through every band, since they are one long
 * ladder — two hundred gold for a beach shell, six hundred thousand
 * for a crown. The crown sits in the rarest band as the exception:
 * everything else there is something gold cannot buy.
 *
 * Machines are deliberately absent: they are bought, never found.
 *
 * Written in `item-pool.yaml`. This is the whole ladder, and what a
 * band and its odds are read off. Where each thing is buried is a separate question, answered by
 * [`biome-items.ts`](./biome-items.ts): a stash draws from what its
 * own ground holds, which is this pool less whatever belongs
 * somewhere else
 */
export const ITEM_POOL: ItemRarityGroups = readItemPool();

/**
 * Which band of the pool something is drawn from
 */
export type ItemBand = keyof ItemRarityGroups;

let bands: Map<Items, ItemBand> | null = null;

/**
 * The band the ground hides this item in, or null for anything only a
 * vendor sells. Built on first ask and cached, since the pool is a
 * module constant; an item listed twice answers with the rarest band
 */
export function getItemBand(item: Items): ItemBand | null {
  if (bands == null) {
    bands = new Map();
    // Commonest first, so a rarer listing overwrites it
    for (const band of ['base', 'uncommon', 'scarce', 'rare', 'prized', 'special'] as const) {
      for (const entry of ITEM_POOL[band]) {
        bands.set(entry.item, band);
      }
    }
  }
  return bands.get(item) ?? null;
}

/**
 * Whether the item is worth stopping a player over — the prized and
 * special bands. It decides whether spending one is asked about twice.
 * Scarcity alone is not the test: what a mistake costs is
 */
export function isPreciousItem(item: Items): boolean {
  const band = getItemBand(item);

  // The Max wings are special where they drop, though the ground never holds one
  return band === 'prized' || band === 'special' || MAX_WING_STATS.has(item);
}

/**
 * How wide each band's slice of an item roll is, richest first, with
 * whatever remains falling to base. Widths rather than running totals,
 * so adding a band takes its slice out of base and leaves the rest
 */
export interface ItemBandOdds {
  special: number;
  prized: number;
  rare: number;
  scarce: number;
  uncommon: number;
}

/**
 * How often a walk turns up something from the prized band: four times
 * scarcer than a rare, sixteen times commoner than a special. A find
 * of a season rather than a find of a lifetime
 */
export const PRIZED_ITEM_ODDS = 1 / 256;

/**
 * The item pool's ordinary bands, each four times scarcer than the
 * one below it
 */
export const UNCOMMON_ITEM_ODDS = 1 / 4;
export const SCARCE_ITEM_ODDS = 1 / 16;
export const RARE_ITEM_ODDS = 1 / 64;

/**
 * The default bands. The three ordinary ones are the item pool's;
 * the prized band is the item pool's own, since a species has no
 * equivalent of a thing that changes a pokemon for good
 */
export const ITEM_BAND_ODDS: ItemBandOdds = {
  special: SPECIAL_SPAWN_ODDS,
  prized: PRIZED_ITEM_ODDS,
  rare: RARE_ITEM_ODDS,
  scarce: SCARCE_ITEM_ODDS,
  uncommon: UNCOMMON_ITEM_ODDS,
};

/**
 * How often one roll of the pool answers this item: the width of its
 * band, times its share of that band. Zero for anything the ground
 * never hides.
 *
 * Two items are not ranked by their bands. A band eight times rarer
 * does not make a wide slot in it rarer than a thin slot in the band
 * below, and the ladder the valuables are priced along is read here
 * rather than off `getItemBand`
 */
export function getItemOdds(item: Items, odds: ItemBandOdds = ITEM_BAND_ODDS): number {
  const band = getItemBand(item);

  if (band == null) {
    return 0;
  }
  let total = 0;
  let weight = 0;

  for (const entry of ITEM_POOL[band]) {
    total += entry.weight;
    if (entry.item === item) {
      weight += entry.weight;
    }
  }
  // Base is whatever the named bands leave, so it is subtracted rather
  // than looked up: a band added later takes its slice out of base
  const width =
    band === 'base'
      ? 1 - odds.special - odds.prized - odds.rare - odds.scarce - odds.uncommon
      : odds[band];

  return total === 0 ? 0 : width * (weight / total);
}

/**
 * What a phenomenon draws on: the ground's own bands, each one step
 * richer, with base and special both shut out.
 *
 * A phenomenon is something going on rather than something buried, and
 * it is worth walking to. The pokemon side already says so — one
 * startled in eight is rare, against the ground's one in sixty-four —
 * and the items say it the same way: what the ground calls uncommon is
 * the floor here, and prized and rare are eight times as wide as the
 * ground makes them.
 *
 * **Special keeps the ground's own width**, and holds only what a
 * phenomenon drops of its own: the Max wings. The ground's specials go
 * down to prized, so the relic crown is drawn with the ruins on its own
 * weight, and a pool with no special of its own folds the width into
 * prized.
 *
 * The widths sum to one, which is what leaves base nothing: what a
 * walk turns up anyway is not what a phenomenon leaves
 */
export const PHENOMENON_BAND_ODDS: ItemBandOdds = {
  special: SPECIAL_SPAWN_ODDS,
  prized: 8 * PRIZED_ITEM_ODDS,
  rare: 8 * RARE_ITEM_ODDS,
  // The ground's scarce is folded into the floor here, see `bandOf`
  scarce: 0,
  uncommon: 1 - SPECIAL_SPAWN_ODDS - 8 * PRIZED_ITEM_ODDS - 8 * RARE_ITEM_ODDS,
};

/**
 * What a Pickup buddy turns up: the ordinary bands with the top two
 * shut out entirely. What it finds is what was lying about — a ball, a
 * potion, now and then a stone — and a Master Ball scuffed up off a
 * path by a Meowth would make the rarest band worth nothing. A Bottle
 * Cap found the same way would do the same to the prized band, so it
 * is shut out for the same reason
 */
export const PICKUP_BAND_ODDS: ItemBandOdds = {
  special: 0,
  prized: 0,
  rare: RARE_ITEM_ODDS,
  scarce: SCARCE_ITEM_ODDS,
  uncommon: UNCOMMON_ITEM_ODDS,
};

/**
 * Some of one kind of item: what a stash actually holds
 */
export interface ItemStack {
  item: Items;
  amount: number;
}

/**
 * The most pieces of one kind a stash holds. Three of something
 * ordinary is worth stopping for; three of a Master Ball would not be
 */
export const MAX_STACK = 3;

/**
 * The most kinds a stash holds, special aside
 */
export const MAX_KINDS = 3;

/**
 * The bands a haul draws its kinds from, richest first. They are
 * indexed rather than named in the roll, because "no richer than" and
 * "no commoner than" are both just comparisons on the index
 */
const HAUL_BANDS: (keyof Omit<ItemRarityGroups, 'special'>)[] = [
  'prized',
  'rare',
  'scarce',
  'uncommon',
  'base',
];

/**
 * Which band a draw lands in, as an index into `HAUL_BANDS`. The
 * special band is not among them: it is decided before any of this
 */
function bandIndex(roll: number, odds: ItemBandOdds): number {
  let edge = odds.special + odds.prized;

  if (roll < edge) {
    return 0;
  }
  edge += odds.rare;
  if (roll < edge) {
    return 1;
  }
  edge += odds.scarce;
  if (roll < edge) {
    return 2;
  }
  return roll < edge + odds.uncommon ? 3 : 4;
}

/**
 * The nearest band with anything in it, searched commoner-first and
 * then richer, and never outside the window the haul may draw from.
 * Answers null when the whole window is empty
 */
function stockedBand(
  groups: ItemRarityGroups,
  index: number,
  ceiling: number,
  commonest: number,
): number | null {
  for (let at = index; at <= commonest; at++) {
    if (groups[HAUL_BANDS[at]].length > 0) {
      return at;
    }
  }
  for (let at = index - 1; at >= ceiling; at--) {
    if (groups[HAUL_BANDS[at]].length > 0) {
      return at;
    }
  }
  return null;
}

/**
 * Roll a stash: up to `MAX_KINDS` kinds of up to `MAX_STACK` pieces.
 *
 * The opening draw picks a band and that band is a **ceiling**: one
 * kind of it is guaranteed and every further kind draws its own band
 * clamped to it, so rarity and count stay separate questions.
 *
 * A stash never holds **two specials**, and never more than one piece
 * of one. Prized is not held to that. Two kinds landing on the same
 * item merge, capped at `MAX_STACK`; bands summing to 1 shut the base
 * tier out, which is how a grotto refuses commons
 */
export function pickItems(
  groups: ItemRarityGroups,
  random: () => number,
  odds: ItemBandOdds = ITEM_BAND_ODDS,
): ItemStack[] {
  const opening = random();
  const stacks = new Map<Items, number>();
  let taken = 0;

  // The one band no second kind can reach, and the one that is never
  // more than a single piece
  if (opening < odds.special && groups.special.length > 0) {
    const item = pickWeightedItem(groups.special, random);

    if (item != null) {
      stacks.set(item, 1);
      taken = 1;
    }
  }

  // Bands that leave no room for a base roll leave none in a haul
  // either: a grotto holds nothing common
  const commonest =
    odds.special + odds.prized + odds.rare + odds.scarce + odds.uncommon >= 1
      ? HAUL_BANDS.length - 2
      : HAUL_BANDS.length - 1;
  // A stash that opened on a special goes on with prized; anything
  // else is capped by the band the opening draw actually reached
  const ceiling = taken > 0 ? 0 : Math.min(bandIndex(opening, odds), commonest);
  const kinds = 1 + Math.floor(random() * MAX_KINDS);

  for (let kind = taken; kind < kinds; kind++) {
    // The ceiling is guaranteed one kind; the rest roll their own
    // band, and cannot beat what the opening draw already reached
    const drawn =
      kind === 0 ? ceiling : Math.max(ceiling, Math.min(bandIndex(random(), odds), commonest));
    const band = stockedBand(groups, drawn, ceiling, commonest);

    if (band == null) {
      break;
    }

    const item = pickWeightedItem(groups[HAUL_BANDS[band]], random);
    const amount = 1 + Math.floor(random() * MAX_STACK);

    if (item != null) {
      stacks.set(item, Math.min(MAX_STACK, (stacks.get(item) ?? 0) + amount));
    }
  }
  const haul: { item: Items; amount: number }[] = [];

  for (const [item, amount] of stacks) {
    haul.push({ item, amount });
  }
  return haul;
}

/**
 * One kind out of a band, by weight. Answers null for an empty band
 */
function pickWeightedItem(entries: ItemPoolEntry[], random: () => number): Items | null {
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
      return entry.item;
    }
  }
  return entries[entries.length - 1].item;
}

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
  // Walked richest first, each slice as wide as its own odds. A roll
  // landing in an empty band falls to the next band down rather than
  // all the way to base, which is how a pool that keeps nothing
  // prized still rolls its rares
  let edge = 0;

  for (const tier of ['special', 'prized', 'rare', 'scarce', 'uncommon'] as const) {
    edge += odds[tier];

    if (band < edge && groups[tier].length > 0) {
      return pickWeightedItem(groups[tier], random);
    }
  }
  return pickWeightedItem(groups.base, random);
}
