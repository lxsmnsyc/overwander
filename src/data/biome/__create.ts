import type Biome from '../ids/biome';
import type { TimeOfDay } from '../ids/biome';
import type Families from '../ids/families';
import { Species } from '../ids/species';
import { getSpeciesData } from '../species';

/**
 * One weighted slot of a biome's spawn pool
 */
export interface SpawnEntry {
  species: Species;
  weight: number;
}

/**
 * One day-cycle period's spawn entries, split by rarity band
 */
export interface SpawnRarityGroups {
  base: SpawnEntry[];
  uncommon: SpawnEntry[];
  rare: SpawnEntry[];
  special: SpawnEntry[];
}

/**
 * A biome's spawn entries for each day-cycle period
 */
export type SpawnPool = { [key in TimeOfDay]: SpawnRarityGroups };

const EMPTY_GROUPS: SpawnRarityGroups = { base: [], uncommon: [], rare: [], special: [] };

const SPAWN_POOLS = new Map<Biome, SpawnPool>();

export function registerSpawnPool(biome: Biome, pool: SpawnPool): void {
  SPAWN_POOLS.set(biome, pool);
}

export function getSpawnPool(biome: Biome, time: TimeOfDay): SpawnRarityGroups {
  return SPAWN_POOLS.get(biome)?.[time] ?? EMPTY_GROUPS;
}

function boostBand(entries: SpawnEntry[], family: Families, factor: number): SpawnEntry[] {
  return entries.map((entry) =>
    getSpeciesData(entry.species).family === family
      ? { species: entry.species, weight: entry.weight * factor }
      : entry,
  );
}

/**
 * The same pool with one family's entries weighted more heavily —
 * how the species day crowds its family into the spawns. The bands
 * themselves do not move: a featured rare stays rare, it just wins
 * its band more often. Returns the pool untouched when nothing of
 * the family lives here
 */
export function boostFamilyWeights(
  groups: SpawnRarityGroups,
  family: Families,
  factor: number,
): SpawnRarityGroups {
  return {
    base: boostBand(groups.base, family, factor),
    uncommon: boostBand(groups.uncommon, family, factor),
    rare: boostBand(groups.rare, family, factor),
    special: boostBand(groups.special, family, factor),
  };
}

export const enum SpawnRarity {
  /**
   * Unevolved species that can still evolve: they share the odds
   * left over from the rarer tiers, split by their pool weights
   */
  Base = 0,
  /**
   * Middle evolutions: evolved, but not the end of their line
   */
  Uncommon = 1,
  /**
   * Fully-evolved, baby and single-line species
   */
  Rare = 2,
  /**
   * Mythicals, legendaries and other one-per-world class species
   */
  Special = 3,
}

export const UNCOMMON_SPAWN_ODDS = 1 / 8;
export const RARE_SPAWN_ODDS = 1 / 64;
export const SPECIAL_SPAWN_ODDS = 1 / 4096;

/**
 * The one-per-world class: Gen 1 legendaries and Mew. Future gens
 * add their legendaries, mythicals, unowns, ultra beasts and
 * paradoxes here
 */
/**
 * Legendaries: the special-tier species a raid can stage. Mythicals
 * are deliberately not here — they are gifts, not encounters
 */
const LEGENDARY_SPECIES = new Set<Species>([
  Species.Articuno,
  Species.Zapdos,
  Species.Moltres,
  Species.Mewtwo,
]);

/**
 * Mythicals: special-tier, but never raidable
 */
const MYTHICAL_SPECIES = new Set<Species>([Species.Mew]);

const SPECIAL_SPECIES = new Set<Species>([...LEGENDARY_SPECIES, ...MYTHICAL_SPECIES]);

/**
 * Whether the species is a legendary, the only kind a legendary raid
 * will stage. Placeholders (Missingno, Egg, Substitute) and
 * mythicals answer false
 */
export function isLegendarySpecies(species: Species): boolean {
  return LEGENDARY_SPECIES.has(species);
}

/**
 * Babies can still evolve yet spawn at Rare odds; Gen 1 has none,
 * future gens register theirs here
 */
const BABY_SPECIES = new Set<Species>();

export function getSpawnRarity(species: Species): SpawnRarity {
  if (SPECIAL_SPECIES.has(species)) {
    return SpawnRarity.Special;
  }

  const data = getSpeciesData(species);

  if (BABY_SPECIES.has(species) || data.evolvesInto == null) {
    return SpawnRarity.Rare;
  }
  if (data.evolvesFrom != null) {
    return SpawnRarity.Uncommon;
  }
  return SpawnRarity.Base;
}

/**
 * Roll one spawn from a period's rarity groups: the first draw picks
 * the band (1/4096 special, 1/64 rare, 1/8 uncommon, base otherwise,
 * falling back to base when the rolled band is empty here), the
 * second draw picks within the band by weight
 */
export function pickSpawn(groups: SpawnRarityGroups, random: () => number): Species | null {
  const band = random();
  let tier = groups.base;

  if (band < SPECIAL_SPAWN_ODDS && groups.special.length > 0) {
    tier = groups.special;
  } else if (band < SPECIAL_SPAWN_ODDS + RARE_SPAWN_ODDS && groups.rare.length > 0) {
    tier = groups.rare;
  } else if (
    band < SPECIAL_SPAWN_ODDS + RARE_SPAWN_ODDS + UNCOMMON_SPAWN_ODDS &&
    groups.uncommon.length > 0
  ) {
    tier = groups.uncommon;
  }
  if (tier.length === 0) {
    return null;
  }

  let total = 0;
  for (const entry of tier) {
    total += entry.weight;
  }

  let target = random() * total;
  for (const entry of tier) {
    target -= entry.weight;
    if (target < 0) {
      return entry.species;
    }
  }
  return tier[tier.length - 1].species;
}
