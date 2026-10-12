import * as v from 'valibot';
import { STAT_NAMES, Stats } from '../constants/stats';
import type { Types } from '../constants/types';
import type Abilities from '../ids/abilities';
import type Biome from '../ids/biome';
import { AnyTimeOfDay } from '../ids/biome';
import type EggGroups from '../ids/egg-groups';
import type { Moves } from '../ids/moves';
import {
  ABILITY_IDS,
  BIOME_IDS,
  EGG_GROUP_IDS,
  EVOLUTION_METHOD_IDS,
  FAMILY_IDS,
  GENDER_IDS,
  HABITAT_IDS,
  ITEM_IDS,
  MOVE_IDS,
  NATURE_IDS,
  SPECIES_IDS,
  STAT_IDS,
  TIME_OF_DAY_IDS,
  TYPE_IDS,
} from '../ids/names';
import { type Species, speciesDexNumber, speciesFormIndex } from '../ids/species';
import { flagsOf, idOf, idsOf } from '../yaml';
import type {
  EvolutionData,
  LearnSetData,
  SpeciesData,
  StatComparison,
  WildHeldItems,
} from './__create';

/**
 * The species, read out of their YAML.
 *
 * Each field lives in a folder of its own, so a part of the record can
 * be loaded without the rest. Within a field, a region's families are
 * filed in blocks of 25 dex numbers (`kanto/051-075.yaml`), each family
 * keyed by its own name with its species beneath it:
 *
 * - `world/` is what the overworld reads: types, habitat, evolutions,
 *   egg groups, biomes, the hours it is about, what a wild one holds,
 *   and its rank where the shape of its line cannot say it
 * - `stats/` holds base stats, catch rate, size, gender ratio and,
 *   where it differs, its egg cycles
 * - `abilities/` holds the ability pools
 * - `learnsets/` holds the moves it learns by level, machine and egg
 * - `text/<locale>/species/` holds each name and category, filed the
 *   same way
 *
 * A file names things the way the code does (`Arcanine`, `FireStone`),
 * and every name is checked here against the enum it belongs to, so a
 * typo fails the moment the data loads rather than in a fight
 */

const NAME = v.string();
const NAMES = v.array(NAME);
const COUNT = v.pipe(v.number(), v.minValue(0));

const WORLD = v.object({
  types: NAMES,
  'egg-groups': NAMES,
  habitat: v.optional(NAME),
  biomes: v.optional(NAMES, []),
  active: v.union([v.literal('any'), NAMES]),
  'base-form': v.optional(v.boolean()),
  worn: v.optional(v.boolean()),
  dex: v.optional(COUNT),
  'evolves-from': v.optional(NAME),
  'evolves-into': v.optional(
    v.array(
      v.object({
        species: NAME,
        method: NAMES,
        level: v.optional(COUNT),
        item: v.optional(NAME),
        partner: v.optional(NAME),
        time: v.optional(NAMES),
        gender: v.optional(NAME),
        move: v.optional(NAME),
        natures: v.optional(NAMES),
        compare: v.optional(
          v.object({
            stat: NAME,
            against: NAME,
            order: v.picklist(['greater', 'lesser', 'equal']),
          }),
        ),
        shed: v.optional(v.boolean()),
      }),
    ),
  ),
  'egg-species': v.optional(NAME),
  held: v.optional(
    v.object({ common: v.optional(NAME), uncommon: v.optional(NAME), rare: v.optional(NAME) }),
  ),
  rank: v.optional(v.picklist(['legendary', 'mythical', 'baby', 'prized', 'mythical-odds'])),
  awaiting: v.optional(v.picklist(['baby', 'evolution'])),
});

const STATS = v.object({
  stats: v.record(NAME, COUNT),
  'catch-rate': COUNT,
  height: COUNT,
  weight: COUNT,
  gender: v.union([v.literal('genderless'), v.tuple([COUNT, COUNT])]),
  'egg-cycles': v.optional(COUNT),
});

const ABILITIES = v.object({
  abilities: NAMES,
  hidden: v.optional(NAMES),
});

const LEARNSET = v.object({
  level: v.optional(v.record(v.string(), NAMES), {}),
  teachable: v.optional(NAMES, []),
  egg: v.optional(NAMES),
});

const TEXT = v.object({ name: v.string(), category: v.string() });

/** The key a learnsets file keeps the teachable moves its whole family shares under */
export const FAMILY_TEACHABLE_KEY = 'family-teachable';

