// Firestore returns untyped documents; the reads below restore
// const-enum fields via assertions that tsc requires but tsgolint
// (resolving const enums to number) considers unnecessary
// oxlint-disable typescript/no-unnecessary-type-assertion
import type { Stats } from '../data/constants/stats';
import type Abilities from '../data/ids/abilities';
import type { Items } from '../data/ids/items';
import type { Moves } from '../data/ids/moves';
import type Natures from '../data/ids/natures';
import type { Genders, Species } from '../data/ids/species';
import { asNumber, asNumberArray, asRecord, asStatRecord, asString } from './__normalize';
import type { CaughtPokemon } from './caught';

/**
 * A catch frozen at the moment a team snapshot was taken. A battle
 * must not shift under the players — levelling, evolving or handing
 * an item over mid-raid would change the units already fighting — so
 * a snapshot copies everything the battle needs and is never
 * rewritten afterwards
 */
export interface CatchSnapshot {
  /**
   * The caught/{catchId} this was copied from; the copy stands on
   * its own, so the source may have changed since
   */
  caught: string;
  species: Species;
  level: number;
  ivs: Record<Stats, number>;
  effortValues: Record<Stats, number>;
  nature: Natures;
  gender: Genders;
  shiny: boolean;
  moves: Moves[];
  abilities: Abilities[];
  items: Items[];
}

/**
 * Copy a catch and its side stores into a snapshot
 */
export function createCatchSnapshot(
  id: string,
  caught: CaughtPokemon,
  abilities: Abilities[],
  items: Items[],
): CatchSnapshot {
  return {
    caught: id,
    species: caught.species,
    level: caught.level,
    ivs: caught.ivs,
    effortValues: caught.effortValues,
    nature: caught.nature,
    gender: caught.gender,
    shiny: caught.shiny,
    moves: caught.moves,
    abilities,
    items,
  };
}

/**
 * Restore a snapshot from an untyped Firestore value
 */
export function asCatchSnapshot(value: unknown): CatchSnapshot {
  const data = asRecord(value);

  return {
    caught: asString(data.caught),
    species: asNumber(data.species) as Species,
    level: asNumber(data.level),
    ivs: asStatRecord(data.ivs),
    effortValues: asStatRecord(data.effortValues),
    nature: asNumber(data.nature) as Natures,
    gender: asNumber(data.gender) as Genders,
    shiny: data.shiny === true,
    moves: asNumberArray(data.moves) as Moves[],
    abilities: asNumberArray(data.abilities) as Abilities[],
    items: asNumberArray(data.items) as Items[],
  };
}
