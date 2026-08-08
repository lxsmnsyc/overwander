import { EventPriority } from '../../core/event-emitter';
import { Moves } from '../../data/ids/moves';
import type Battle from '../core';
import { BattleEvents, EffectType } from '../events';

// https://bulbapedia.bulbagarden.net/wiki/Haze_(move)
export default function setupHaze(battle: Battle): void {
  battle.on(BattleEvents.UnitTriggerMoveEffect, EventPriority.Exact, (event) => {
    if (event.move !== Moves.Haze) {
      return;
    }

    const cause = {
      type: EffectType.Move,
      move: event.move,
      unit: event.source,
    } as const;

    // Every unit's stat stages reset, the user's included
    for (const unit of battle.units()) {
      if (unit.alive) {
        unit.resetStages(cause);
      }
    }
  });
}
