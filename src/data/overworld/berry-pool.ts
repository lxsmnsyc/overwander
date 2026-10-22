import poolFile from './berry-pool.yaml';
import { type ItemRarityGroups, readItemPool } from './item-pool';

/**
 * What a berry patch grows, split by rarity the way a biome's spawn
 * pool is. Written in `berry-pool.yaml`
 */
const BERRY_POOL: ItemRarityGroups = readItemPool(poolFile, 'berry-pool.yaml');

export default BERRY_POOL;
