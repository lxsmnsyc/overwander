import { EventPriority } from '../../core/event-emitter';
import { Moves } from '../../data/ids/moves';
import { Weathers } from '../../data/ids/status';
import type { Battle } from '../core';
import { BattleEvents } from '../events';
import { isWeatherSunny } from '../utils';

export function setupSolarBeam(battle: Battle) {
  battle.on(BattleEvents.CheckUnitMoveSteps, EventPriority.Post, event => {
    if (event.move === Moves.SolarBeam && isWeatherSunny(event.source)) {
      event.steps = 0;
    }
  });

  battle.on(BattleEvents.CheckUnitMovePower, EventPriority.Post, event => {
    if (event.move === Moves.SolarBeam && event.power != null) {
      switch (event.source.checkWeather()) {
        case Weathers.Fog:
        case Weathers.Hail:
        case Weathers.Rain:
        case Weathers.HeavyRain:
        case Weathers.Sandstorm:
          event.power /= 2;
          break;
        default:
          break;
      }
    }
  });
}
