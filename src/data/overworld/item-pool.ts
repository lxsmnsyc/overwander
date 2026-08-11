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
  special: ItemPoolEntry[];
}

/**
 * The overworld item pool: the balls, the evolution stones, the
 * valuables the ground hides and the Shiny Charm. Plain balls and
 * the smaller valuables are the commons, utility balls and the
 * bigger valuables uncommon, stones and the Nugget rare, and the
 * Master Ball and Shiny Charm the one-per-world class.
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
    { item: Items.MaxRevive, weight: 2 },
    // A dug-up cap fixes one stat of one pokemon: rare enough to be
    // the find of a walk, common enough to be worth saving for the
    // pokemon that deserves it
    { item: Items.BottleCap, weight: 6 },
    // The only way a shadow is ever put right. Thin, because a shadow
    // raid is not an everyday thing either
    { item: Items.PurifyingGem, weight: 4 },
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
const HAUL_BANDS: (keyof Omit<ItemRarityGroups, 'special'>)[] = ['rare', 'uncommon', 'base'];

/**
 * Which band a draw lands in, as an index into `HAUL_BANDS`. The
 * special band is not among them: it is decided before any of this
 */
function bandIndex(roll: number, odds: ItemBandOdds): number {
  if (roll < odds.special + odds.rare) {
    return 0;
  }
  return roll < odds.special + odds.rare + odds.uncommon ? 1 : 2;
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
 * is clamped to rare at best. A special is also always a single
 * piece, whatever else is buried with it: a Master Ball found three
 * at a time would stop being a Master Ball.
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
  const commonest = odds.special + odds.rare + odds.uncommon >= 1 ? 1 : 2;
  // A stash that opened on a special goes on with rares; anything
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
  let tier = groups.base;

  if (band < odds.special && groups.special.length > 0) {
    tier = groups.special;
  } else if (band < odds.special + odds.rare && groups.rare.length > 0) {
    tier = groups.rare;
  } else if (band < odds.special + odds.rare + odds.uncommon && groups.uncommon.length > 0) {
    tier = groups.uncommon;
  }
  return pickFromBand(tier, random);
}
