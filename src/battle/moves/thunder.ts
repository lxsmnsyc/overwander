import { EventPriority } from '../../core/event-emitter';
import { Moves } from '../../data/ids/moves';
import type { Battle } from '../core';
import { BattleEvents } from '../events';
import { isWeatherRainy, isWeatherSunny } from '../utils';

// https://bulbapedia.bulbagarden.net/wiki/Thunder_(move)
export function setupThunder(battle: Battle) {
  battle.on(BattleEvents.CheckUnitMoveAccuracy, EventPriority.Post, event => {
    if (event.move === Moves.Thunder && event.accuracy != null) {
      if (isWeatherRainy(event.source)) {
        // Never misses in rain
        event.accuracy = undefined;
      } else if (isWeatherSunny(event.source)) {
        event.accuracy = 50;
      }
    }
  });
}
