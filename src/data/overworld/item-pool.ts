import { RARE_SPAWN_ODDS, SPECIAL_SPAWN_ODDS, UNCOMMON_SPAWN_ODDS } from '../biome/__create';
import { Items } from '../ids/items';
import { PLATES } from '../items/plates';
import { WING_STATS } from '../items/wings';

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
 * The overworld item pool: the balls, the evolution stones, the
 * valuables the ground hides and the Shiny Charm. Plain balls and
 * the smaller valuables are the commons, utility balls and the
 * bigger valuables uncommon, stones and the Nugget rare, and the
 * Master Ball and Shiny Charm the one-per-world class.
 *
 * The **prized** band sits between rare and special, and the line it
 * draws is permanence. The rare band is where a walk turns up
 * something that gets a party through the next fight — a stone, a
 * Revive, a plate. Prized is where it turns up something that changes
 * a pokemon for good and cannot be undone: a Bottle Cap fixes what it
 * was born with, a Purifying Gem takes a shadow off it, a Max Revive
 * is the only thing that brings a whole party back from nothing. They
 * were all rare, and being drawn as often as a stone made them read as
 * ordinary.
 *
 * The valuables sit a band below what they are worth: they are a
 * steady trickle of gold rather than a jackpot, so the rarest bands
 * stay for the things gold cannot buy.
 *
 * Machines are deliberately absent: they are bought, never found.
 */
export const ITEM_POOL: ItemRarityGroups = {
  base: [
    { item: Items.PokeBall, weight: 30 },
    { item: Items.GreatBall, weight: 10 },
    { item: Items.PremierBall, weight: 5 },
    { item: Items.HealBall, weight: 5 },
    { item: Items.LuxuryBall, weight: 5 },
    { item: Items.Pearl, weight: 8 },
    { item: Items.Stardust, weight: 8 },
    // The everyday medicine. A walk that turns up a Potion and an
    // Antidote is a walk that paid for the raid it is walking towards
    { item: Items.Potion, weight: 12 },
    { item: Items.Antidote, weight: 5 },
    { item: Items.BurnHeal, weight: 5 },
    { item: Items.IceHeal, weight: 5 },
    { item: Items.Awakening, weight: 5 },
    { item: Items.ParalyzeHeal, weight: 5 },
    // The herbs grow where a walk goes, which is the reason they cost
    // less than what a shop bottles: they are picked rather than
    // bought, and the pokemon that swallows one settles the bill
    { item: Items.EnergyPowder, weight: 8 },
    { item: Items.HealPowder, weight: 8 },
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
    { item: Items.BigPearl, weight: 8 },
    { item: Items.StarPiece, weight: 8 },
    { item: Items.SuperPotion, weight: 10 },
    { item: Items.HyperPotion, weight: 6 },
    { item: Items.FullHeal, weight: 6 },
    // The root is a Hyper Potion's worth and then some, so it sits in
    // the band the Hyper Potion sits in rather than with the powders
    { item: Items.EnergyRoot, weight: 6 },
    // The only thing the Move Reminder takes. It is dug up rather than
    // bought because nothing sells one — a forgotten move costs a walk,
    // which is what the move cost in the first place
    { item: Items.HeartScale, weight: 8 },
    // The wings, blown along the ground: three points of training
    // each, and the only effort a pokemon gets that its levels did
    // not pay for. Thin slots, because they are the one thing in the
    // game that raises a stat past what a level allows
    ...[...WING_STATS.keys()].map((item) => ({ item, weight: 3 })),
  ],
  rare: [
    { item: Items.FireStone, weight: 10 },
    { item: Items.WaterStone, weight: 10 },
    { item: Items.ThunderStone, weight: 10 },
    { item: Items.LeafStone, weight: 10 },
    { item: Items.MoonStone, weight: 10 },
    { item: Items.Nugget, weight: 8 },
    // What a party comes back from a lost raid on. The Max Revive is
    // deliberately the thinner slot of the two
    { item: Items.MaxPotion, weight: 6 },
    { item: Items.FullRestore, weight: 4 },
    { item: Items.Revive, weight: 6 },
    // A Max Revive that grows out of the ground. It is the commoner of
    // the two — the Max Revive itself is prized now — because what it
    // asks for is not gold
    { item: Items.RevivalHerb, weight: 4 },
    // The relics: a Cubone's bone, a Ditto's dust. Found, never
    // stocked, and worth nothing to anything but their own species
    { item: Items.LightBall, weight: 4 },
    { item: Items.ThickClub, weight: 4 },
    { item: Items.MetalPowder, weight: 4 },
    { item: Items.QuickPowder, weight: 4 },
    // The plates, buried where they fell. Each is a single thin slot
    // — seventeen of them share about what one stone is worth, so
    // digging one up stays an event
    ...[...PLATES.keys()].map((item) => ({ item, weight: 1 })),
  ],
  prized: [
    // A dug-up cap fixes one stat of one pokemon, and nothing else in
    // the game touches what a catch was born with. The commonest of
    // the three, so the band has something a player can actually hope
    // for — its golden twin, which fixes all six, stays special
    { item: Items.BottleCap, weight: 10 },
    // The only way a shadow is ever put right, and a shadow is a raid
    // rather than an everyday thing
    { item: Items.PurifyingGem, weight: 8 },
    // The one item that brings a pokemon back from nothing at full
    // health. The Revive and the Revival Herb are the rare band's
    // answer to a lost fight; this is the answer to a lost party
    { item: Items.MaxRevive, weight: 5 },
  ],
  special: [
    { item: Items.MasterBall, weight: 10 },
    { item: Items.ShinyCharm, weight: 10 },
    // The only way a mythical is ever fought: the relic is found
    // here or not at all
    { item: Items.OldSeaMap, weight: 6 },
    // Six stats made perfect at once. Nothing else undoes a bad roll,
    // so it belongs with the things gold cannot buy
    { item: Items.GoldenBottleCap, weight: 8 },
    // One crossing of the world. It is spent in the crossing, which is
    // what keeps the map worth walking
    { item: Items.PortalKey, weight: 8 },
  ],
};

