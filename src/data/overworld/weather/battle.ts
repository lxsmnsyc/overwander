import type { Weathers } from '../../ids/status';
import type Weather from './kinds';
import { BATTLE_WEATHER } from './kinds';

/**
 * The battle sky an overworld one is fought under.
 *
 * Only the fights that happen out in the world read this: a trainer
 * standing on a rainy road is fought in the rain. The table is
 * `battle:` in `kinds.yaml`
 */
export { BATTLE_WEATHER };

export function toBattleWeather(weather: Weather): Weathers {
  return BATTLE_WEATHER[weather];
}
