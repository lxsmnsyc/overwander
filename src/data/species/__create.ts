import type { Stats } from '../constants/stats';
import type { Types } from '../constants/types';
import type { Abilities } from '../ids/abilities';
import type { EggGroups } from '../ids/egg-groups';
import type { Families } from '../ids/families';
import type { Moves } from '../ids/moves';
import type { Species } from '../ids/species';

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
   * Learn Set
   */
  learnSet: LearnSetData;

  // TODO
  // Biome
  // Height
  // Weight
}

const SPECIES_MAP = new Map<Species, SpeciesData>();

export function registerSpecies(species: Species, data: SpeciesData) {
  SPECIES_MAP.set(species, data);
}

export function getSpeciesData(species: Species): SpeciesData {
  const result = SPECIES_MAP.get(species);
  if (result) {
    return result;
  }
  throw new Error('Missing species data for ' + species);
}