/**
 * Which band of the pool something is drawn from
 */
export type ItemBand = keyof ItemRarityGroups;

let bands: Map<Items, ItemBand> | null = null;

/**
 * The band the ground hides this item in, or null for something the
 * ground never hides at all — a machine, a berry off a bush, anything
 * only a vendor sells.
 *
 * Built on the first ask rather than at import, and cached, since the
 * pool is a module constant and the answer cannot change under it. An
 * item listed in two bands answers with the rarest, which is the one
 * that decides how hard it was to come by
 */
export function getItemBand(item: Items): ItemBand | null {
  if (bands == null) {
    bands = new Map();
    // Commonest first, so a rarer listing overwrites it
    for (const band of ['base', 'uncommon', 'rare', 'prized', 'special'] as const) {
      for (const entry of ITEM_POOL[band]) {
        bands.set(entry.item, band);
      }
    }
  }
  return bands.get(item) ?? null;
}

/**
 * Whether the item is one of the finds worth stopping a player over:
 * the **prized and special** bands — the caps, the Purifying Gem, the
 * Max Revive, the Master Ball.
 *
 * It is what decides whether spending one is asked about twice, and it
 * is the same line the two bands were split on. A prized or special
 * find changes a pokemon for good or cannot be come by again; a rare
 * one gets a party through the next fight, and a Max Potion asked
 * about twice is a click for nothing however scarce it was to dig up.
 *
 * Scarcity alone is not the test — what a mistake costs is
 */
export function isPreciousItem(item: Items): boolean {
  const band = getItemBand(item);

  return band === 'prized' || band === 'special';
}

/**
 * How wide each band's slice of an item roll is, richest first: the
 * special band owns the opening slice of the draw, the prized band the
 * next, then rare, then uncommon, and whatever remains falls to base.
 *
 * They are widths rather than running totals, so adding a band takes
 * its slice out of **base** and leaves every other band as wide as it
 * was
 */
