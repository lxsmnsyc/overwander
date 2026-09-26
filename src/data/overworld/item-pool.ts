import { SPECIAL_SPAWN_ODDS } from '../biome/__create';
import { Items } from '../ids/items';
import { DRIVES } from '../items/drives';
import { MARKET_GEAR } from '../items/gear';
import { ONE_SHOTS } from '../items/one-shots';
import { ORBS } from '../items/orbs';
import { PLATES } from '../items/plates';
import { VITAMIN_STATS } from '../items/vitamins';
import { MINT_NATURES } from '../items/mints';
import { POWER_ITEMS } from '../items/power-items';
import { GENERAL_STAT_BOOSTERS } from '../items/stat-boosters';
import { TYPE_BOOSTERS } from '../items/type-boosters';
import { WING_STATS } from '../items/wings';

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
 * This is the whole ladder, and what a band and its odds are read
 * off. Where each thing is buried is a separate question, answered by
 * [`biome-items.ts`](./biome-items.ts): a stash draws from what its
 * own ground holds, which is this pool less whatever belongs
 * somewhere else
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
    // The roadside trinkets: a shell off a beach, a feather off a
    // path, a mushroom nobody would stop for. They are what makes a
    // walk pay at all, so they are the commonest gold in the game
    { item: Items.ShoalSalt, weight: 6 },
    { item: Items.ShoalShell, weight: 6 },
    { item: Items.PrettyWing, weight: 6 },
    { item: Items.TinyMushroom, weight: 8 },
    // The first rung of the relic ladder. It is worth what a Stardust
    // is worth, so it is hidden where a Stardust is hidden
    { item: Items.RelicCopper, weight: 4 },
    // Somebody's rubbish, which is a meal to a Poison type and a slow
    // poisoning to everyone else. It is litter, so it lies where
    // litter lies
    { item: Items.BlackSludge, weight: 4 },
    // A burr picked up off the same walk, and about as welcome
    { item: Items.StickyBarb, weight: 4 },
    // The way out of a cave, hidden in the country that has caves in
    // it as often as anywhere else: a rope is worth carrying before
    // you need it
    { item: Items.EscapeRope, weight: 6 },
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
    // A jar for a honey tree, left where the trees are
    { item: Items.Honey, weight: 6 },
  ],
  uncommon: [
    { item: Items.NetBall, weight: 10 },
    { item: Items.DiveBall, weight: 10 },
    { item: Items.NestBall, weight: 10 },
    { item: Items.RepeatBall, weight: 10 },
    { item: Items.TimerBall, weight: 10 },
    { item: Items.QuickBall, weight: 10 },
    { item: Items.DuskBall, weight: 10 },
    // A shade thinner than the base valuables would make them, so the
    // band's doubled width never makes a dearer find the commoner one
    { item: Items.BigPearl, weight: 7 },
    { item: Items.StarPiece, weight: 7 },
    { item: Items.BigMushroom, weight: 6 },
    // Priced with the Big Mushroom, so it is hidden with it: a bone in
    // a richer band than a dearer pearl would break the ladder
    { item: Items.RareBone, weight: 5 },
    { item: Items.SuperPotion, weight: 10 },
    { item: Items.FullHeal, weight: 6 },
    // The only thing the Move Reminder takes. It is dug up rather than
    // bought because nothing sells one — a forgotten move costs a walk,
    // which is what the move cost in the first place
    { item: Items.HeartScale, weight: 8 },
    // Holding a line one stage short of where it would go is a
    // decision players make early and often, so the stone is common
    { item: Items.Everstone, weight: 6 },
  ],
  scarce: [
    { item: Items.UltraBall, weight: 15 },
    // Kurt's balls, dropped by whoever carried one out of his shop.
    // Thin, since nobody sells them and each is for one kind of catch
    { item: Items.LevelBall, weight: 3 },
    { item: Items.LureBall, weight: 3 },
    { item: Items.MoonBall, weight: 3 },
    { item: Items.FriendBall, weight: 3 },
    { item: Items.LoveBall, weight: 3 },
    { item: Items.HeavyBall, weight: 3 },
    { item: Items.FastBall, weight: 3 },
    { item: Items.RelicSilver, weight: 4 },
    { item: Items.HyperPotion, weight: 6 },
    // The root is a Hyper Potion's worth and then some, so it sits in
    // the band the Hyper Potion sits in rather than with the powders
    { item: Items.EnergyRoot, weight: 6 },
    // What a party comes back from a lost fight on, all of it bottled
    // and sold. The herb is a Revive that grows out of the ground
    { item: Items.MaxPotion, weight: 6 },
    { item: Items.Revive, weight: 6 },
    { item: Items.RevivalHerb, weight: 4 },
    // The stones that hold a sky out longer, and the clay that does
    // the same for a screen. Thin slots: each is worth nothing to a
    // party not built around the thing it lengthens
    { item: Items.DampRock, weight: 3 },
    { item: Items.HeatRock, weight: 3 },
    { item: Items.IcyRock, weight: 3 },
    { item: Items.SmoothRock, weight: 3 },
    { item: Items.LightClay, weight: 3 },
    // Pulled up with them, and about as particular: everything to a
    // pokemon that drains, nothing to anything else
    { item: Items.BigRoot, weight: 4 },
    // The wings, blown along the ground: three points of training
    // each, and the only effort a pokemon gets that its levels did
    // not pay for. Thin slots, because they are the one thing in the
    // game that raises a stat past what a level allows
    ...evenlyWeighted(WING_STATS.keys(), 3),
    // The one-shots, dropped where their moment ended. Each waits for
    // one thing to happen to its holder and is spent on it, which is
    // the band's own test: through the next fight and no further
    ...evenlyWeighted(ONE_SHOTS.keys(), 2),
    // The everyday held gear: a type lifted by a fifth, a tenth more
    // damage, a lens. Thin slots each, since there are forty-five of
    // them. The type boosters also drop off the wild species that
    // carry them
    ...evenlyWeighted(TYPE_BOOSTERS.keys(), 1),
    ...evenlyWeighted(MARKET_GEAR.keys(), 1),
    // Left behind by whatever wriggled out of it, which is what it
    // does for whoever picks it up
    { item: Items.ShedShell, weight: 4 },
    // Boots somebody walked out of: worth a slot to anything that has
    // to walk back onto a field somebody else laid spikes on
    { item: Items.HeavyDutyBoots, weight: 4 },
    // Somebody's weighted dice, which is worth a slot to the handful
    // of pokemon that throw a move several times over
    { item: Items.LoadedDice, weight: 3 },
    // The training kit: a brace heavier than anything wants to wear, a
    // bell rung for a pokemon that was not caught in a comfortable
    // ball, and the candy pair, a walk's worth of extra candy each
    { item: Items.MachoBrace, weight: 3 },
    { item: Items.SootheBell, weight: 3 },
    { item: Items.ExpShare, weight: 2 },
    { item: Items.LuckyEgg, weight: 2 },
  ],
  rare: [
    { item: Items.FireStone, weight: 10 },
    { item: Items.WaterStone, weight: 10 },
    { item: Items.ThunderStone, weight: 10 },
    { item: Items.LeafStone, weight: 10 },
    { item: Items.MoonStone, weight: 10 },
    { item: Items.SunStone, weight: 10 },
    // Sinnoh's four, buried like the six above them now that a line
    // asks for each
    { item: Items.ShinyStone, weight: 8 },
    { item: Items.DuskStone, weight: 8 },
    { item: Items.DawnStone, weight: 8 },
    { item: Items.IceStone, weight: 8 },
    // Not a stone, and here for the same reason they are: it is used
    // on a pokemon and spent. Thinner, because a Rotom wants more
    // than one of them and nobody sells any
    { item: Items.RotomCatalog, weight: 6 },
    // What a trade or a held evolution asks for, on the stones' terms
    // but thinner: each is wanted by one line rather than several
    { item: Items.KingsRock, weight: 3 },
    { item: Items.DragonScale, weight: 3 },
    { item: Items.UpGrade, weight: 3 },
    { item: Items.Protector, weight: 3 },
    { item: Items.Electirizer, weight: 3 },
    { item: Items.Magmarizer, weight: 3 },
    { item: Items.ReaperCloth, weight: 3 },
    { item: Items.DubiousDisc, weight: 3 },
    { item: Items.DeepSeaTooth, weight: 3 },
    { item: Items.DeepSeaScale, weight: 3 },
    { item: Items.PrismScale, weight: 3 },
    { item: Items.OvalStone, weight: 3 },
    { item: Items.RazorClaw, weight: 3 },
    { item: Items.RazorFang, weight: 3 },
    { item: Items.LinkingCord, weight: 4 },
    // A level for any line, whatever candy it takes
    { item: Items.RareCandy, weight: 5 },
    // 10 effort a bottle, one step past the wings' 3
    ...evenlyWeighted(VITAMIN_STATS.keys(), 3),
    // A step off one move's cooldown for good; its bigger bottle is
    // prized
    { item: Items.PPUp, weight: 3 },
    { item: Items.Nugget, weight: 8 },
    // The middle of the ladder, thinning as it climbs
    // Cut off a Slowpoke, and worth more than the nugget it is found
    // beside — which is the joke, and the reason it is thin
    { item: Items.SlowpokeTail, weight: 3 },
    { item: Items.PearlString, weight: 5 },
    { item: Items.RelicGold, weight: 4 },
    { item: Items.BalmMushroom, weight: 4 },
    { item: Items.BigNugget, weight: 2 },
    // The top of the medicine: the Full Restore, and the Max Revive
    // that brings a pokemon back from nothing at full health. Both are
    // bottled and sold, so a find is a saving rather than a prize
    { item: Items.FullRestore, weight: 4 },
    { item: Items.MaxRevive, weight: 5 },
    // The relics: a Cubone's bone, a Ditto's dust. Thinner than the
    // band's staples because each is worth nothing to anybody who has
    // not caught that one species, and one to anybody who has
    { item: Items.LightBall, weight: 3 },
    { item: Items.ThickClub, weight: 3 },
    { item: Items.MetalPowder, weight: 3 },
    { item: Items.QuickPowder, weight: 3 },
    // And the two that sharpen one species' aim: a Chansey's glove
    // and a Farfetch'd leek
    { item: Items.LuckyPunch, weight: 3 },
    { item: Items.Stick, weight: 3 },
    // A Soul Dew is nothing to anybody but the pair it belongs to
    { item: Items.SoulDew, weight: 2 },
    // A stone's weight, because every pokemon a player owns wants one
    // — a Fire Stone is wanted once, by one line
    { item: Items.Leftovers, weight: 10 },
    // The plates, buried where they fell. Seventeen thin slots share
    // about what one stone is worth, so digging one up stays an event
    ...evenlyWeighted(PLATES.keys(), 1),
    // The Drives are found on the same terms as the plates
    ...evenlyWeighted(DRIVES.keys(), 1),
    // The strongest gear, on the plates' terms: thin slots, so the
    // band stays the stones' and finding a Choice Band stays an event
    ...evenlyWeighted(ORBS.keys(), 1),
    ...evenlyWeighted(GENERAL_STAT_BOOSTERS.keys(), 1),
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
    // The only thing that widens a pokemon rather than filling it in.
    // Thin: a second held item is a whole build, and one belt is one
    // pokemon's worth of it
    { item: Items.UtilityBelt, weight: 4 },
    // Room for another ability, which the Channeler then has
    // something to fill. Commoner than the belt: a species that
    // cannot reach four on its own needs one before she is any use
    { item: Items.AbilityCapsule, weight: 6 },
    // The one ability nothing rolls, written into a pokemon that
    // already has everything its line can be born with. Thin: it
    // cannot be taken back
    { item: Items.AbilityPatch, weight: 4 },
    // One crossing of the world. It is spent in the crossing, so it
    // changes where a player is rather than what a pokemon is — but it
    // is the only thing that does, and a network nobody can reach is
    // no network. Prized rather than special: the map is meant to be
    // walked more than once in a lifetime
    { item: Items.PortalKey, weight: 8 },
    /**
     * The one thing in the game that answers a party being wiped out,
     * and it answers once. Thin, and prized rather than special
     * because a team that finds one has found a second chance rather
     * than something nobody else will ever see
     */
    { item: Items.SacredAsh, weight: 4 },
    // The fossils. Reviving one is irreversible and is the only way
    // to the species inside, which is the test this band is for; the
    // maniac sells them, so the pool is the lucky route rather than
    // the only one. The amber is thinner because Aerodactyl is
    { item: Items.HelixFossil, weight: 8 },
    { item: Items.DomeFossil, weight: 8 },
    { item: Items.OldAmber, weight: 5 },
    { item: Items.RootFossil, weight: 8 },
    { item: Items.ClawFossil, weight: 8 },
    { item: Items.SkullFossil, weight: 8 },
    { item: Items.ArmorFossil, weight: 8 },
    { item: Items.CoverFossil, weight: 8 },
    { item: Items.PlumeFossil, weight: 8 },
    // The rock a Deoxys rearranges itself with, spent on each
    // rearrangement. Prized rather than special: it is worth nothing
    // to anybody who has not been to the island, and everything to
    // whoever has
    { item: Items.Meteorite, weight: 4 },
    // The orbs and the flower, which the meteorite is the first of:
    // each is worth nothing at all until its own legendary has been
    // caught, and everything the moment one has. Thinner than the
    // rock, since each names one pokemon where the rock names four
    // shapes of the same one
    { item: Items.AdamantOrb, weight: 3 },
    { item: Items.LustrousOrb, weight: 3 },
    { item: Items.GriseousOrb, weight: 3 },
    { item: Items.Gracidea, weight: 3 },
    // As thin as the orbs, for the same reason: the splicers are worth
    // nothing until a Kyurem has been caught
    { item: Items.DnaSplicers, weight: 3 },
    // Three purses instead of one, for good, and nothing sells one.
    // Here rather than in rare so that parting with it is asked about
    // twice
    { item: Items.AmuletCoin, weight: 4 },
    // The ruins. They change nothing about a pokemon, which is what
    // the rest of this band is for; what puts them here is that one of
    // them pays for a season of everything else, and a band that draws
    // a Bottle Cap is the right rate for that.
    //
    // The four are spread rather than levelled, because the ladder is
    // read by price: each is dearer than the one above it, so each is
    // scarcer than the one above it
    { item: Items.RelicVase, weight: 4 },
    { item: Items.CometShard, weight: 3 },
    { item: Items.RelicBand, weight: 2 },
    { item: Items.RelicStatue, weight: 1 },
    // The power items: each decides what a player's next fifty eggs
    // are made of, which is the band's permanence test passed on the
    // next generation rather than on the holder
    ...evenlyWeighted(POWER_ITEMS.keys(), 3),
    // A move's cooldown taken as far down as it goes, for good
    { item: Items.PPMax, weight: 2 },
    // A lamp for the dark underground, and nobody sells one
    { item: Items.ExplorerKit, weight: 3 },
    // The mints. A nature is two stats for the rest of a pokemon's
    // life and nothing else touches one, which is this band exactly.
    // The thinnest weight there is, because there are twenty-one of
    // them: finding a mint is ordinary, finding the one a player came
    // for is not, and the chef is who they go to when it matters
    ...evenlyWeighted(MINT_NATURES.keys(), 1),
  ],
  special: [
    { item: Items.MasterBall, weight: 10 },
    { item: Items.ShinyCharm, weight: 10 },
    // Beside the Shiny Charm and a little readier to turn up: what it
    // is worth is half again on a throw rather than eight times a
    // roll, so it is the lesser of the two charms in every sense
    { item: Items.CatchingCharm, weight: 12 },
    // The only way a mythical is ever fought: the relic is found
    // here or not at all
    { item: Items.OldSeaMap, weight: 6 },
    { item: Items.GSBall, weight: 6 },
    { item: Items.AuroraTicket, weight: 6 },
    { item: Items.WishTag, weight: 6 },
    { item: Items.MemberCard, weight: 6 },
    { item: Items.ManaphyEgg, weight: 6 },
    { item: Items.OaksLetter, weight: 6 },
    { item: Items.AzureFlute, weight: 6 },
    { item: Items.ColtsPetal, weight: 6 },
    { item: Items.LibertyPass, weight: 6 },
    { item: Items.MusicBox, weight: 6 },
    { item: Items.ColressMachine, weight: 6 },
    // Six stats made perfect at once. Nothing else undoes a bad roll,
    // so it belongs with the things gold cannot buy
    { item: Items.GoldenBottleCap, weight: 8 },
    // The one thing here that is only gold. Everything beside it is
    // something gold cannot buy, and the crown earns its place the
    // other way round: six hundred thousand is more than the game pays
    // for anything else, so the band that hides a Master Ball is the
    // only one that can hide it.
    //
    // Thin even for this band, and that is the whole of why. A band
    // eight times rarer is not by itself rarer than a wide slot in the
    // band below: at 5 the crown outdrew the statue under it, which is
    // worth two thirds as much
    { item: Items.RelicCrown, weight: 3 },
  ],
};

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

  return band === 'prized' || band === 'special';
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
 * **Special is nobody's here.** A phenomenon's pool is picked by type
 * rather than by band, and of the ground's five specials only the
 * relic crown is a valuable, so a special band would have been a band
 * of one and its whole width would have been that crown's rate. The
 * crown is drawn with the ruins instead, on its own weight among them.
 *
 * The widths sum to one, which is what leaves base nothing: what a
 * walk turns up anyway is not what a phenomenon leaves
 */
export const PHENOMENON_BAND_ODDS: ItemBandOdds = {
  special: 0,
  prized: 8 * PRIZED_ITEM_ODDS,
  rare: 8 * RARE_ITEM_ODDS,
  // The ground's scarce is folded into the floor here, see `bandOf`
  scarce: 0,
  uncommon: 1 - 8 * PRIZED_ITEM_ODDS - 8 * RARE_ITEM_ODDS,
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
