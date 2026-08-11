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

/**
 * How the six individual values are stored: five bits each, in stat
 * order, packed into one integer.
 *
 * Thirty bits hold the lot, which is why they travel as a number
 * rather than a map of six. A stored record is smaller, a snapshot
 * copies one field instead of six, and — the reason it is worth doing
 * at all — comparing two pokemon's values is comparing two integers.
 * The unpacked map is still what most readers want, so it is one call
 * away in either direction
 */
const IV_BITS = 5;

/**
 * The value of one stat, read out of the packed integer
 */
export function getIV(packed: number, stat: Stats): number {
  return (packed >>> (stat * IV_BITS)) & MAX_IV;
}

/**
 * The packed integer with one stat replaced. Values are clamped to
 * what five bits can hold, so nothing ever bleeds into its neighbour
 */
export function setIV(packed: number, stat: Stats, value: number): number {
  const clamped = Math.max(0, Math.min(MAX_IV, Math.floor(value)));
  const shift = stat * IV_BITS;

  return ((packed & ~(MAX_IV << shift)) | (clamped << shift)) >>> 0;
}

/**
 * Six values packed into one integer, in stat order
 */
export function packIVs(values: Record<Stats, number>): number {
  let packed = 0;

  for (const stat of STAT_ORDER) {
    packed = setIV(packed, stat, values[stat]);
  }
  return packed;
}

/**
 * The packed integer read back out as a map, which is what a battle,
 * a dex line and the stat formula all want
 */
export function unpackIVs(packed: number): Record<Stats, number> {
  return {
    [Stats.HP]: getIV(packed, Stats.HP),
    [Stats.Attack]: getIV(packed, Stats.Attack),
    [Stats.Defense]: getIV(packed, Stats.Defense),
    [Stats.SpecialAttack]: getIV(packed, Stats.SpecialAttack),
    [Stats.SpecialDefense]: getIV(packed, Stats.SpecialDefense),
    [Stats.Speed]: getIV(packed, Stats.Speed),
  };
}

/**
 * The packed value of a pokemon whose every stat is perfect
 */
export const PERFECT_IVS = packIVs({
  [Stats.HP]: MAX_IV,
  [Stats.Attack]: MAX_IV,
  [Stats.Defense]: MAX_IV,
  [Stats.SpecialAttack]: MAX_IV,
  [Stats.SpecialDefense]: MAX_IV,
  [Stats.Speed]: MAX_IV,
});

export const enum StatsKind {
  Base = 0,
  Individual = 1,
  Effort = 2,
}

/**
 * The most effort one stat can be trained to. Four points buy one
 * point of the stat itself, so 252 is the last multiple of four worth
 * spending — the four above it would buy nothing
 */
export const MAX_EFFORT_PER_STAT = 252;

/**
 * How much effort a pokemon has to spend per level it has taken.
 *
 * The mainline earns effort a species at a time, from whatever a
 * pokemon happens to have fought; here it comes with the level and the
 * player decides where it goes. It is the same total either way — a
 * hundred levels is five hundred points — but it is spent deliberately
 * rather than accumulated by grinding the right opponents, which is
 * the part of the mainline's design that never survived being played
 */
export const EFFORT_PER_LEVEL = 5;

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
