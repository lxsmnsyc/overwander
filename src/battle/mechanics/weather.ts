import { EventPriority } from '../../core/event-emitter';
import { Weathers } from '../../data/ids/status';
import type Battle from '../core';
import { BattleEvents } from '../events';

export default function setupWeatherMechanics(battle: Battle): void {
  battle.on(BattleEvents.SetWeather, EventPriority.Exact, (event) => {
    battle.weather.current = event.weather;
  });

  battle.on(BattleEvents.TeamSetWeather, EventPriority.Exact, (event) => {
    event.team.weather.current = event.weather;
  });

  // Team-local weather shadows the global battle weather
  battle.on(BattleEvents.CheckUnitWeather, EventPriority.Exact, (event) => {
    const team = event.source.team;
    if (!team.weather.disabled && team.weather.current !== Weathers.None) {
      event.weather = team.weather.current;
    } else if (!battle.weather.disabled && battle.weather.current !== Weathers.None) {
      event.weather = battle.weather.current;
    }
  });
}
