import type { Stats } from '../constants/stats';
import type { Types } from '../constants/types';
import type Abilities from '../ids/abilities';
import type Biome from '../ids/biome';
import type EggGroups from '../ids/egg-groups';
import type Families from '../ids/families';
import type { Items } from '../ids/items';
import type { Moves } from '../ids/moves';
import type { Species } from '../ids/species';

/**
 * One way a species evolves: the target species and the required
 * conditions (an EvolutionMethod bitfield with its parameters)
 */
export interface EvolutionData {
  /**
   * The species this pokemon evolves into
   */
  species: Species;
  /**
   * EvolutionMethod bitfield of the required conditions
   */
  method: number;
  /**
   * Level threshold (EvolutionMethod.Level)
   */
  level?: number;
  /**
   * The item used on or held by the pokemon
   * (EvolutionMethod.UsedItem / EvolutionMethod.HeldItem)
   */
  item?: Items;
}

export interface LearnSetData {
  level: Record<number, Moves[]>;
  teachable: Moves[];
  // TODO Breeding
}

export interface SpeciesData {
  /**
   * Pokedex number
   */
  dexNumber: number;
  /**
   * Pokemon name
   */
  name: string;
  /**
   * Pokemon category
   */
  category: string;
  /**
   * How tall the pokemon stands, in meters
   */
  height: number;
  /**
   * How heavy the pokemon is, in kilograms. Weight-driven moves read
   * it — a light target takes more from Low Kick, a heavy one more
   * from Grass Knot — so it is a battle number, not a dex flavor one
   */
  weight: number;
  /**
   * Family this pokemon belongs to
   */
  family: Families;
  /**
   * The species this pokemon evolves from, if any
   */
  evolvesFrom?: Species;
  /**
   * The evolutions available to this pokemon, if any
   */
  evolvesInto?: EvolutionData[];
  /**
   * Base stats of the pokemon
   */
  stats: Record<Stats, number>;
  /**
   * Primary (and secondary) types of this pokemon
   */
  types: Types[];
  /**
   * Possible regular abilities of this pokemon
   */
  abilities: Abilities[];
  /**
   * The rarer hidden ability, if the species has one
   */
  hiddenAbility?: Abilities;
  /**
   * Egg groups
   */
  eggGroups: EggGroups[];
  /**
   * Gender ratio
   */
  genderRatio: [male: number, female: number] | undefined;
  /**
   * Catch rate
   */
  catchRate: number;
  /**
   * Biomes this pokemon naturally spawns in
   */
  biomes: Biome[];
  /**
   * TimeOfDay bitfield of the day-cycle periods this pokemon is
   * active in
   */
  activeTimes: number;
  /**
   * Learn Set
   */
  learnSet: LearnSetData;
}

const SPECIES_MAP = new Map<Species, SpeciesData>();

/**
 * Lazily built biome -> species index; registration invalidates it
 * so re-registration cannot double-count
 */
let biomeIndex: Map<Biome, Species[]> | null = null;

/**
 * Lazily built list of every family that has a registered species;
 * registration invalidates it alongside the biome index
 */
let familyIndex: Families[] | null = null;

export function registerSpecies(species: Species, data: SpeciesData): void {
  SPECIES_MAP.set(species, data);
  biomeIndex = null;
  familyIndex = null;
}

/**
 * Every registered species, in registration (dex) order
 */
export function getRegisteredSpecies(): Species[] {
  return [...SPECIES_MAP.keys()];
}

/**
 * Every family with at least one registered species, in ascending
 * family order. The species day cycles through this list, so a
 * family with nothing behind it is never featured
 */
export function getRegisteredFamilies(): Families[] {
  familyIndex ??= [...new Set([...SPECIES_MAP.values()].map((data) => data.family))].sort(
    (left, right) => left - right,
  );
  return familyIndex;
}

/**
 * Every registered species that naturally spawns in the biome, in
 * registration (dex) order
 */
export function getSpeciesByBiome(biome: Biome): Species[] {
  if (biomeIndex == null) {
    biomeIndex = new Map();

    for (const [species, data] of SPECIES_MAP) {
      for (const home of data.biomes) {
        const list = biomeIndex.get(home);

        if (list) {
          list.push(species);
        } else {
          biomeIndex.set(home, [species]);
        }
      }
    }
  }
  return biomeIndex.get(biome) ?? [];
}

export function getSpeciesData(species: Species): SpeciesData {
  const result = SPECIES_MAP.get(species);
  if (result) {
    return result;
  }
  throw new Error('Missing species data for ' + species);
}

export interface SpeciesAbilityPools {
  regular: Abilities[];
  hidden: Abilities[];
}

/**
 * The species' rollable ability pools: its own regular and hidden
 * abilities plus its pre-evolutions', deduplicated in chain order
 */
export function getSpeciesAbilityPools(species: Species): SpeciesAbilityPools {
  const regular = new Set<Abilities>();
  const hidden = new Set<Abilities>();

  let current: Species | undefined = species;
  while (current != null) {
    const data = getSpeciesData(current);

    for (const ability of data.abilities) {
      regular.add(ability);
    }
    if (data.hiddenAbility != null) {
      hidden.add(data.hiddenAbility);
    }

    current = data.evolvesFrom;
  }

  return { regular: [...regular], hidden: [...hidden] };
}

/**
 * Every ability the species can learn: its own set plus its
 * pre-evolutions' sets, walked up the evolution chain
 */
export function getSpeciesAbilities(species: Species): Set<Abilities> {
  const abilities = new Set<Abilities>();

  let current: Species | undefined = species;
  while (current != null) {
    const data = getSpeciesData(current);

    for (const ability of data.abilities) {
      abilities.add(ability);
    }
    if (data.hiddenAbility != null) {
      abilities.add(data.hiddenAbility);
    }

    current = data.evolvesFrom;
  }

  return abilities;
}
