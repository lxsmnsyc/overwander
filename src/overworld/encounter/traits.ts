import AleaRNG from '../../core/alea';
import type Abilities from '../../data/ids/abilities';
import type Natures from '../../data/ids/natures';
import type { Items } from '../../data/ids/items';
import { Genders } from '../../data/ids/species';
import type { Species } from '../../data/ids/species';
import { getSpeciesAbilityPools, getSpeciesData } from '../../data/species';
import { getSpeciesHeldItems, pickHeldItem } from '../../data/species/held-items';
import {
  HELD_ITEM_MASK,
  HELD_ITEM_RANGE,
  HIDDEN_ABILITY_BAND,
  NATURE_COUNT,
  TRAIT_BITS,
  TRAIT_MASK,
  TRAIT_RANGE,
} from './bits';

/** What one individual is: its shine, its ability, its gender, its nature, what it carries and how big it is */
/**
 * How many moves one pokemon carries. Anything that assembles a move
 * list — a level-up derivation, a hatchling's inheritance — cuts to
 * this
 */
export const MOVE_LIMIT = 4;

/**
 * A raid cleared on the featured family's own day hands over a
 * pokemon with no hopeless stat: every individual value starts here
 */
export const RAID_FAMILY_DAY_MIN_IV = 10;

/**
 * XOR results under this sparkle: 16 in 65536, i.e. the modern
 * 1/4096 shiny odds
 */
const SHINY_THRESHOLD = 16;

const HALF_BITS = 16;
const HALF_MASK = 0xffff;

/**
 * What a development run sparkles on instead: half of 65536, so about
 * one spawn in two. Shiny coats and their sparkle cannot be worked on
 * at 1 in 4096. `import.meta.env.DEV` is false in anything Vite
 * builds, so a production bundle keeps the real threshold
 */
const DEV_SHINY_THRESHOLD = (HALF_MASK + 1) / 2;

/**
 * Whether this run is a developer looking at the game rather than the
 * game itself. Read once at load, so the odds cannot change under a
 * session and the client agrees with the server about what sparkles.
 *
 * Production builds, unit tests and browser tests all keep the real
 * odds: the first is the game, and the other two check behaviour a
 * moving threshold would quietly change
 */
const SHOWING_OFF = ((): boolean => {
  // Read through a guard: the browser tests import this module into
  // Playwright's own Node runner, which transforms nothing, so
  // `import.meta.env` is missing there — and missing means real odds
  const env = (import.meta as { env?: Record<string, unknown> }).env ?? {};

  return env.DEV === true && env.MODE !== 'test' && env.VITE_REAL_SHINY_ODDS !== 'true';
})();

/**
 * The mainline shiny formula, adapted: the user id hashes to a stable
 * 32-bit trainer value whose halves XOR against the trait value's, so
 * each trainer sees their own shinies. It reads the trait value, which
 * keeps the sparkle independent of the IVs a pokemon rolled
 */
export function isShinyFor(userId: string, traitValue: number, boost = 1): boolean {
  const trainerValue = new AleaRNG(userId).int32();
  const shininess =
    (trainerValue >>> HALF_BITS) ^
    (trainerValue & HALF_MASK) ^
    (traitValue >>> HALF_BITS) ^
    (traitValue & HALF_MASK);

  // A boost widens the band: 8x takes the odds from 1/4096 to 1/512.
  // A dev run opens it to half of everything before any boost
  return shininess < (SHOWING_OFF ? DEV_SHINY_THRESHOLD : SHINY_THRESHOLD * boost);
}

/**
 * The ability a trait value picks for the species: the slice's band
 * chooses between the hidden and regular pools, its position within
 * the band chooses the entry.
 *
 * `boost` widens the hidden band without moving anything else — the
 * species day is what passes one
 */
export function deriveAbility(species: Species, traitValue: number, boost = 1): Abilities {
  const abilitySlice = (traitValue >>> (TRAIT_BITS * 2)) & TRAIT_MASK;
  const pools = getSpeciesAbilityPools(species);
  const band = Math.min(TRAIT_RANGE, HIDDEN_ABILITY_BAND * boost);

  if (pools.hidden.length > 0 && abilitySlice < band) {
    const fraction = abilitySlice / band;

    return pools.hidden[Math.floor(fraction * pools.hidden.length)];
  }

  const start = pools.hidden.length > 0 ? band : 0;
  const fraction = (abilitySlice - start) / (TRAIT_RANGE - start);

  return pools.regular[Math.floor(fraction * pools.regular.length)];
}

/**
 * The abilities a trained pokemon carries, `first` included and at
 * most `count` of them.
 *
 * The rungs above a gym leader field pokemon carrying more than one,
 * which is the one thing a player cannot get by catching the same
 * species: a wild meeting rolls one ability and keeps it. The extras
 * are read off the nature slice rather than the ability slice, so
 * which ones a pokemon has are not decided by which one it rolled,
 * and a species with nothing left to give simply carries fewer
 */
