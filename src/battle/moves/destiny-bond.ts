import { EventPriority } from '../../core/event-emitter';
import { Moves } from '../../data/ids/moves';
import { Statuses } from '../../data/ids/status';
import type Battle from '../core';
import { BattleEvents, EffectType } from '../events';

export default function setupDestinyBond(battle: Battle): void {
  battle.on(BattleEvents.UnitTriggerMoveEffect, EventPriority.Exact, (event) => {
    if (event.move === Moves.DestinyBond) {
      event.source.addStatus(Statuses.Bonded, {
        type: EffectType.Move,
        move: event.move,
        unit: event.source,
      });
    }
  });
}
