import { Items } from '../ids/items';
import { BERRY_EFFORT_DROPS, BERRY_RESIST_TYPES } from '../items/berries';
import type { ItemRarityGroups } from './item-pool';

/**
 * What a berry patch grows, split by rarity the way a biome's spawn
 * pool is: the single-status cures are everyday finds, the ones that
 * restore something are scarcer, and the berries a fight turns on are
 * the rare and special picks.
 *
 * The type-resist berries share the rare band the way the plates share
 * their slot in the item pool — eighteen thin slots between them, so
 * finding the one that answers what a player is about to walk into
 * stays luck rather than shopping.
 */
const BERRY_POOL: ItemRarityGroups = {
  base: [
    { item: Items.CheriBerry, weight: 10 },
    { item: Items.ChestoBerry, weight: 10 },
    { item: Items.PechaBerry, weight: 10 },
    { item: Items.RawstBerry, weight: 10 },
    { item: Items.AspearBerry, weight: 10 },
  ],
  uncommon: [
    { item: Items.LeppaBerry, weight: 10 },
    { item: Items.OranBerry, weight: 10 },
    { item: Items.PersimBerry, weight: 10 },
    // The bitter ones a pokemon is fed to take training back off a
    // stat. They are how a player changes their mind about where a
    // pokemon's effort went, so they grow where they will be found
    ...[...BERRY_EFFORT_DROPS.keys()].map((item) => ({ item, weight: 4 })),
    // A third of the holder's health back is worth more than any of
    // the cures, and the ones whose nature cannot stand the taste pay
    // for it in confusion
    { item: Items.FigyBerry, weight: 5 },
    { item: Items.WikiBerry, weight: 5 },
    { item: Items.MagoBerry, weight: 5 },
    { item: Items.AguavBerry, weight: 5 },
    { item: Items.IapapaBerry, weight: 5 },
  ],
  rare: [
    { item: Items.LumBerry, weight: 10 },
    { item: Items.SitrusBerry, weight: 10 },
    // The berries that answer a blow after it has landed
    { item: Items.EnigmaBerry, weight: 4 },
    { item: Items.KeeBerry, weight: 4 },
    { item: Items.MarangaBerry, weight: 4 },
    { item: Items.JabocaBerry, weight: 4 },
    { item: Items.RowapBerry, weight: 4 },
    // One per type, and one type is what a raid is: a party that knows
    // what it is walking into can dig for the berry that answers it
    ...[...BERRY_RESIST_TYPES.keys()].map((item) => ({ item, weight: 2 })),
  ],
  // A bush grows nothing permanent. The prized band is for the things
  // that change a pokemon for good — a cap, a gem — and a berry is
  // eaten, so the band is left empty and its slice of the roll falls
  // through to the rare one below it
  prized: [],
  special: [
    // What a pokemon holds against the moment it is nearly out. They
    // belong with the world's other one-in-a-long-walk finds: a fight
    // already lost is not usually won back, and these are what does it
    { item: Items.LiechiBerry, weight: 10 },
    { item: Items.GanlonBerry, weight: 10 },
    { item: Items.SalacBerry, weight: 10 },
    { item: Items.PetayaBerry, weight: 10 },
    { item: Items.ApicotBerry, weight: 10 },
    { item: Items.LansatBerry, weight: 6 },
    { item: Items.CustapBerry, weight: 6 },
    { item: Items.MicleBerry, weight: 6 },
    // Two stages at once, and no saying which: the thinnest slot of
    // the lot, and the one worth the walk
    { item: Items.StarfBerry, weight: 4 },
    // The prize grades. They settle no fight, so they are here for
    // scarcity rather than for power: a bush that bears a gold berry
    // is the reason to keep checking the patches. Gold is half of
    // silver's slot, and neither is anything to count on
    { item: Items.SilverRazzBerry, weight: 4 },
    { item: Items.SilverNanabBerry, weight: 4 },
    { item: Items.SilverPinapBerry, weight: 4 },
    { item: Items.GoldenRazzBerry, weight: 2 },
    { item: Items.GoldenNanabBerry, weight: 2 },
    { item: Items.GoldenPinapBerry, weight: 2 },
  ],
};

export default BERRY_POOL;
