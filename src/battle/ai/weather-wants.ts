import type Abilities from '../../data/ids/abilities';
import type { Weathers } from '../../data/ids/status';
import type Unit from '../unit';

/** The abilities that thrive under each sky, filled in by the abilities themselves */
const wants = new Map<Weathers, Set<Abilities>>();

/**
 * Record that an ability thrives under these skies, so the AI weighs a
 * weather move by who on the field would gain from it. Called once, at
 * import, from the ability's own module
 */
export function registerWeatherWant(ability: Abilities, weathers: Weathers[]): void {
  for (const weather of weathers) {
    let holders = wants.get(weather);

    if (holders == null) {
      holders = new Set();
      wants.set(weather, holders);
    }
    holders.add(ability);
  }
}

/**
 * Whether the unit holds an ability that thrives under the weather.
 * Asked through `hasAbility`, so a foe's unrevealed ability stays hidden
 */
export function wantsWeather(unit: Unit, weather: Weathers): boolean {
  for (const ability of wants.get(weather) ?? []) {
    if (unit.hasAbility(ability)) {
      return true;
    }
  }
  return false;
}