export interface ItemBandOdds {
  special: number;
  prized: number;
  rare: number;
  uncommon: number;
}

/**
 * How often a walk turns up something from the prized band. It sits
 * eight times commoner than a special and eight times scarcer than a
 * rare, which is the gap the two left between them: a find of a
 * season rather than a find of a lifetime
 */
export const PRIZED_ITEM_ODDS = 1 / 512;

/**
 * The default bands. The three ordinary ones mirror the spawn pool's;
 * the prized band is the item pool's own, since a species has no
 * equivalent of a thing that changes a pokemon for good
 */
export const ITEM_BAND_ODDS: ItemBandOdds = {
  special: SPECIAL_SPAWN_ODDS,
  prized: PRIZED_ITEM_ODDS,
  rare: RARE_SPAWN_ODDS,
  uncommon: UNCOMMON_SPAWN_ODDS,
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
  rare: RARE_SPAWN_ODDS,
  uncommon: UNCOMMON_SPAWN_ODDS,
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
  return roll < edge + odds.uncommon ? 2 : 3;
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
 * Roll a stash: up to `MAX_KINDS` kinds of up to `MAX_STACK` pieces
 * each.
 *
 * The first draw reads exactly as it does for a single item: it picks
 * a band. What differs is what that means. The band is a **ceiling**
 * rather than a choice — it is the best thing in the stash, and one
 * kind of it is guaranteed — and every further kind draws its own
 * band on the same odds, clamped to that ceiling. So a stash may hold
 * two rares and a base, or three commons, or one of each: the rarity
 * of a kind and the number of kinds are separate questions, which is
 * what stops a good dig from being the same three slots every time.
 *
 * A special is the ceiling like any other band, and the kinds under
 * it are drawn as usual — a stash may well be a Master Ball and two
 * stones. What it may never be is **two specials**: the opening draw
 * is the only one that can reach that band, and everything after it
 * is clamped to prized at best. A special is also always a single
 * piece, whatever else is buried with it: a Master Ball found three
 * at a time would stop being a Master Ball.
 *
 * The prized band is not held to that: a stash that opened on one may
 * hold a second, and the pieces are drawn the way any other band's
 * are. It is scarce rather than one-of-a-kind, and two Bottle Caps in
 * one hole is a very good dig rather than a broken one.
 *
 * Two kinds landing on the same item are one stack, and a stack never
 * exceeds `MAX_STACK` however they merge.
 *
 * Bands summing to 1 shut the base tier out entirely, which is how a
 * hidden grotto refuses to hold commons. Empty bands are skipped, so
 * a pool with nothing in it hands back nothing.
 *
 * The draws land in order: the ceiling, the special if the ceiling
 * reached one, how many kinds, and then for each kind after the
 * ceiling's own its band, followed in every case by the kind itself
 * and how many pieces of it
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
    const item = pickFromBand(groups.special, random);

    if (item != null) {
      stacks.set(item, 1);
      taken = 1;
    }
  }

  // Bands that leave no room for a base roll leave none in a haul
  // either: a grotto holds nothing common
  const commonest =
    odds.special + odds.prized + odds.rare + odds.uncommon >= 1
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

    const item = pickFromBand(groups[HAUL_BANDS[band]], random);
    const amount = 1 + Math.floor(random() * MAX_STACK);

    if (item != null) {
      stacks.set(item, Math.min(MAX_STACK, (stacks.get(item) ?? 0) + amount));
    }
  }
  return [...stacks].map(([item, amount]) => ({ item, amount }));
}

/**
 * One kind out of a band, by weight. Answers null for an empty band
 */
function pickFromBand(entries: ItemPoolEntry[], random: () => number): Items | null {
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

  for (const tier of ['special', 'prized', 'rare', 'uncommon'] as const) {
    edge += odds[tier];

    if (band < edge && groups[tier].length > 0) {
      return pickFromBand(groups[tier], random);
    }
  }
  return pickFromBand(groups.base, random);
}
