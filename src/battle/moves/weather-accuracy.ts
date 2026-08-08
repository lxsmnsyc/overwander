import { EventPriority } from '../../core/event-emitter';
import { Moves } from '../../data/ids/moves';
import { Weathers } from '../../data/ids/status';
import type { Battle } from '../core';
import { BattleEvents } from '../events';
import { isWeatherRainy, isWeatherSunny } from '../utils';

interface WeatherAccuracyConfig {
  /**
   * Accuracy override under the weather; null removes the accuracy
   * check entirely (the move never misses)
   */
  rain?: number | null;
  sun?: number | null;
  hail?: number | null;
}

const WEATHER_ACCURACY_MOVES: { [key in Moves]?: WeatherAccuracyConfig } = {
  // https://bulbapedia.bulbagarden.net/wiki/Thunder_(move)
  [Moves.Thunder]: { rain: null, sun: 50 },
  // https://bulbapedia.bulbagarden.net/wiki/Blizzard_(move)
  [Moves.Blizzard]: { hail: null },
};

export function setupWeatherAccuracyMoves(battle: Battle) {
  battle.on(BattleEvents.CheckUnitMoveAccuracy, EventPriority.Post, event => {
    const config = WEATHER_ACCURACY_MOVES[event.move];

    if (!config || event.accuracy == null) {
      return;
    }

    let override: number | null | undefined;

    if (isWeatherRainy(event.source)) {
      override = config.rain;
    } else if (isWeatherSunny(event.source)) {
      override = config.sun;
    } else {
      const weather = event.source.checkWeather();

      if (weather === Weathers.Hail || weather === Weathers.Snow) {
        override = config.hail;
      }
    }

    if (override !== undefined) {
      event.accuracy = override ?? undefined;
    }
  });
}
