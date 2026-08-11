export const enum Stats {
  HP = 0,
  Attack = 1,
  Defense = 2,
  SpecialAttack = 3,
  SpecialDefense = 4,
  Speed = 5,
}

export type StatsField = { [key in Stats]: number };

/**
 * The six stats in the order they are read out: the order a dex
 * prints them, an egg inherits them and a bottle cap polishes them
 */
export const STAT_ORDER: Stats[] = [
  Stats.HP,
  Stats.Attack,
  Stats.Defense,
  Stats.SpecialAttack,
  Stats.SpecialDefense,
  Stats.Speed,
];

/**
 * The best an individual value can be. A pokemon is born with six of
 * them somewhere between zero and this, and only a bottle cap moves
 * one afterwards
 */
export const MAX_IV = 31;

export const enum StatsKind {
  Base = 0,
  Individual = 1,
  Effort = 2,
}

export function createStatsField(): StatsField {
  return {
    [Stats.HP]: 0,
    [Stats.Attack]: 0,
    [Stats.Defense]: 0,
    [Stats.SpecialAttack]: 0,
    [Stats.SpecialDefense]: 0,
    [Stats.Speed]: 0,
  };
}

/**
 * What a level, a base stat, an individual value and an effort value
 * come to before the per-stat part of the formula. The three
 * functions below are the whole of how a pokemon's numbers are
 * derived, and they live here rather than in the battle because the
 * overworld asks the same question: how much health a catch has when
 * it is not fighting is the same figure the fight would give it
 */
function getSharedStat(level: number, base: number, iv: number, ev: number): number {
  return Math.floor(((2 * base + iv + Math.floor(ev / 4)) * level) / 100);
}

/**
 * A pokemon's maximum health
 */
export function getHealthStat(level: number, base: number, iv: number, ev: number): number {
  // TODO make the pokemon's tankier?
  return getSharedStat(level, base, iv, ev) + level + 10;
}

/**
 * Any stat but health, with the nature's factor applied
 */
export function getOtherStat(
  level: number,
  base: number,
  iv: number,
  ev: number,
  nature: number,
): number {
  return Math.floor((getSharedStat(level, base, iv, ev) + 5) * nature);
}

export const enum Stages {
  Attack = 0,
  Defense = 1,
  SpecialAttack = 2,
  SpecialDefense = 3,
  Speed = 4,
  Evasion = 5,
  Accuracy = 6,
}

export type StagesField = { [key in Stages]: number };

export function createStagesField(): StagesField {
  return {
    [Stages.Accuracy]: 0,
    [Stages.Attack]: 0,
    [Stages.Defense]: 0,
    [Stages.Evasion]: 0,
    [Stages.SpecialAttack]: 0,
    [Stages.SpecialDefense]: 0,
    [Stages.Speed]: 0,
  };
}

export function getStageFromStat(stat: Stats): Stages | undefined {
  switch (stat) {
    case Stats.Attack:
      return Stages.Attack;
    case Stats.Defense:
      return Stages.Defense;
    case Stats.SpecialAttack:
      return Stages.SpecialAttack;
    case Stats.SpecialDefense:
      return Stages.SpecialDefense;
    case Stats.Speed:
      return Stages.Speed;
    // HP has no stage
    case Stats.HP:
    default:
      return undefined;
  }
}
