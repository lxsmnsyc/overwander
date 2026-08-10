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
  /**
   * Moves a hatchling can only come by from its parents — the ones it
   * never learns by levelling and no machine teaches.
   *
   * Breeding arrived a generation after these species did, so the
   * lists are the ones their lines were first given, kept to the
   * moves this registry actually holds: an egg move belonging to a
   * later generation has nothing here to name.
   *
   * A line's moves sit on its **base stage**, the way the games list
   * them — an evolution inherits what it hatched with rather than
   * having a list of its own — and a species that cannot breed has
   * none at all
   */
  egg?: Moves[];
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
/**
 * The moves a species can only inherit. Answers an empty list for the
 * many that inherit nothing — an evolution, a legendary, a species
 * with no known eggs
 */
export function getEggMoves(species: Species): Moves[] {
  return getSpeciesData(species).learnSet.egg ?? [];
}

/**
 * The stage a line hatches at: the species itself when nothing
 * evolves into it, and otherwise the far end of its `evolvesFrom`
 * chain. An egg is always the first stage of its line, and a line's
 * egg moves are listed there, so this is what a nest lays whatever
 * the biome happened to roll
 */
export function getBaseSpecies(species: Species): Species {
  let current = species;
  let previous = getSpeciesData(current).evolvesFrom;

  // A chain long enough to loop would be a data error rather than a
  // species; the walk is bounded by the registry either way
  while (previous != null && previous !== current) {
    current = previous;
    previous = getSpeciesData(current).evolvesFrom;
  }
  return current;
}

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
