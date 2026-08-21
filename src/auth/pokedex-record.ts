import type { Species } from '../data/ids/species';
import { isRecord } from './__normalize';

/**
 * What a player has met and what they have kept: a row per species in
 * `pokedex_entries`, collapsed into the bag's map shape for reading.
 *
 * The counts are historical. They say how many this player ever met or
 * kept, not how many they hold, so releasing or trading one leaves the
 * dex as it was, and a trigger refuses any update that takes a count
 * down.
 *
 * A shiny is counted **only** in the shiny tally, so a species' total
 * is the two added together
 */

/**
 * Which pair of maps a tally lives in: the ordinary one and the
 * sparkling one beside it
 */
export interface DexSpec {
  field: 'seen' | 'caught';
  shinyField: 'seenShiny' | 'caughtShiny';
}

/**
 * Pokemon this player has met — a wild encounter staged, a raid boss
 * fielded, a grunt's prize offered
 */
export const DEX_SEEN: DexSpec = { field: 'seen', shinyField: 'seenShiny' };

/**
 * Pokemon this player has come to own: caught, hatched or given.
 *
 * A gift arrives without a meeting, so a species can be caught without
 * ever having been seen — which is why `hasSeenSpecies` reads both
 * maps rather than the seen one alone
 */
export const DEX_CAUGHT: DexSpec = { field: 'caught', shinyField: 'caughtShiny' };

export const DEX_SPECS: DexSpec[] = [DEX_SEEN, DEX_CAUGHT];

/**
 * The player a dex belongs to; a dex has no id of its own
 */
export function pokedexId(uid: string): string {
  return uid;
}

/**
 * One map as stored: how many, keyed by the species id written out.
 * Anything that is not a count is left out rather than read as zero
 */
export type DexMap = Record<string, number>;

/**
 * What one species has come to for a player: how many ordinary ones
 * and how many sparkling ones
 */
export interface DexTally {
  species: Species;
  /**
   * How many that did not sparkle
   */
  regular: number;
  /**
   * How many that did
   */
  shiny: number;
  /**
   * Both together, which is what "how many have I met" means
   */
  total: number;
}

function asDexMap(dex: unknown, field: string): DexMap {
  const data = isRecord(dex) ? dex : {};
  const map = data[field];

  if (!isRecord(map)) {
    return {};
  }

  const counted: DexMap = {};

  for (const [key, count] of Object.entries(map)) {
    if (typeof count === 'number' && count > 0) {
      counted[key] = count;
    }
  }
  return counted;
}

/**
 * How many of that species the player has to their name in this tally,
 * counting only the ordinary ones or only the sparkling ones
 */
export function getDexCount(dex: unknown, spec: DexSpec, species: Species, shiny = false): number {
  return asDexMap(dex, shiny ? spec.shinyField : spec.field)[String(species)] ?? 0;
}

/**
 * What one species has come to, both maps together. A species the
 * player has never met answers zero rather than nothing, so a caller
 * can ask about any species without checking first
 */
export function getDexTally(dex: unknown, spec: DexSpec, species: Species): DexTally {
  const regular = getDexCount(dex, spec, species, false);
  const shiny = getDexCount(dex, spec, species, true);

  return { species, regular, shiny, total: regular + shiny };
}

/**
 * Every species this tally holds anything for, in ascending species
 * order so two dexes read the same way whatever order they were
 * filled in
 */
export function listDexTallies(dex: unknown, spec: DexSpec): DexTally[] {
  const species = new Set<number>();

  for (const field of [spec.field, spec.shinyField]) {
    for (const key of Object.keys(asDexMap(dex, field))) {
      species.add(Number(key));
    }
  }
  return (
    [...species]
      .sort((one, other) => one - other)
      // oxlint-disable-next-line typescript/no-unnecessary-type-assertion
      .map((entry) => getDexTally(dex, spec, entry as Species))
  );
}

/**
 * How many distinct species the tally holds — the figure a dex is
 * counted by, rather than how many individuals passed through
 */
export function countDexSpecies(dex: unknown, spec: DexSpec): number {
  return listDexTallies(dex, spec).length;
}

/**
 * Whether the player has ever met one.
 *
 * Owning one counts: a pokemon given rather than met was never
 * encountered, and a dex that called it unseen would be saying the
 * player has never laid eyes on something standing in their party
 */
export function hasSeenSpecies(dex: unknown, species: Species): boolean {
  return (
    getDexTally(dex, DEX_SEEN, species).total > 0 || getDexTally(dex, DEX_CAUGHT, species).total > 0
  );
}

/**
 * Whether the player has ever owned one
 */
export function hasCaughtSpecies(dex: unknown, species: Species): boolean {
  return getDexTally(dex, DEX_CAUGHT, species).total > 0;
}

/**
 * Whether they have ever had a sparkling one of their own. It is the
 * one question a dex is really kept for
 */
export function hasCaughtShiny(dex: unknown, species: Species): boolean {
  return getDexCount(dex, DEX_CAUGHT, species, true) > 0;
}
