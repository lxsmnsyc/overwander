import { Stats } from '../constants/stats';
import type { Types } from '../constants/types';
import type Abilities from '../ids/abilities';
import type Biome from '../ids/biome';
import type EggGroups from '../ids/egg-groups';
import type Families from '../ids/families';
import type { Moves } from '../ids/moves';
import type { Habitat, Species } from '../ids/species';
import {
  type EvolutionData,
  type LearnSetData,
  type SpeciesData,
  registerLearnSet,
  registerSpeciesRecord,
} from './__create';

/**
 * The species tables as the game loads them: one JSON row per species,
 * fields by position. `pnpm species-compact` writes them from the
 * source files, and a test keeps the two in step.
 */

/** A species id, its record's required fields, then its optional ones with trailing absences cut */
export type RecordRow = [
  species: Species,
  dexNumber: number,
  name: string,
  category: string,
  height: number,
  weight: number,
  family: Families,
  stats: [number, number, number, number, number, number],
  types: Types[],
  abilities: Abilities[],
  eggGroups: EggGroups[],
  genderRatio: [male: number, female: number] | null,
  catchRate: number,
  biomes: Biome[],
  activeTimes: number,
  hiddenAbilities?: Abilities[] | null,
  evolvesFrom?: Species | null,
  evolvesInto?: EvolutionData[] | null,
  eggSpecies?: Species | null,
  habitat?: Habitat | null,
  baseForm?: boolean | null,
  worn?: boolean | null,
];

/** A species id, its level moves as level and list pairs, its teachable moves and its egg moves */
export type LearnSetRow = [
  species: Species,
  level: [number, Moves[]][],
  teachable: Moves[],
  egg?: Moves[],
];

export type RecordFile = RecordRow[];
export type LearnSetFile = LearnSetRow[];

export function encodeRecord(species: Species, data: SpeciesData): RecordRow {
  const { stats } = data;
  const row: RecordRow = [
    species,
    data.dexNumber,
    data.name,
    data.category,
    data.height,
    data.weight,
    data.family,
    [
      stats[Stats.HP],
      stats[Stats.Attack],
      stats[Stats.Defense],
      stats[Stats.SpecialAttack],
      stats[Stats.SpecialDefense],
      stats[Stats.Speed],
    ],
    data.types,
    data.abilities,
    data.eggGroups,
    data.genderRatio ?? null,
    data.catchRate,
    data.biomes,
    data.activeTimes,
    data.hiddenAbilities ?? null,
    data.evolvesFrom ?? null,
    data.evolvesInto ?? null,
    data.eggSpecies ?? null,
    data.habitat ?? null,
    data.baseForm ?? null,
    data.worn ?? null,
  ];

  while (row.length > 15 && row.at(-1) == null) {
    row.pop();
  }
  return row;
}

export function decodeRecord(row: RecordRow): [Species, SpeciesData] {
  const [
    species,
    dexNumber,
    name,
    category,
    height,
    weight,
    family,
    values,
    types,
    abilities,
    eggGroups,
    genderRatio,
    catchRate,
    biomes,
    activeTimes,
    hiddenAbilities,
    evolvesFrom,
    evolvesInto,
    eggSpecies,
    habitat,
    baseForm,
    worn,
  ] = row;
  const [hp, attack, defense, specialAttack, specialDefense, speed] = values;
  const stats: Record<Stats, number> = {
    [Stats.HP]: hp,
    [Stats.Attack]: attack,
    [Stats.Defense]: defense,
    [Stats.SpecialAttack]: specialAttack,
    [Stats.SpecialDefense]: specialDefense,
    [Stats.Speed]: speed,
  };

  return [
    species,
    {
      dexNumber,
      name,
      category,
      height,
      weight,
      family,
      stats,
      types,
      abilities,
      eggGroups,
      genderRatio: genderRatio ?? undefined,
      catchRate,
      biomes,
      activeTimes,
      ...(hiddenAbilities == null ? {} : { hiddenAbilities }),
      ...(evolvesFrom == null ? {} : { evolvesFrom }),
      ...(evolvesInto == null ? {} : { evolvesInto }),
      ...(eggSpecies == null ? {} : { eggSpecies }),
      ...(habitat == null ? {} : { habitat }),
      ...(baseForm == null ? {} : { baseForm }),
      ...(worn == null ? {} : { worn }),
    },
  ];
}

export function encodeLearnSet(species: Species, learnSet: LearnSetData): LearnSetRow {
  const level: [number, Moves[]][] = [];

  for (const [threshold, moves] of Object.entries(learnSet.level)) {
    level.push([Number(threshold), moves]);
  }
  return learnSet.egg == null
    ? [species, level, learnSet.teachable]
    : [species, level, learnSet.teachable, learnSet.egg];
}

export function decodeLearnSet(row: LearnSetRow): [Species, LearnSetData] {
  const [species, pairs, teachable, egg] = row;
  const level: Record<number, Moves[]> = {};

  for (const [threshold, moves] of pairs) {
    level[threshold] = moves;
  }
  return [species, egg == null ? { level, teachable } : { level, teachable, egg }];
}

/** Registers one region's records, in row order */
export function registerRecordRows(rows: RecordFile): void {
  for (const row of rows) {
    registerSpeciesRecord(...decodeRecord(row));
  }
}

export function registerLearnSetRows(rows: LearnSetFile): void {
  for (const row of rows) {
    registerLearnSet(...decodeLearnSet(row));
  }
}

/** One row to a line, so a change to one species is one line of the diff */
export function serializeRows(rows: unknown[]): string {
  const lines: string[] = [];

  for (const row of rows) {
    lines.push(JSON.stringify(row));
  }
  return `[\n${lines.join(',\n')}\n]\n`;
}
