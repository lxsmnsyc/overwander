import type Biome from '../ids/biome';
import { TimeOfDay } from '../ids/biome';
import type Families from '../ids/families';
import { Species, UNOWN_FORMS } from '../ids/species';
import type { Types } from '../constants/types';
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
  /**
   * Between rare and special: the species a walk is lucky to meet but
   * that are not one-per-world — the babies, and the unowns.
   *
   * It is **optional** on purpose. Gen 1 has neither, so every pool
   * registered today would carry an empty line saying so; a biome
   * that has nothing prized simply does not mention the band, and a
   * later gen adds it to the pools it belongs in
   */
  prized?: SpawnEntry[];
  special: SpawnEntry[];
}

/**
 * One band of a pool, whether or not the pool bothered to list it
 */
export function spawnBand(groups: SpawnRarityGroups, band: keyof SpawnRarityGroups): SpawnEntry[] {
  return groups[band] ?? [];
}

/**
 * A biome's spawn entries for each day-cycle period
 */
export type SpawnPool = { [key in TimeOfDay]: SpawnRarityGroups };

const EMPTY_GROUPS: SpawnRarityGroups = { base: [], uncommon: [], rare: [], special: [] };

const SPAWN_POOLS = new Map<Biome, SpawnPool>();

/**
 * The pools read backwards: which species is in which of them. Built
 * the first time a dex asks and thrown away whenever a pool is
 * registered — see `listSpeciesHabitats`
 */
let habitatIndex: Map<Species, SpeciesHabitat[]> | null = null;

export function registerSpawnPool(biome: Biome, pool: SpawnPool): void {
  SPAWN_POOLS.set(biome, pool);
  habitatIndex = null;
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
    prized: boostFamilyEntries(spawnBand(groups, 'prized'), family, factor),
    special: boostFamilyEntries(groups.special, family, factor),
  };
}

/**
 * One list of entries with a set of types weighted more heavily. It
 * is what a sky does to a pool: rain crowds the chunk with what rain
 * is about, and leaves the rest of it where it stands
 */
export function boostTypeEntries(
  entries: SpawnEntry[],
  types: Types[],
  factor: number,
): SpawnEntry[] {
  if (types.length === 0) {
    return entries;
  }

  const favored = new Set(types);

  return entries.map((entry) =>
    getSpeciesData(entry.species).types.some((type) => favored.has(type))
      ? { species: entry.species, weight: entry.weight * factor }
      : entry,
  );
}

/**
 * The same pool with the types a sky favours weighted more heavily.
 *
 * The bands do not move, the way they do not for a species day: a
 * favoured rare stays rare and wins its band more often. A sky that
 * favours nothing, or everything, hands the pool back untouched,
 * since lifting every entry by the same factor is the pool it started
 * with
 */
