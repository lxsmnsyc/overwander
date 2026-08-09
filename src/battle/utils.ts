import { Types } from '../data/constants/types';
import { Statuses, Weathers } from '../data/ids/status';
import type Unit from './unit';

/**
 * Whether the unit stands on the ground. The Grounded status (e.g.
 * Gravity, Smack Down) forces it; the Floating status (e.g. a held
 * Balloon, Fly's airborne step) and the Flying type are airborne.
 * Future airborne traits (Levitate, Magnet Rise) belong here too.
 */
export function isUnitGrounded(unit: Unit): boolean {
  if (unit.status[Statuses.Grounded] != null) {
    return true;
  }
  return unit.status[Statuses.Floating] == null && !unit.types.has(Types.Flying);
}

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
