import { Weathers } from '../../ids/status';
import Weather from './kinds';

/** The sky a fight is fought under, where the two vocabularies meet */
/**
 * The battle sky an overworld one is fought under.
 *
 * Only the fights that happen out in the world read this: a trainer
 * standing on a rainy road is fought in the rain. Most skies have no
 * mainline counterpart and map to `None`, which is the honest answer.
 * Nothing maps to a primal sky either, since those refuse a whole type
 * outright and no walk should hand that to either side
 */
export const BATTLE_WEATHER: Record<Weather, Weathers> = {
  [Weather.Clear]: Weathers.None,
  [Weather.Cloudy]: Weathers.None,
  [Weather.Overcast]: Weathers.None,
  [Weather.Breezy]: Weathers.None,
  [Weather.Drizzle]: Weathers.Rain,
  [Weather.Rain]: Weathers.Rain,
  [Weather.Downpour]: Weathers.Rain,
  [Weather.Thunderstorm]: Weathers.Rain,
  [Weather.Mist]: Weathers.Fog,
  [Weather.Fog]: Weathers.Fog,
  [Weather.Haze]: Weathers.Sunny,
  [Weather.Frost]: Weathers.Snow,
  [Weather.Snow]: Weathers.Snow,
  [Weather.Blizzard]: Weathers.Hail,
  [Weather.Hail]: Weathers.Hail,
  [Weather.Sandstorm]: Weathers.Sandstorm,
  [Weather.DustHaze]: Weathers.Sandstorm,
  [Weather.Heatwave]: Weathers.Sunny,
  [Weather.FallingAsh]: Weathers.Sandstorm,
  // The showpieces are worth what they are met under, not what they
  // are fought under: none of the four has a sky the engine knows
  [Weather.Aurora]: Weathers.None,
  [Weather.Rainbow]: Weathers.None,
  [Weather.PollenDrift]: Weathers.None,
  [Weather.MeteorShower]: Weathers.None,
  [Weather.FataMorgana]: Weathers.None,
  [Weather.DarkDay]: Weathers.None,
  [Weather.Fogbow]: Weathers.None,
};

export function toBattleWeather(weather: Weather): Weathers {
  return BATTLE_WEATHER[weather];
}
