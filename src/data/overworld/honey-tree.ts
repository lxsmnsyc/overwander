import { type SpawnRarityGroups, pickSpawn } from '../biome/__create';
import { Species } from '../ids/species';

/** How many jars one lather takes */
export const LATHER_COST = 1;

/**
 * What a lathered tree draws out, banded by where each sits in its
 * line the way a biome pool is. Nothing listed here spawns in the wild:
 * a honey tree is the only way to meet them
 */
export const HONEY_TREE_POOL: SpawnRarityGroups = {
  // The grubs that come for the sweetness
  base: [
    { species: Species.Weedle, weight: 30 },
    { species: Species.Wurmple, weight: 30 },
    { species: Species.Teddiursa, weight: 20 },
  ],
  // The honey's own makers, and the ones that raid them for it
  uncommon: [
    { species: Species.Combee, weight: 22 },
    { species: Species.Burmy, weight: 20 },
    { species: Species.Aipom, weight: 12 },
  ],
  rare: [
    { species: Species.Kakuna, weight: 15 },
    { species: Species.Silcoon, weight: 15 },
    { species: Species.Cascoon, weight: 15 },
  ],
  // The beetles that drink the sap under the honey
  elusive: [
    { species: Species.Heracross, weight: 5 },
    { species: Species.Pinsir, weight: 5 },
  ],
  prized: [{ species: Species.Munchlax, weight: 1 }],
  special: [],
};

/** Every species a honey tree can draw out */
export const HONEY_TREE_SPECIES = new Set<Species>(
  Object.values(HONEY_TREE_POOL).flatMap((band: { species: Species }[] | undefined) =>
    (band ?? []).map((entry) => entry.species),
  ),
);

/** Which pokemon one lather draws out */
export function rollHoneyTree(random: () => number): Species | null {
  return pickSpawn(HONEY_TREE_POOL, random);
}
