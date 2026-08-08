import { EventPriority } from '../../core/event-emitter';
import { Moves } from '../../data/ids/moves';
import { Weathers } from '../../data/ids/status';
import type Battle from '../core';
import { BattleEvents } from '../events';
import { isWeatherSunny } from '../utils';

// Weathers that halve Solar Beam's power
const HALVING_WEATHERS = new Set<Weathers>([
  Weathers.Fog,
  Weathers.Hail,
  Weathers.Rain,
  Weathers.HeavyRain,
  Weathers.Sandstorm,
]);

export default function setupSolarBeam(battle: Battle): void {
  battle.on(BattleEvents.CheckUnitMoveSteps, EventPriority.Post, (event) => {
    if (event.move === Moves.SolarBeam && isWeatherSunny(event.source)) {
      event.steps = 0;
    }
  });

  battle.on(BattleEvents.CheckUnitMovePower, EventPriority.Post, (event) => {
    if (
      event.move === Moves.SolarBeam &&
      event.power != null &&
      HALVING_WEATHERS.has(event.source.checkWeather())
    ) {
      event.power /= 2;
    }
  });
}
