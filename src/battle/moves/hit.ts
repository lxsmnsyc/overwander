import { EventPriority } from '../../core/event-emitter';
import { MoveAttackFlags, Moves } from '../../data/ids/moves';
import { getMoveData } from '../../data/moves';
import { Battle, Unit } from '../core';
import { BattleEvents, MoveTargetType } from '../events';

const HIT_MOVES = new Set([Moves.Tackle, Moves.VineWhip]);

export function runHit(move: Moves, source: Unit, target: Unit) {
  source.attack(
    target,
    move,
    source.checkMovePower(move, target) ?? 0,
    source.checkMoveType(move, target),
    getMoveData(move).category,
    MoveAttackFlags.Critical,
  );
}

export function setupHitMoves(battle: Battle) {
  battle.on(BattleEvents.TriggerMoveEffect, EventPriority.Exact, event => {
    if (
      HIT_MOVES.has(event.move) &&
      event.target.type === MoveTargetType.Unit
    ) {
      runHit(event.move, event.source, event.target.unit);
    }
  });
}