export function boostTypeWeights(
  groups: SpawnRarityGroups,
  types: Types[],
  factor: number,
): SpawnRarityGroups {
  return {
    base: boostTypeEntries(groups.base, types, factor),
    uncommon: boostTypeEntries(groups.uncommon, types, factor),
    rare: boostTypeEntries(groups.rare, types, factor),
    prized: boostTypeEntries(spawnBand(groups, 'prized'), types, factor),
    special: boostTypeEntries(groups.special, types, factor),
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
 * three ordinary bands are reduced once rather than at every roll:
 * every entry walks back to its base species and the weights that meet
 * there are added. The distribution is unchanged; the caller is left
 * with one draw over one list.
 *
 * The **special** band is left out because a legendary has no nest,
 * and the **prized** one because a baby is already the first stage of
 * its line and would be counted twice. That leaves out the unown,
 * which has no line to walk back along: it is met rather than hatched.
 * A line whose baby the game has yet to register is left out too, for
 * the reason `AWAITING_BABY_SPECIES` gives
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

      // A line whose first stage is a baby the game does not have yet
      // would hatch as its second, which is the one thing an egg
      // never is
      if (isAwaitingBaby(egg)) {
        continue;
      }
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
   * Fully-evolved and single-line species
   */
  Rare = 2,
  /**
   * The babies and the unowns: species a walk is lucky to meet, but
   * that a player may meet more than one of. Rarer than a fully-evolved
   * spawn by eight, commoner than a legendary by eight
   */
  Prized = 3,
  /**
   * Mythicals, legendaries and other one-per-world class species
   */
  Special = 4,
}

/**
 * Which rarity each band of a pool is, in the order a dex reads them:
 * commonest first, so a species listed in several biomes is described
 * by the easiest place to meet it before the hardest
 */
const BAND_RARITIES: [band: keyof SpawnRarityGroups, rarity: SpawnRarity][] = [
  ['base', SpawnRarity.Base],
  ['uncommon', SpawnRarity.Uncommon],
  ['rare', SpawnRarity.Rare],
  ['prized', SpawnRarity.Prized],
  ['special', SpawnRarity.Special],
];

/**
 * Every period of the day, in the order a day runs through them
 */
export const TIMES_OF_DAY: TimeOfDay[] = [
  TimeOfDay.Morning,
  TimeOfDay.Day,
  TimeOfDay.Evening,
  TimeOfDay.Night,
];

/**
 * One place and hour a species can be met, and how lucky a walk has to
 * be to meet it there
 */
export interface SpeciesHabitat {
  biome: Biome;
  time: TimeOfDay;
  rarity: SpawnRarity;
}

/**
 * Every other reader of a pool asks "what lives here" — a chunk is
 * being populated, and the biome is what it starts from. A dex asks the
 * opposite question, and answering it by walking every pool of every
 * biome at every hour is a sweep of the whole registry, so it is swept
 * once and kept
 */
function buildHabitats(): Map<Species, SpeciesHabitat[]> {
  const found = new Map<Species, SpeciesHabitat[]>();

  for (const [biome, pool] of SPAWN_POOLS) {
    for (const time of TIMES_OF_DAY) {
      const groups = pool[time];

      for (const [band, rarity] of BAND_RARITIES) {
        for (const entry of spawnBand(groups, band)) {
          const places = found.get(entry.species) ?? [];

          places.push({ biome, time, rarity });
          found.set(entry.species, places);
        }
      }
    }
  }
  return found;
}

/**
 * Everywhere this species is met in the wild, as the dex lists it.
 *
 * A species is listed once per biome, hour and band it appears in, so
 * something that lives in a grassland all day answers four entries and
 * something that only comes out at night answers one. A species that
 * spawns nowhere — a legendary staged by a lair, a mythical called by
 * a relic, an evolution that is never met in the wild — answers an
 * empty list, which is the honest answer rather than a missing one
 */
export function listSpeciesHabitats(species: Species): SpeciesHabitat[] {
  habitatIndex ??= buildHabitats();
  return habitatIndex.get(species) ?? [];
}

export const UNCOMMON_SPAWN_ODDS = 1 / 8;
export const RARE_SPAWN_ODDS = 1 / 64;
export const PRIZED_SPAWN_ODDS = 1 / 512;
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
  Species.Raikou,
  Species.Entei,
  Species.Suicune,
  Species.Lugia,
  Species.HoOh,
  Species.Regirock,
  Species.Regice,
  Species.Registeel,
  Species.Latias,
  Species.Latios,
  Species.Kyogre,
  Species.Groudon,
  Species.Rayquaza,
]);

/**
 * Mythicals: special-tier, and never staged by the world. A landmark
 * will not roll one — the only way to face a mythical is to carry the
 * relic that calls it, which is what a raid item is
 */
const MYTHICAL_SPECIES = new Set<Species>([Species.Mew, Species.Celebi, Species.Deoxys]);

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
 * Babies: the first stage of a line that a later gen put in front of
 * what used to be the first stage. They can still evolve, so nothing
 * about the shape of their line would place them — a baby reads as an
 * ordinary Base species — and meeting one in the wild is meant to be
 * a story. Gen 1 has none; future gens register theirs here
 */
const BABY_SPECIES = new Set<Species>([
  Species.Pichu,
  Species.Cleffa,
  Species.Igglybuff,
  Species.Togepi,
  Species.Tyrogue,
  Species.Smoochum,
  Species.Elekid,
  Species.Magby,
]);

/**
 * The unowns. One species wearing many faces, and the point of it is
 * the hunt: a walk turns one up rarely enough that the letters are
 * collected over months
 */