/** Where one species' part was written: the file and the family it sits under */
interface Written {
  where: string;
  family: string;
  part: unknown;
}

const FAMILIES = v.record(NAME, v.record(NAME, v.unknown()));

/**
 * One field's files, merged into one map from species name to its
 * part. A file holds a block of families, each keyed by its own name
 * with its species beneath it
 */
function collect(files: Record<string, unknown>): Map<string, Written> {
  const parts = new Map<string, Written>();

  for (const [path, file] of Object.entries(files)) {
    for (const [family, members] of Object.entries(v.parse(FAMILIES, file))) {
      for (const [name, part] of Object.entries(members)) {
        if (name === FAMILY_TEACHABLE_KEY) {
          continue;
        }
        if (parts.has(name)) {
          throw new Error(`${path}: ${name} is written twice`);
        }
        parts.set(name, { where: `${path}: ${family}`, family, part });
      }
    }
  }
  return parts;
}

function readEvolutions(
  roads: v.InferOutput<typeof WORLD>['evolves-into'],
  where: string,
): EvolutionData[] | undefined {
  if (roads == null) {
    return undefined;
  }

  const read: EvolutionData[] = [];

  for (const road of roads) {
    const evolution: EvolutionData = {
      species: idOf(SPECIES_IDS, road.species, where),
      method: flagsOf(EVOLUTION_METHOD_IDS, road.method, where),
    };

    if (road.level != null) {
      evolution.level = road.level;
    }
    if (road.item != null) {
      evolution.item = idOf(ITEM_IDS, road.item, where);
    }
    if (road.partner != null) {
      evolution.partner = idOf(SPECIES_IDS, road.partner, where);
    }
    if (road.time != null) {
      evolution.time = flagsOf(TIME_OF_DAY_IDS, road.time, where);
    }
    if (road.gender != null) {
      evolution.gender = idOf(GENDER_IDS, road.gender, where);
    }
    if (road.move != null) {
      evolution.move = idOf(MOVE_IDS, road.move, where);
    }
    if (road.natures != null) {
      evolution.natures = new Set(idsOf(NATURE_IDS, road.natures, where));
    }
    if (road.compare != null) {
      const compare: StatComparison = {
        stat: idOf(STAT_IDS, road.compare.stat, where),
        against: idOf(STAT_IDS, road.compare.against, where),
        order: road.compare.order,
      };

      evolution.compare = compare;
    }
    if (road.shed === true) {
      evolution.shed = true;
    }
    read.push(evolution);
  }
  return read;
}

/** The slots a wild one carries, each checked as an item */
function readHeld(
  held: NonNullable<v.InferOutput<typeof WORLD>['held']>,
  where: string,
): WildHeldItems {
  const read: WildHeldItems = {};

  if (held.common != null) {
    read.common = idOf(ITEM_IDS, held.common, where);
  }
  if (held.uncommon != null) {
    read.uncommon = idOf(ITEM_IDS, held.uncommon, where);
  }
  if (held.rare != null) {
    read.rare = idOf(ITEM_IDS, held.rare, where);
  }
  return read;
}

function readStats(stats: Record<string, number>, where: string): Record<Stats, number> {
  const values = new Map<Stats, number>();

  for (const [name, value] of Object.entries(stats)) {
    values.set(idOf(STAT_IDS, name, where), value);
  }

  const of = (stat: Stats): number => {
    const value = values.get(stat);

    if (value == null) {
      throw new Error(`${where}: no base ${STAT_NAMES[stat]}`);
    }
    return value;
  };

  return {
    [Stats.HP]: of(Stats.HP),
    [Stats.Attack]: of(Stats.Attack),
    [Stats.Defense]: of(Stats.Defense),
    [Stats.SpecialAttack]: of(Stats.SpecialAttack),
    [Stats.SpecialDefense]: of(Stats.SpecialDefense),
    [Stats.Speed]: of(Stats.Speed),
  };
}

/** What each family can be taught as a whole, by family name */
function familyTeachables(files: Record<string, unknown>): Map<string, string[]> {
  const shared = new Map<string, string[]>();

  for (const file of Object.values(files)) {
    for (const [family, members] of Object.entries(v.parse(FAMILIES, file))) {
      const list = members[FAMILY_TEACHABLE_KEY];

      if (list != null) {
        shared.set(family, v.parse(NAMES, list));
      }
    }
  }
  return shared;
}

