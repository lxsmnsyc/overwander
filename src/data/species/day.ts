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
 * ...they come along twice as readily when a ball lands — a lighter
 * touch than the rest, since the catch chance is already stacked with
 * the ball and whatever the encounter has been fed...
 */
export const SPECIES_DAY_CATCH_BOOST = 2;

/**
 * ...twice as many of them turn up with the ability their species
 * usually keeps hidden, so the day is when a line's hidden ability is
 * worth hunting for...
 */
export const SPECIES_DAY_HIDDEN_ABILITY_BOOST = 2;

/**
 * ...and an egg of theirs counts every pace as 1.2 while the day
 * lasts. It is credit rather than a discount, so it is worth exactly
 * the walking done today — an egg carried past midnight goes back to
 * ordinary paces with whatever it has already banked
 */
export const SPECIES_DAY_STEP_BOOST = 1.2;

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
 * How many days the timestamp's year holds, 365 or 366
 */
export function getDaysInYear(timestamp: number): number {
  const year = new Date(timestamp).getUTCFullYear();

  return Math.round((Date.UTC(year + 1, 0, 1) - Date.UTC(year, 0, 1)) / DAY);
}

/**
 * The family in the spotlight today: the day of the year counted
 * around the roster, so every day features somebody and every family
 * comes up.
 *
 * The year is longer than the roster while the game is this young, so
 * the count wraps and a family is featured two or three times a year.
 * Once the families outnumber the days the wrap stops mattering: the
 * day of the year is already smaller than the roster, so it indexes
 * straight into it and the ones past the end wait for a longer year
 * that never comes. Counting by position rather than by family number
 * is what keeps a reserved gap in the numbering from costing a day
 */
export function getFeaturedFamily(timestamp: number): Families | null {
  const families = getRegisteredFamilies();

  if (families.length === 0) {
    return null;
  }
  return families[getDayOfYear(timestamp) % families.length];
}

/**
 * Whether the species belongs to the day's featured family
 */
export function isFeaturedSpecies(species: Species, timestamp: number): boolean {
  const featured = getFeaturedFamily(timestamp);

  return featured != null && getSpeciesData(species).family === featured;
}
