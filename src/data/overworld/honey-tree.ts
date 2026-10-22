import { SPAWN_BAND_KEYS, type SpawnRarityGroups, pickSpawn, spawnBand } from '../biome/__create';
import { readSpawnGroups } from '../biome/yaml';
import type { Species } from '../ids/species';
import poolFile from './honey-tree.yaml';

/** How many jars one lather takes */
export const LATHER_COST = 1;

/**
 * The floor under every value of what a lather draws out, since the
 * jar was paid for. The phenomenon's number, and it stacks with a
 * favouring sky
 */
export const HONEY_TREE_MIN_IV = 9;

/** What a lathered tree draws out, written in `honey-tree.yaml` */
export const HONEY_TREE_POOL: SpawnRarityGroups = readSpawnGroups(poolFile, 'honey-tree.yaml');

/** Every species a honey tree can draw out */
export const HONEY_TREE_SPECIES = new Set<Species>();

for (const band of SPAWN_BAND_KEYS) {
  for (const entry of spawnBand(HONEY_TREE_POOL, band)) {
    HONEY_TREE_SPECIES.add(entry.species);
  }
}

/** Which pokemon one lather draws out */
export function rollHoneyTree(random: () => number): Species | null {
  return pickSpawn(HONEY_TREE_POOL, random);
}
