import { Items } from '../ids/items';
import type { ItemRarityGroups } from './item-pool';

/**
 * What a berry patch grows, split by rarity the way a biome's spawn
 * pool is: the single-status cures are everyday finds, the ones that
 * restore something are scarcer, and the berries that answer more
 * than one problem at once are the rare picks
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
  ],
  rare: [{ item: Items.LumBerry, weight: 10 }],
  special: [{ item: Items.SitrusBerry, weight: 10 }],
};

export default BERRY_POOL;
