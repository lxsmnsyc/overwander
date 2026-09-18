import type { Types } from '../../constants/types';
import Weather, { WEATHER_TYPES } from './kinds';

/** What a sky is worth to whatever is met under it */
/**
 * The lowest every value comes out at for a pokemon the sky favours.
 *
 * It is worth something only to what the weather is actually about: a
 * rat met in the rain is a rat, and a Water type met in it is the
 * reason to go out. Rain over everything would be a floor under the
 * whole game rather than a reason to walk anywhere
 */
export const WEATHER_MIN_IV = 10;

/**
 * How much more heavily a sky crowds its own types into a chunk's
 * spawns.
 *
 * The same shape as a species day, and deliberately gentler: a day is
 * one family for one day and a sky is a whole type for an hour, so
 * four times the weight would leave a rainy chunk holding nothing but
 * Water. The bands do not move either way, so a favoured rare stays
 * rare and only wins its band more often.
 *
 * The skies that favour *everything* are left out. Lifting every
 * entry by the same factor is the pool it started with, and those
 * four are the rarest in the game: what they are worth is already
 * written into what they hand over
 */
export const WEATHER_SPAWN_BOOST = 2;

/**
 * Whether this sky is kind to a pokemon carrying these types.
 *
 * Every sky picks a type or two. A meteor shower picks none, because it
 * picks all of them: whatever is standing under it is worth catching,
 * which is what makes the rarest sky in the game worth walking into
 * whoever is walking
 */
export function isWeatherFavored(weather: Weather, types: Types[]): boolean {
  if (favorsEverything(weather)) {
    return true;
  }
  const favored = new Set(WEATHER_TYPES[weather]);

  for (const type of types) {
    if (favored.has(type)) {
      return true;
    }
  }
  return false;
}

/**
 * The types a sky crowds into a chunk's spawns, or nothing where it
 * crowds none.
 *
 * A sky that is kind to everything favours nothing here: boosting
 * every entry by the same factor hands back the pool it started with,
 * and those four are the rarest skies in the game, whose worth is
 * already in what they hand over rather than in who turns up
 */
export function spawnFavoredTypes(weather: Weather): Types[] {
  return favorsEverything(weather) ? [] : WEATHER_TYPES[weather];
}

/** Whether the sky is kind to everything rather than to a type of it */
export function favorsEverything(weather: Weather): boolean {
  return (
    weather === Weather.MeteorShower ||
    weather === Weather.FataMorgana ||
    weather === Weather.DarkDay ||
    weather === Weather.Fogbow
  );
}

/**
 * What a meteor shower multiplies the shiny odds by: the Shiny Charm's
 * worth, since the sky is rare enough that finding one should feel like it
 */
export const METEOR_SHOWER_SHINY_BOOST = 8;

/**
 * What a fata morgana multiplies the odds of a hidden ability by.
 *
 * The meteor shower's opposite number: a mirage shows what is not there
 * to be seen, so what it is worth is what the pokemon was hiding rather
 * than what its coat looks like
 */
export const FATA_MORGANA_HIDDEN_BOOST = 2;

/**
 * What this sky multiplies the odds of a shiny coat by.
 *
 * Asked as a question rather than read off a table, because only one
 * sky answers anything but 1 and a table of twenty-three ones would
 * say less than this does
 */
export function shinyBoostOf(weather: Weather): number {
  return weather === Weather.MeteorShower ? METEOR_SHOWER_SHINY_BOOST : 1;
}

/**
 * How often a meeting under a fogbow walks out with room for a fifth
 * move, and how often for a sixth as well.
 *
 * Nothing else in the game widens a pokemon's move list, so this is
 * the sky worth hunting under for one. What goes in the extra room is
 * a move the line would otherwise have had to be bred or taught for
 */
export const FOGBOW_MOVE_CHANCE = 1 / 4;
export const FOGBOW_SECOND_MOVE_CHANCE = 1 / 16;

/** The most room a fogbow ever hands over, on top of the usual four */
export const FOGBOW_MOVE_SLOTS = 2;

/** Whether a meeting under this sky can walk out with room for more moves */
export function widensMoveSlots(weather: Weather): boolean {
  return weather === Weather.Fogbow;
}

/**
 * Whether anything met in the wild under this sky comes out shadowed.
 *
 * The one sky that closes a heart rather than opening something. It is
 * the meeting that is shadowed and not the pokemon: a raid prize, an
 * egg and a gift arrive under their own rules whatever the sky is
 * doing
 */
export function shadowsWildMeetings(weather: Weather): boolean {
  return weather === Weather.DarkDay;
}

/**
 * How much of what a dark day meets comes out shadowed.
 *
 * Not all of it. A sky that closed every heart under it would make the
 * shadow a property of the window rather than of the meeting, and a
 * player who found one would be collecting rather than deciding. A
 * third leaves the sky worth staying out in and every catch under it
 * still a question
 */
export const DARK_DAY_SHADOW_CHANCE = 1 / 3;

/**
 * How far a player sees under a Dark Day, in cells, walking alone.
 *
 * A cell and a half: the ring they are standing in, and enough of the
 * next one out to tell whether it is worth stepping onto. Under a sky
 * this dark that is the difference between a board you read and a
 * board you feel your way across. A buddy widens it: see
 * `ILLUMINATE_LAMP_CELLS`
 */
export const DARK_DAY_LAMP_CELLS = 1.5;

/** What this sky multiplies the odds of a hidden ability by */
export function hiddenAbilityBoostOf(weather: Weather): number {
  return weather === Weather.FataMorgana ? FATA_MORGANA_HIDDEN_BOOST : 1;
}
