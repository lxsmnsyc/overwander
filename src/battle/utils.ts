import { type Statuses, Weathers } from '../data/ids/status';
import type Unit from './unit';

/**
 * Whether the unit currently has any status from the group
 */
export function hasAnyStatus(unit: Unit, statuses: Iterable<Statuses>): boolean {
  for (const status of statuses) {
    if (unit.status[status] != null) {
      return true;
    }
  }
  return false;
}

export function isWeatherSunny(unit: Unit): boolean {
  const weather = unit.checkWeather();
  return weather === Weathers.Sunny || weather === Weathers.ExtremeSunny;
}

export function isWeatherRainy(unit: Unit): boolean {
  const weather = unit.checkWeather();
  return weather === Weathers.Rain || weather === Weathers.HeavyRain;
}

export function isWeatherSandstorm(unit: Unit): boolean {
  return unit.checkWeather() === Weathers.Sandstorm;
}
