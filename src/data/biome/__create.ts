import type Biome from '../ids/biome';
import type { TimeOfDay } from '../ids/biome';
import type Families from '../ids/families';
import { Species } from '../ids/species';
import { getBaseSpecies, getSpeciesData } from '../species';

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

/**
 * One list of entries with a family's weighted more heavily. It is the
 * whole of what a species day does to a pool, and it works the same on
 * a rarity band as on the flat egg pool below
 */
export function boostFamilyEntries(
  entries: SpawnEntry[],
  family: Families,
  factor: number,
): SpawnEntry[] {
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
    base: boostFamilyEntries(groups.base, family, factor),
    uncommon: boostFamilyEntries(groups.uncommon, family, factor),
    rare: boostFamilyEntries(groups.rare, family, factor),
    special: boostFamilyEntries(groups.special, family, factor),
  };
}

/**
 * Built once per pool and kept against the pool itself, since a pool
 * is registered once and read for the life of the process. A
 * re-registered biome hands back a new object and so gets a new egg
 * pool with it
 */
const EGG_POOLS = new WeakMap<SpawnRarityGroups, SpawnEntry[]>();

/**
 * What a nest in this biome may be holding, as a single weighted list.
 *
 * A nest lays the **first stage** of whatever line it drew, so the
 * three ordinary bands are worth reducing once rather than at every
 * roll: every entry is walked back to its base species and the weights
 * of everything that walks back to the same egg are added together. A
 * biome where four evolutions of one line spawn is a biome where that
 * egg is four times as likely, which is what it already meant.
 *
 * The **special** band is left out entirely: a legendary has no nest,
 * and a mythical is called with a relic or not at all.
 *
 * The distribution is exactly the merged bands' — only the shape is
 * simpler, and the caller is left with one draw over one list
 */
export function getEggPool(biome: Biome, time: TimeOfDay): SpawnEntry[] {
  const groups = getSpawnPool(biome, time);
  const built = EGG_POOLS.get(groups);

  if (built != null) {
    return built;
  }

  const weights = new Map<Species, number>();

  for (const band of [groups.base, groups.uncommon, groups.rare]) {
    for (const entry of band) {
      const egg = getBaseSpecies(entry.species);

      weights.set(egg, (weights.get(egg) ?? 0) + entry.weight);
    }
  }

  const pool = [...weights].map(([species, weight]) => ({ species, weight }));

  EGG_POOLS.set(groups, pool);
  return pool;
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
 * Mythicals: special-tier, and never staged by the world. A landmark
 * will not roll one — the only way to face a mythical is to carry the
 * relic that calls it, which is what a raid item is
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
 * Whether the species is a mythical — the only kind a raid item may
 * call. A legendary answers false: those are the world's to stage
 */
export function isMythicalSpecies(species: Species): boolean {
  return MYTHICAL_SPECIES.has(species);
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
 * One species out of a weighted list. Answers null for an empty one,
 * so a caller can hand over whatever it has without checking first
 */
export function pickFromEntries(entries: SpawnEntry[], random: () => number): Species | null {
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
      return entry.species;
    }
  }
  return entries[entries.length - 1].species;
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
  return pickFromEntries(tier, random);
}
