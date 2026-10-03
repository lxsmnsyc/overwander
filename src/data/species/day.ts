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
 * The families in the spotlight today: each family's day is its id
 * counted around the year. There are more families than days, so some
 * days feature two, and every family comes up once a year
 */
export function getFeaturedFamilies(timestamp: number): Families[] {
  const day = getDayOfYear(timestamp);
  const days = getDaysInYear(timestamp);
  const featured: Families[] = [];

  for (const family of getRegisteredFamilies()) {
    if (family % days === day) {
      featured.push(family);
    }
  }
  return featured;
}

/**
 * Whether the species belongs to one of the day's featured families
 */
export function isFeaturedSpecies(species: Species, timestamp: number): boolean {
  return getFeaturedFamilies(timestamp).includes(getSpeciesData(species).family);
}
