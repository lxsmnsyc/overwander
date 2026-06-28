import { EventPriority } from '../../core/event-emitter';
import { Weathers } from '../../data/ids/status';
import type { Battle } from '../core';
import { BattleEvents } from '../events';

export function setupWeatherMechanics(battle: Battle) {
  battle.on(BattleEvents.CheckUnitWeather, EventPriority.Exact, event => {
    const team = event.source.team;
    if (!team.weather.disabled && team.weather.current !== Weathers.None) {
      event.weather = team.weather.current;
    } else if (
      battle.weather.disabled &&
      battle.weather.current !== Weathers.None
    ) {
      event.weather = battle.weather.current;
    }
  });
}
