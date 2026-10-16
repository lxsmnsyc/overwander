import type { CaughtPokemon } from '../../caught-record';
import {
  STAT_ORDER,
  Stats,
  getHealthStat,
  getIV,
  getOtherStat,
} from '../../../data/constants/stats';
import {
  TYPE_EFFECTIVENESS,
  TYPE_EFFECTIVENESS_FACTOR,
  TYPE_NAMES,
  type Types,
} from '../../../data/constants/types';
import { getNatureFactor } from '../../../data/ids/natures';
import { getSpeciesData } from '../../../data/species';
import { alternatives } from '../../../core/query';
import { idsFor } from './shared';

/**
 * What each value is asked for as. They are the short names a player
 * types rather than the long ones a sheet prints: `iv:spa:31` is the
 * question somebody actually asks
 */
export const IV_WORDS = ['hp', 'atk', 'def', 'spa', 'spd', 'spe'];

/** The column each value is stored in, in the same order */
export const IV_COLUMNS = ['iv_hp', 'iv_atk', 'iv_def', 'iv_spa', 'iv_spd', 'iv_spe'];

const IV_STATS = new Map<string, Stats>();

for (const [at, word] of IV_WORDS.entries()) {
  IV_STATS.set(word, STAT_ORDER[at]);
}

/**
 * A value term, which may name a stat before its number: `iv:atk:31`,
 * `iv:spe:28-31`. Without one it is the six added up, so `iv:180-` is
 * a pokemon that is nearly all the way there. A stat nobody has heard
 * of asks for nothing, which refuses the term
 */
export function readIV(value: string): { stat: Stats | null; wanted: string } {
  if (!value.includes(':')) {
    return { stat: null, wanted: value };
  }

  const named = readStat(value);

  return named.stat == null ? { stat: null, wanted: '' } : named;
}

/**
 * A term that names a stat before its number: `stat:spe:>120`. Unlike
 * a value term it has to name one, since "the stats" added together
 * is not a number anybody is asking about
 */
export function readStat(value: string): { stat: Stats | null; wanted: string } {
  const colon = value.indexOf(':');

  if (colon < 0) {
    return { stat: null, wanted: '' };
  }
  return {
    stat: IV_STATS.get(value.slice(0, colon).trim().toLowerCase()) ?? null,
    wanted: value.slice(colon + 1),
  };
}

/** The six added up, which is what a value term with no stat asks about */
export function totalIVs(packed: number): number {
  let sum = 0;

  for (const stat of STAT_ORDER) {
    sum += getIV(packed, stat);
  }
  return sum;
}

/**
 * What one of its stats actually comes to: the species' base against
 * this individual's level, values, training and nature. It is the
 * number a sheet prints rather than anything stored
 */
export function statValue(caught: CaughtPokemon, stat: Stats): number {
  const base = getSpeciesData(caught.species).stats[stat];
  const value = getIV(caught.ivs, stat);
  const effort = caught.effortValues[stat];

  return stat === Stats.HP
    ? getHealthStat(caught.level, base, value, effort)
    : getOtherStat(caught.level, base, value, effort, getNatureFactor(caught.nature, stat));
}

/**
 * What one attacking type comes to against everything this pokemon
 * is: the factors multiplied, the way a hit is worked out. Four for a
 * doubly weak pair, nothing at all for an immunity
 */
function effectiveness(types: Types[], attacking: Types): number {
  let factor = 1;

  for (const defending of types) {
    const result = TYPE_EFFECTIVENESS[attacking][defending];

    if (result != null) {
      factor *= TYPE_EFFECTIVENESS_FACTOR[result];
    }
  }
  return factor;
}

/**
 * Whether any type the value names lands on this pokemon the way the
 * term asks: harder than usual, softer, or not at all
 */
export function struckBy(
  caught: CaughtPokemon,
  value: string,
  keep: (factor: number) => boolean,
): boolean {
  const { types } = getSpeciesData(caught.species);

  for (const word of alternatives(value)) {
    for (const type of idsFor(TYPE_NAMES, word)) {
      if (keep(effectiveness(types, type))) {
        return true;
      }
    }
  }
  return false;
}

/** How far an egg still has to be carried */
export function stepsLeft(caught: CaughtPokemon): number {
  return Math.max(0, caught.hatchSteps - caught.steps);
}

/**
 * The six statuses a record keeps out of a battle, by the word a
 * search calls them and the bit each is stored as. The column beside
 * the bit is the same question asked of the store, which cannot read
 * a bit out of a mask on its own
 */
export const STORED_STATUSES = new Map<string, { bit: number; column: string }>(
  Object.entries({
    poison: { bit: 0b00_0001, column: 'status_poisoned' },
    toxic: { bit: 0b00_0010, column: 'status_badly_poisoned' },
    sleep: { bit: 0b00_0100, column: 'status_sleeping' },
    paralysis: { bit: 0b00_1000, column: 'status_paralyzed' },
    burn: { bit: 0b01_0000, column: 'status_burned' },
    freeze: { bit: 0b10_0000, column: 'status_frozen' },
  }),
);
