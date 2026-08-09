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
   * Possible abilities of this pokemon
   */
  abilities: Abilities[];
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

  // TODO
  // Height
  // Weight
}

const SPECIES_MAP = new Map<Species, SpeciesData>();

export function registerSpecies(species: Species, data: SpeciesData): void {
  SPECIES_MAP.set(species, data);
}

export function getSpeciesData(species: Species): SpeciesData {
  const result = SPECIES_MAP.get(species);
  if (result) {
    return result;
  }
  throw new Error('Missing species data for ' + species);
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

    current = data.evolvesFrom;
  }

  return abilities;
}
