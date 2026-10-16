import { Weathers } from '../data/ids/status';
import type Team from './team';
import type Unit from './unit';

// The skies nothing else can push aside
const PRIMAL_WEATHERS = new Set<Weathers>([
  Weathers.ExtremeSunny,
  Weathers.HeavyRain,
  Weathers.StrongWinds,
]);

export function isPrimalWeather(weather: Weathers): boolean {
  return PRIMAL_WEATHERS.has(weather);
}

/**
 * The sky over a team: the field's own weather where there is one, and
 * the team's otherwise.
 *
 * It is what is **drawn**, which is not what a unit stands under. A
 * unit's own answer can be cleared by what it carries, and an umbrella
 * is not a hole in the clouds
 */
export function skyOverTeam(team: Team): Weathers {
  const battle = team.battle;

  if (!battle.weather.disabled && battle.weather.current !== Weathers.None) {
    return battle.weather.current;
  }
  if (!team.weather.disabled && team.weather.current !== Weathers.None) {
    return team.weather.current;
  }
  return Weathers.None;
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
