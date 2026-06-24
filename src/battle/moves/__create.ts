import { EventPriority } from '../../core/event-emitter';
import { MoveAttackFlags, type Moves } from '../../data/ids/moves';
import { getMoveData } from '../../data/moves';
import { Battle } from '../core';
import { BattleEvents, MoveTargetType } from '../events';

export function setupHitMove(battle: Battle, move: Moves) {
  battle.on(BattleEvents.TriggerMoveEffect, EventPriority.Exact, event => {
    if (event.move === move && event.target.type === MoveTargetType.Unit) {
      const currentTarget = event.target.unit;
      event.source.attack(
        currentTarget,
        event.move,
        event.source.checkMovePower(move, currentTarget) ?? 0,
        event.source.checkMoveType(move, currentTarget),
        getMoveData(event.move).category,
        MoveAttackFlags.Critical,
      );
    }
  });
}
