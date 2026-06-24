import { Weathers } from '../data/ids/status';
import { Battle } from './core';

export function isWeatherSunny(battle: Battle) {
  return (
    !battle.weather.disabled &&
    (battle.weather.current === Weathers.Sunny ||
      battle.weather.current === Weathers.ExtremeSunny)
  );
}

export function isWeatherRainy(battle: Battle) {
  return (
    !battle.weather.disabled &&
    (battle.weather.current === Weathers.Rain ||
      battle.weather.current === Weathers.HeavyRain)
  );
}