function readLearnSet(
  part: v.InferOutput<typeof LEARNSET>,
  shared: string[],
  where: string,
): LearnSetData {
  const level: Record<number, Moves[]> = {};

  for (const [at, moves] of Object.entries(part.level)) {
    level[Number(at)] = idsOf(MOVE_IDS, moves, where);
  }

  const learnSet: LearnSetData = {
    level,
    teachable: idsOf(MOVE_IDS, [...shared, ...part.teachable], where),
  };

  if (part.egg != null) {
    learnSet.egg = idsOf(MOVE_IDS, part.egg, where);
  }
  return learnSet;
}

/** Every field file, as the build hands them over */
export interface SpeciesFiles {
  world: Record<string, unknown>;
  stats: Record<string, unknown>;
  abilities: Record<string, unknown>;
  learnsets: Record<string, unknown>;
  text: Record<string, unknown>;
}

/**
 * Every species the files describe, built into the record the registry
 * holds, in dex order with each species' own form ahead of its others
 */
export function readSpecies(files: SpeciesFiles): [Species, SpeciesData][] {
  const world = collect(files.world);
  const stats = collect(files.stats);
  const abilities = collect(files.abilities);
  const learnsets = collect(files.learnsets);
  const text = collect(files.text);
  const shared = familyTeachables(files.learnsets);
  const read: [Species, SpeciesData][] = [];

  for (const [name, placed] of world) {
    const where = `${placed.where}: ${name}`;
    const species = idOf(SPECIES_IDS, name, where);
    const need = (field: Map<string, Written>, kind: string): Written => {
      const found = field.get(name);

      if (found == null) {
        throw new Error(`${name} has no ${kind}`);
      }
      if (found.family !== placed.family) {
        throw new Error(
          `${name} is under ${placed.family} in world/ but ${found.family} in ${kind}`,
        );
      }
      return found;
    };

    const place = v.parse(WORLD, placed.part);
    const body = v.parse(STATS, need(stats, 'stats').part);
    const pools = v.parse(ABILITIES, need(abilities, 'abilities').part);
    const moves = v.parse(LEARNSET, need(learnsets, 'learnset').part);
    const words = v.parse(TEXT, need(text, 'name').part);

    const data: SpeciesData = {
      dexNumber: place.dex ?? speciesDexNumber(species),
      name: words.name,
      category: words.category,
      height: body.height,
      weight: body.weight,
      family: idOf(FAMILY_IDS, placed.family, where),
      stats: readStats(body.stats, where),
      types: idsOf<Types>(TYPE_IDS, place.types, where),
      abilities: idsOf<Abilities>(ABILITY_IDS, pools.abilities, where),
      eggGroups: idsOf<EggGroups>(EGG_GROUP_IDS, place['egg-groups'], where),
      genderRatio: body.gender === 'genderless' ? undefined : body.gender,
      catchRate: body['catch-rate'],
      biomes: idsOf<Biome>(BIOME_IDS, place.biomes, where),
      activeTimes:
        place.active === 'any' ? AnyTimeOfDay : flagsOf(TIME_OF_DAY_IDS, place.active, where),
      learnSet: readLearnSet(moves, shared.get(placed.family) ?? [], where),
    };

    if (place['base-form'] === false) {
      data.baseForm = false;
    }
    if (place.worn === true) {
      data.worn = true;
    }
    if (place.habitat != null) {
      data.habitat = idOf(HABITAT_IDS, place.habitat, where);
    }
    if (pools.hidden != null) {
      data.hiddenAbilities = idsOf<Abilities>(ABILITY_IDS, pools.hidden, where);
    }
    if (place['evolves-from'] != null) {
      data.evolvesFrom = idOf(SPECIES_IDS, place['evolves-from'], where);
    }

    const roads = readEvolutions(place['evolves-into'], where);

    if (roads != null) {
      data.evolvesInto = roads;
    }
    if (place['egg-species'] != null) {
      data.eggSpecies = idOf(SPECIES_IDS, place['egg-species'], where);
    }
    if (place.held != null) {
      data.heldItems = readHeld(place.held, where);
    }
    if (place.rank != null) {
      data.rank = place.rank;
    }
    if (place.awaiting != null) {
      data.awaiting = place.awaiting;
    }
    if (body['egg-cycles'] != null) {
      data.eggCycles = body['egg-cycles'];
    }
    read.push([species, data]);
  }

  read.sort(
    ([one], [two]) =>
      speciesDexNumber(one) - speciesDexNumber(two) ||
      speciesFormIndex(one) - speciesFormIndex(two),
  );
  return read;
}
