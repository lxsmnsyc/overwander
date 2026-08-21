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
   * Whether this is the species' **default form** rather than a
   * variant of it: an Alolan Vulpix, a Galarian Meowth, a Mega
   * Charizard and a Rotom in a washing machine are all forms of a
   * species whose base form is something else.
   *
   * It is not about evolution. A Charizard is a base form and so is a
   * Charmander; what makes one of them different is `evolvesFrom`,
   * which answers that question already.
   *
   * The field is **optional and true when absent**, because every
   * species registered today is a default form — Gen 1 has no variants
   * — and a hundred and fifty-one lines saying so would be a hundred
   * and fifty-one places for the exception to hide. A later
   * generation's variant writes `baseForm: false`, and everything that
   * counts a dex or fills a pool asks `isBaseForm` rather than reading
   * the field
   */
  baseForm?: boolean;
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

/**
 * What each family is called, worked out the first time it is asked
 * for. See `getFamilyName`
 */
const familyNames = new Map<Families, string>();

export function registerSpecies(species: Species, data: SpeciesData): void {
  SPECIES_MAP.set(species, data);
  biomeIndex = null;
  familyIndex = null;
  // A line that has just gained a member may have gained a new base
  // stage, and the name is that stage's
  familyNames.clear();
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

/**
 * Whether the species is a default form rather than a variant of
 * another one. A registration that says nothing is one: variants are
 * the exception, and the exception is what gets written down
 */
export function isBaseForm(species: Species): boolean {
  return getSpeciesData(species).baseForm !== false;
}

/**
 * Every registered species that is a default form, in registration
 * order. It is what a dex is counted against — one row per pokemon
 * rather than one per costume — and what a pool draws from where the
 * variant would be wrong to stage
 */
export function getBaseForms(): Species[] {
  return [...SPECIES_MAP.keys()].filter((species) => isBaseForm(species));
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
 * Every move the species can ever come by: what it levels into, what a
 * machine teaches it and what it can only inherit.
 *
 * It is what "could this pokemon know that?" means, which is a
 * different question from what it knows — see `getLevelUpMoves` for
 * the half of it that depends on how far it has grown
 */
export function getLearnableMoves(species: Species): Moves[] {
  const { level, teachable, egg } = getSpeciesData(species).learnSet;

  return [...new Set([...Object.values(level).flat(), ...teachable, ...(egg ?? [])])];
}

/**
 * What the species learns on reaching exactly that level, in the order
 * the entry lists them. A level with nothing on it answers an empty
 * list.
 *
 * This is the moment a level-up move is offered — a pokemon that has
 * just grown into one is asked whether it wants it. Anything older
 * than the level it now sits at is gone until the Move Reminder, which
 * is what `getRecallableMoves` is for
 */
export function getMovesLearnedAt(species: Species, level: number): Moves[] {
  return getSpeciesData(species).learnSet.level[level] ?? [];
}

/**
 * Everything the species learns by levelling, up to and including a
 * level, in the order it learns them.
 *
 * It is the whole list rather than the last four: a pokemon only ever
 * *knows* four, and what this answers is what it could have known — a
 * move learned at level 12 and dropped at level 20 is still on it. The
 * Move Reminder is what the difference between the two is for.
 *
 * A threshold listing a move twice, or two thresholds listing the same
 * move, yield it once, at the earliest of them
 */
export function getLevelUpMoves(species: Species, level: number): Moves[] {
  const { level: learned } = getSpeciesData(species).learnSet;

  return [
    ...new Set(
      Object.keys(learned)
        .map(Number)
        .filter((threshold) => threshold <= level)
        .sort((a, b) => a - b)
        .flatMap((threshold) => learned[threshold]),
    ),
  ];
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

/**
 * The name a family is known by, derived rather than written down.
 *
 * A family is a line of pokemon, and a line is called after what it
 * starts as — a Charmander's candy is a Charmander's candy whether it
 * is being fed to a Charmeleon or a Charizard. So the name is the
 * **base species** of the line: found by walking any member of it back
 * to the stage it hatches at, which is the same answer whichever
 * member is asked.
 *
 * It is derived because the alternative is a second list of eighty
 * names beside the enum that already holds them, kept in step by hand.
 * A family with nothing registered under it has no name to give and
 * says so with its number, which is the honest answer for a line the
 * game does not have yet
 */
export function getFamilyName(family: Families): string {
  const known = familyNames.get(family);

  if (known != null) {
    return known;
  }

  for (const species of SPECIES_MAP.keys()) {
    if (getSpeciesData(species).family === family) {
      const name = getSpeciesData(getBaseSpecies(species)).name;

      familyNames.set(family, name);
      return name;
    }
  }
  return `Family #${family}`;
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
