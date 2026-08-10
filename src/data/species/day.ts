import type Families from '../ids/families';
import type { Species } from '../ids/species';
import { getRegisteredFamilies, getSpeciesData } from './__create';

/**
 * The featured family's shininess is eight times as likely
 */
export const SPECIES_DAY_SHINY_BOOST = 8;

/**
 * ...its members crowd the spawn pool four times as heavily...
 */
export const SPECIES_DAY_WEIGHT_BOOST = 4;

/**
 * ...and they come along twice as readily when a ball lands — a
 * lighter touch than the rest, since the catch chance is already
 * stacked with the ball and whatever the encounter has been fed
 */
export const SPECIES_DAY_CATCH_BOOST = 2;

const DAY = 24 * 60 * 60 * 1000;

/**
 * The day of the year a timestamp falls in, counted from zero in UTC
 * so every player's species day turns over at the same moment
 */
export function getDayOfYear(timestamp: number): number {
  const date = new Date(timestamp);
  const start = Date.UTC(date.getUTCFullYear(), 0, 1);

  return Math.floor((date.getTime() - start) / DAY);
}

/**
 * The family in the spotlight today: the one whose family number is
 * the day of the year. Family numbers run far short of a year, so
 * most days feature nobody — a blank day is the normal case, and the
 * rule stays a plain equality no matter how many generations are
 * registered later
 */
export function getFeaturedFamily(timestamp: number): Families | null {
  const day = getDayOfYear(timestamp);

  // The day of the year is compared against the family's own
  // numbering, which is the whole rule — there is no enum member to
  // compare it to
  // oxlint-disable-next-line typescript/no-unsafe-enum-comparison
  return getRegisteredFamilies().find((family) => family === day) ?? null;
}

/**
 * Whether the species belongs to the day's featured family
 */
export function isFeaturedSpecies(species: Species, timestamp: number): boolean {
  const featured = getFeaturedFamily(timestamp);

  return featured != null && getSpeciesData(species).family === featured;
}
