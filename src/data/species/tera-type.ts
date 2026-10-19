import { Types } from '../constants/types';
import type { Species } from '../ids/species';
import { getSpeciesData } from './__create';

/**
 * The type a catch Terastallizes into, rolled once when its row is
 * written and kept through trades and evolutions.
 */

/** The 18 types a Tera type can be. Stellar is left out until it has art and a use */
export const TERA_TYPES: readonly Types[] = [
  Types.Normal,
  Types.Fighting,
  Types.Flying,
  Types.Poison,
  Types.Ground,
  Types.Rock,
  Types.Bug,
  Types.Ghost,
  Types.Steel,
  Types.Fire,
  Types.Water,
  Types.Grass,
  Types.Electric,
  Types.Psychic,
  Types.Ice,
  Types.Dragon,
  Types.Dark,
  Types.Fairy,
];

/** How often the roll ignores the species' own types and picks any of the 18 */
export const WILD_TERA_CHANCE = 1 / 20;

/** What a catch with no stored Tera type reads as: its species' first type */
export function defaultTeraType(species: Species): Types {
  return getSpeciesData(species).types[0] ?? Types.Normal;
}

/** A catch's Tera type, where null or absent is one made before it was stored */
export function teraTypeOf(caught: { species: Species; teraType?: Types | null }): Types {
  return caught.teraType ?? defaultTeraType(caught.species);
}

/** Roll a new catch's Tera type: usually one of its own types, rarely any of the 18 */
export function rollTeraType(species: Species, random: () => number = Math.random): Types {
  const own = getSpeciesData(species).types;
  const pool = own.length === 0 || random() < WILD_TERA_CHANCE ? TERA_TYPES : own;

  return pool[Math.min(pool.length - 1, Math.floor(random() * pool.length))];
}

/** Whether a stored value is a type the Tera type can be */
export function isTeraType(value: unknown): value is Types {
  return typeof value === 'number' && (TERA_TYPES as readonly number[]).includes(value);
}
