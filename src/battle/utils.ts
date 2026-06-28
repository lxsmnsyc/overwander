import { Weathers } from '../data/ids/status';
import type { Unit } from './unit';

export function isWeatherSunny(unit: Unit) {
  const weather = unit.checkWeather();
  return weather === Weathers.Sunny || weather === Weathers.ExtremeSunny;
}

export function isWeatherRainy(unit: Unit) {
  const weather = unit.checkWeather();
  return weather === Weathers.Rain || weather === Weathers.HeavyRain;
}
