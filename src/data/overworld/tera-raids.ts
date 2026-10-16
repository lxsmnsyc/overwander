import AleaRNG from '../../core/alea';
import type { Types } from '../constants/types';
import type { Species } from '../ids/species';
import { getSpeciesData } from '../species/__create';
import { TERA_TYPES } from '../species/tera-type';

/**
 * Tera raids, as Scarlet and Violet had them: a Terastallized pokemon
 * of the biome standing in a crystal grown out of the ground, paying
 * Tera Shards of its Tera type.
 */

/**
 * How often a Tera raid's boss takes any of the 18 types rather than
 * one of its own. Far more often than a catch's birth roll, since an
 * unexpected type is what a Tera raid is for, and every type's shards
 * have to be won somewhere
 */
export const TERA_RAID_WILD_SHARE = 1 / 2;

/** The Tera Shards every fighter takes from a cleared Tera raid, and the most extra on top */
export const TERA_RAID_SHARDS = 5;
export const TERA_RAID_EXTRA_SHARDS = 3;

/**
 * A Tera raid boss's Tera type, read off the lobby it stands in. The
 * lobby, the battle and the prize all read it from the same id, so
 * nothing about it is stored
 */
export function getTeraRaidType(species: Species, lobby: string): Types {
  const rng = new AleaRNG(`${lobby}:tera-type`);
  const own = getSpeciesData(species).types;
  const pool = own.length === 0 || rng.random() < TERA_RAID_WILD_SHARE ? TERA_TYPES : own;

  return pool[Math.min(pool.length - 1, Math.floor(rng.random() * pool.length))];
}
