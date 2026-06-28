import { EventPriority } from '../../core/event-emitter';
import { Moves } from '../../data/ids/moves';
import { Statuses } from '../../data/ids/status';
import type { Battle } from '../core';
import { BattleEvents, EffectType, MoveTargetType } from '../events';

const STATUS_MOVES: { [key in Moves]?: Statuses } = {
  [Moves.PoisonPowder]: Statuses.Poisoned,
};

function setupUnitStatusMoves(battle: Battle) {
  battle.on(BattleEvents.UnitTriggerMoveEffect, EventPriority.Exact, event => {
    const targetStatus = STATUS_MOVES[event.move];

    if (targetStatus && event.target.type === MoveTargetType.Unit) {
      event.target.unit.addStatus(targetStatus, {
        type: EffectType.Move,
        move: event.move,
        unit: event.source,
      });
    }
  });
}

export function setupStatusMoves(battle: Battle) {
  setupUnitStatusMoves(battle);
}
