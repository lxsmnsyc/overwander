import type Biome from '../ids/biome';
import BiomeIds from '../ids/biome';
import type { Items } from '../ids/items';
import { Items as ItemIds } from '../ids/items';
import { ITEM_POOL, type ItemPoolEntry, type ItemRarityGroups } from './item-pool';

/**
 * Which ground hides what.
 *
 * [`ITEM_POOL`](./item-pool.ts) is the whole ladder and stays the one
 * place a band and its odds are read from. What is decided here is
 * only **where**: most of the shelf is buried everywhere, and the
 * things below belong to a landscape instead, so a stone is a reason
 * to cross the map rather than a slot in a table. The world is one
 * continuous map, so nothing here is out of anybody's reach.
 */

const WATER = [
  BiomeIds.Ocean,
  BiomeIds.DeepOcean,
  BiomeIds.CoralReef,
  BiomeIds.KelpForest,
  BiomeIds.PolarOcean,
];
const SHORE = [BiomeIds.Beach, BiomeIds.RockyCoast, BiomeIds.Mangrove];
const WETLAND = [BiomeIds.Swamp, BiomeIds.Bog, BiomeIds.Mangrove];
const FOREST = [
  BiomeIds.Woodland,
  BiomeIds.TemperateForest,
  BiomeIds.TemperateRainforest,
  BiomeIds.TropicalRainforest,
  BiomeIds.TropicalSeasonalForest,
  BiomeIds.MontaneForest,
  BiomeIds.Taiga,
];
const COLD = [
  BiomeIds.Glacier,
  BiomeIds.Tundra,
  BiomeIds.AlpineTundra,
  BiomeIds.ColdDesert,
  BiomeIds.Taiga,
  BiomeIds.PolarOcean,
];
const ARID = [BiomeIds.Desert, BiomeIds.ColdDesert, BiomeIds.Badlands, BiomeIds.Steppe];
const VOLCANIC = [BiomeIds.Volcano, BiomeIds.Badlands];
const HIGHLAND = [BiomeIds.Mountain, BiomeIds.MontaneForest, BiomeIds.AlpineTundra];
const OPEN = [BiomeIds.Grassland, BiomeIds.Savanna, BiomeIds.Steppe, BiomeIds.Shrubland];

/**
 * The ground each of these belongs to. An item not listed is buried
 * everywhere.
 *
 * One line per item rather than one block per biome: what makes a
 * Water Stone a Water Stone is the list of shores it turns up on, and
 * that list is easier to keep right written in one place
 */
const GROUND_ITEMS: [item: Items, biomes: Biome[]][] = [
  // The stones, each in the landscape its element belongs to. A line
  // that asks for one asks the player to go and stand somewhere
  [ItemIds.FireStone, [...VOLCANIC, BiomeIds.Desert]],
  [ItemIds.WaterStone, [...WATER, ...SHORE]],
  [ItemIds.ThunderStone, [...OPEN, BiomeIds.Mountain]],
  [ItemIds.LeafStone, FOREST],
  [ItemIds.MoonStone, [...COLD, BiomeIds.Mountain]],
  [ItemIds.SunStone, [BiomeIds.Savanna, BiomeIds.Desert, BiomeIds.TropicalSeasonalForest]],
  // The rocks that hold a sky open, each dug out of the sky it holds
  [ItemIds.HeatRock, [...VOLCANIC, BiomeIds.Desert]],
  [ItemIds.DampRock, [...WETLAND, BiomeIds.TropicalRainforest, BiomeIds.TemperateRainforest]],
  [ItemIds.IcyRock, COLD],
  [ItemIds.SmoothRock, ARID],
  // What the tide leaves
  [ItemIds.ShoalSalt, [...SHORE, ...WATER]],
  [ItemIds.ShoalShell, [...SHORE, ...WATER]],
  [ItemIds.Pearl, [...WATER, ...SHORE]],
  [ItemIds.BigPearl, [...WATER, ...SHORE]],
  [ItemIds.PearlString, WATER],
  [ItemIds.SlowpokeTail, [...SHORE, BiomeIds.Swamp]],
  // What grows in the damp shade
  [ItemIds.TinyMushroom, [...FOREST, ...WETLAND]],
  [ItemIds.BigMushroom, [...FOREST, ...WETLAND]],
  [ItemIds.BalmMushroom, FOREST],
  // Old ground, where what died in it is still near the surface
  [ItemIds.RareBone, [...ARID, ...HIGHLAND, BiomeIds.Glacier]],
  // Clear skies, and what falls out of them
  [ItemIds.Stardust, [...ARID, ...COLD, ...OPEN]],
  [ItemIds.StarPiece, [...ARID, ...COLD]],
  [ItemIds.CometShard, [BiomeIds.Desert, BiomeIds.ColdDesert, BiomeIds.AlpineTundra]],
  // Blown along open ground and caught in the branches
  [ItemIds.PrettyWing, [...OPEN, ...HIGHLAND, ...FOREST]],
];

const HOMES = new Map<Items, Set<Biome>>(
  GROUND_ITEMS.map(([item, biomes]) => [item, new Set(biomes)]),
);

/** Which biomes hide this item, empty for one the whole world buries */
export function getItemBiomes(item: Items): Biome[] {
  return GROUND_ITEMS.find(([one]) => one === item)?.[1] ?? [];
}

/** Whether this ground hides this item, true for anything homeless */
export function isItemBuriedIn(item: Items, biome: Biome): boolean {
  const homes = HOMES.get(item);

  return homes == null || homes.has(biome);
}

const POOLS = new Map<Biome, ItemRarityGroups>();

function hereOnly(entries: ItemPoolEntry[], biome: Biome): ItemPoolEntry[] {
  return entries.filter((entry) => isItemBuriedIn(entry.item, biome));
}

/**
 * What a stash in this biome may hold: the shelf, less whatever
 * belongs to ground this is not.
 *
 * Weights are the shelf's, so an item is worth the same wherever it
 * is buried; what changes between biomes is which of them are in the
 * hat at all. Kept per biome once built, since a pool is read on
 * every cache a chunk rolls
 */
export function getItemPool(biome: Biome): ItemRarityGroups {
  const held = POOLS.get(biome);

  if (held != null) {
    return held;
  }

  const pool: ItemRarityGroups = {
    base: hereOnly(ITEM_POOL.base, biome),
    uncommon: hereOnly(ITEM_POOL.uncommon, biome),
    rare: hereOnly(ITEM_POOL.rare, biome),
    prized: hereOnly(ITEM_POOL.prized, biome),
    special: hereOnly(ITEM_POOL.special, biome),
  };

  POOLS.set(biome, pool);
  return pool;
}