const UNOWN_SPECIES = new Set<Species>(UNOWN_FORMS);

/**
 * The unowns as prized-band entries, for a pool to spread into its
 * own. They stand in **every** biome and at equal weight, so which
 * letter turns up is the roll and where it was walked is not: the
 * alphabet is collected over months either way, and no letter is
 * cheaper because of where the player happens to live
 */
export const UNOWN_SPAWNS: SpawnEntry[] = UNOWN_FORMS.map((species) => ({ species, weight: 1 }));

/**
 * What one prized species weighs against the alphabet.
 *
 * The unowns are twenty-eight entries and **one pokemon**, so they
 * are weighted 1 apiece and everything else in the band is weighted
 * by how many of them there are: a Pichu and the whole alphabet are
 * then drawn as often as each other, which is what the band would
 * have said if an unown were one species with a costume
 */
export const PRIZED_WEIGHT = UNOWN_SPAWNS.length;

/**
 * Species whose baby the game does not have yet.
 *
 * A nest lays the first stage of a line, and for these that stage is
 * a pokemon a later gen put in front of them: a Pikachu hatches from
 * a Pichu, not from a Pikachu. Until the baby is registered the walk
 * back stops one stage short and the nest lays the wrong thing, and
 * an egg already laid keeps the answer it was laid under. So they are
 * left out of nests rather than hatched as themselves.
 *
 * Every entry leaves this list the moment its baby is registered.
 * They are still met in the wild, still bred and still evolved: this
 * is about what a nest holds and nothing else
 */
const AWAITING_BABY_SPECIES = new Set<Species>([
  // Gen 3 babies
  Species.Marill,
  Species.Wobbuffet,
  // Gen 4 babies
  Species.Sudowoodo,
  Species.Mantine,
  Species.Chansey,
  Species.MrMime,
  Species.Snorlax,
]);

/**
 * Whether the species hatches from something the game has not
 * registered yet, which is what keeps it out of a nest
 */
export function isAwaitingBaby(species: Species): boolean {
  return AWAITING_BABY_SPECIES.has(species);
}

/**
 * Whether the species is one of the prized band's — a baby or an
 * unown. Both are listed rather than derived, because neither is
 * anything the shape of a line can be read off
 */
export function isPrizedSpecies(species: Species): boolean {
  return BABY_SPECIES.has(species) || UNOWN_SPECIES.has(species);
}

export function getSpawnRarity(species: Species): SpawnRarity {
  if (SPECIAL_SPECIES.has(species)) {
    return SpawnRarity.Special;
  }
  // Asked before the shape of the line is, since a baby evolves like
  // any other first stage and would otherwise read as Base
  if (isPrizedSpecies(species)) {
    return SpawnRarity.Prized;
  }

  const data = getSpeciesData(species);

  if (data.evolvesInto == null) {
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
 * The bands a spawn roll walks, richest first, with the width of each
 * one's slice of the draw. They are widths rather than running
 * totals, so a band added between two others takes its share out of
 * **base** and leaves every other band as wide as it was
 */
const SPAWN_BANDS: [band: keyof SpawnRarityGroups, odds: number][] = [
  ['special', SPECIAL_SPAWN_ODDS],
  ['prized', PRIZED_SPAWN_ODDS],
  ['rare', RARE_SPAWN_ODDS],
  ['uncommon', UNCOMMON_SPAWN_ODDS],
];

/**
 * Roll one spawn from a period's rarity groups: the first draw picks
 * the band (1/4096 special, 1/512 prized, 1/64 rare, 1/8 uncommon,
 * base otherwise), the second draw picks within the band by weight.
 *
 * A roll landing in a band this biome keeps nothing in falls to the
 * next band down rather than to base, which is what lets most biomes
 * leave the prized band out altogether and still roll their rares
 */
export function pickSpawn(groups: SpawnRarityGroups, random: () => number): Species | null {
  const roll = random();
  let edge = 0;

  for (const [band, odds] of SPAWN_BANDS) {
    edge += odds;

    const tier = spawnBand(groups, band);

    if (roll < edge && tier.length > 0) {
      return pickFromEntries(tier, random);
    }
  }
  return pickFromEntries(groups.base, random);
}
