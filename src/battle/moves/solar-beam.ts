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

/** The two that gather sunlight before they fire */
const SOLAR_MOVES = new Set<Moves>([Moves.SolarBeam, Moves.SolarBlade]);

export default function setupSolarBeam(battle: Battle): void {
  battle.on(BattleEvents.CheckUnitMoveSteps, EventPriority.Post, (event) => {
    if (SOLAR_MOVES.has(event.move) && isWeatherSunny(event.source)) {
      event.steps = 0;
    }
  });

  battle.on(BattleEvents.CheckUnitMovePower, EventPriority.Post, (event) => {
    if (
      SOLAR_MOVES.has(event.move) &&
      event.power != null &&
      HALVING_WEATHERS.has(event.source.checkWeather())
    ) {
      event.power /= 2;
    }
  });
}