export function deriveTrainedAbilities(
  species: Species,
  traitValue: number,
  first: Abilities,
  count: number,
): Abilities[] {
  const pools = getSpeciesAbilityPools(species);
  const rest = [...new Set([...pools.regular, ...pools.hidden])].filter(
    (ability) => ability !== first,
  );
  const slice = (traitValue >>> (TRAIT_BITS * 3)) & TRAIT_MASK;
  const cursor = Math.floor((slice / TRAIT_RANGE) * rest.length);
  const carried = [first];

  while (carried.length < count && rest.length > 0) {
    carried.push(...rest.splice(cursor % rest.length, 1));
  }
  return carried;
}

/**
 * The gender a trait value picks for the species: a pure ratio roll
 * from its own slice, independent of any stat. A species with no
 * ratio is genderless
 */
export function deriveGender(species: Species, traitValue: number): Genders {
  const { genderRatio } = getSpeciesData(species);

  if (genderRatio == null) {
    return Genders.Genderless;
  }

  const genderSlice = (traitValue >>> TRAIT_BITS) & TRAIT_MASK;
  const [male, female] = genderRatio;
  const femaleShare = female / (male + female);

  return genderSlice < femaleShare * TRAIT_RANGE ? Genders.Female : Genders.Male;
}

/**
 * The nature a trait value picks, from its own slice
 */
export function deriveNature(traitValue: number): Natures {
  const natureSlice = (traitValue >>> (TRAIT_BITS * 3)) & TRAIT_MASK;

  // tsc requires the assertion to treat the scaled slice as a
  // Natures; tsgolint resolves the const enum to number and disagrees
  // oxlint-disable-next-line typescript/no-unnecessary-type-assertion
  return Math.floor((natureSlice / TRAIT_RANGE) * NATURE_COUNT) as Natures;
}

/**
 * What a wild pokemon of the species is carrying.
 *
 * The trait value is mixed before it is read, the way the size roll
 * mixes it: every 8-bit slice of it is already spoken for, and a
 * one-in-a-hundred item needs finer odds than 256 steps anyway
 */
export function deriveHeldItems(species: Species, traitValue: number, boost = 1): Items[] {
  const held = getSpeciesHeldItems(species);

  if (held == null) {
    return [];
  }

  let mixed = traitValue >>> 0;

  mixed ^= mixed << 7;
  mixed >>>= 0;
  mixed ^= mixed >>> 9;
  mixed ^= mixed << 8;
  mixed >>>= 0;

  const item = pickHeldItem(held, (mixed & HELD_ITEM_MASK) / HELD_ITEM_RANGE, boost);

  return item == null ? [] : [item];
}

/**
 * How far an individual may fall short of, or overshoot, its species'
 * listed height. The band is deliberately narrow: a pokemon is still
 * recognizably its species, and weight follows the cube of it
 */
export const MIN_SIZE_SCALE = 0.85;
export const MAX_SIZE_SCALE = 1.15;

/**
 * The measurements of one individual
 */
export interface Size {
  /**
   * Meters, to the centimeter
   */
  height: number;
  /**
   * Kilograms, to the hectogram
   */
  weight: number;
}

/**
 * The scale one individual is built at, between MIN_SIZE_SCALE and
 * MAX_SIZE_SCALE. The four trait slices are already spoken for, so the
 * value is mixed (xorshift) and read as two bytes averaged together:
 * a triangular distribution, so extremes are rare enough to show off
 */
export function deriveSizeScale(traitValue: number): number {
  let mixed = traitValue >>> 0;

  mixed ^= mixed << 13;
  mixed >>>= 0;
  mixed ^= mixed >>> 17;
  mixed ^= mixed << 5;
  mixed >>>= 0;

  const rolls = ((mixed & TRAIT_MASK) + ((mixed >>> TRAIT_BITS) & TRAIT_MASK)) / 2;

  return MIN_SIZE_SCALE + (rolls / TRAIT_MASK) * (MAX_SIZE_SCALE - MIN_SIZE_SCALE);
}

/**
 * The measurements a trait value gives an individual. Height scales
 * directly and weight with its cube, the way volume does; neither can
 * round to nothing. Derived rather than stored, so evolving grows the
 * pokemon while its proportions stay its own
 */
export function deriveSize(species: Species, traitValue: number): Size {
  const data = getSpeciesData(species);
  const scale = deriveSizeScale(traitValue);

  return {
    height: Math.max(0.01, Math.round(data.height * scale * 100) / 100),
    weight: Math.max(0.1, Math.round(data.weight * scale ** 3 * 10) / 10),
  };
}
