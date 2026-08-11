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
import { deriveSize } from '../overworld/encounter';
import {
  asBoolean,
  asNumber,
  asNumberArray,
  asRecord,
  asStatRecord,
  asString,
} from './__normalize';
import { getMaxHealth } from './health';
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
  /**
   * The packed individual values, exactly as the record had them
   */
  ivs: number;
  effortValues: Record<Stats, number>;
  nature: Natures;
  gender: Genders;
  /**
   * This individual's own measurements, in meters and kilograms.
   * They are frozen like everything else: evolving mid-raid must not
   * make the unit already fighting heavier
   */
  height: number;
  weight: number;
  /**
   * What was true about it when the snapshot was taken. A frozen copy
   * answers the two questions a fight asks — whether it sparkles, and
   * whether it is a shadow
   */
  shiny: boolean;
  shadow: boolean;
  moves: Moves[];
  abilities: Abilities[];
  items: Items[];
  /**
   * The health it walks in with. A fight picks up where the last one
   * left off, so a pokemon hurt yesterday is hurt at the start of
   * today's raid rather than quietly mended by being fielded
   */
  health: number;
  /**
   * The non-volatile statuses it walks in with, all of them, as a
   * mask of `StatusFlags`
   */
  statuses: number;
}

/**
 * Copy a catch into a snapshot
 */
export function createCatchSnapshot(id: string, caught: CaughtPokemon): CatchSnapshot {
  // Size is derived from the trait value against the species standing
  // now, so an evolution taken before the raid is already reflected
  const size = deriveSize(caught.species, caught.traitValue);

  return {
    caught: id,
    species: caught.species,
    level: caught.level,
    ivs: caught.ivs,
    effortValues: caught.effortValues,
    nature: caught.nature,
    gender: caught.gender,
    height: size.height,
    weight: size.weight,
    shiny: caught.shiny,
    shadow: caught.shadow,
    moves: caught.moves,
    abilities: caught.abilities,
    items: caught.items,
    health: caught.health,
    statuses: caught.statuses,
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
    ivs: asNumber(data.ivs),
    effortValues: asStatRecord(data.effortValues),
    nature: asNumber(data.nature) as Natures,
    gender: asNumber(data.gender) as Genders,
    height: asNumber(data.height),
    weight: asNumber(data.weight),
    shiny: asBoolean(data.shiny),
    shadow: asBoolean(data.shadow),
    moves: asNumberArray(data.moves) as Moves[],
    abilities: asNumberArray(data.abilities) as Abilities[],
    items: asNumberArray(data.items) as Items[],
    // A snapshot written before a fight could hurt anything carries
    // no health, and a unit fielded at zero would be down before the
    // first turn: missing means whole
    health: data.health == null ? getMaxHealth(asHealthSource(data)) : asNumber(data.health),
    statuses: asNumber(data.statuses),
  };
}

/**
 * What maximum health is derived from, read off an untyped snapshot
 */
function asHealthSource(data: Record<string, unknown>): {
  species: Species;
  level: number;
  ivs: number;
  effortValues: Record<Stats, number>;
} {
  return {
    species: asNumber(data.species) as Species,
    level: asNumber(data.level),
    ivs: asNumber(data.ivs),
    effortValues: asStatRecord(data.effortValues),
  };
}
