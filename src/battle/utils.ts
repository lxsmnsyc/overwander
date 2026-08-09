import { ItemFlags, type Items } from '../data/ids/items';
import { type Statuses, Weathers } from '../data/ids/status';
import { getItemData } from '../data/items';
import type Unit from './unit';

/**
 * Whether the unit holds any item
 */
export function holdsAnyItem(unit: Unit): boolean {
  for (const held of Object.values(unit.items)) {
    if (held) {
      return true;
    }
  }
  return false;
}

/**
 * Holdable items currently occupying the unit's item slots (disabled
 * ones included); compared against the battle's item limit
 */
export function countHeldItems(unit: Unit): number {
  let count = 0;

  for (const key in unit.items) {
    // tsc requires the assertion to index the Items-mapped record;
    // tsgolint resolves the const enum to number and disagrees
    // oxlint-disable-next-line typescript/no-unnecessary-type-assertion
    const item = Number(key) as Items;

    if (unit.items[item] != null && getItemData(item).flags & ItemFlags.Holdable) {
      count += 1;
    }
  }

  return count;
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

export function isWeatherHail(unit: Unit): boolean {
  const weather = unit.checkWeather();
  return weather === Weathers.Hail || weather === Weathers.Snow;
}
