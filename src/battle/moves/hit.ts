import { EventPriority } from '../../core/event-emitter';
import { MoveAttackFlags, Moves } from '../../data/ids/moves';
import { getMoveData } from '../../data/moves';
import type { Battle } from '../core';
import { BattleEvents, MoveTargetType } from '../events';

const HIT_MOVES = new Set([
  Moves.Tackle,
  Moves.VineWhip,
  Moves.RazorLeaf,
  Moves.SolarBeam,
  Moves.BodySlam,
  Moves.TakeDown,
]);

export function setupHitMoves(battle: Battle) {
  battle.on(BattleEvents.UnitTriggerMoveEffect, EventPriority.Exact, event => {
    if (
      HIT_MOVES.has(event.move) &&
      event.target.type === MoveTargetType.Unit &&
      event.steps === 0
    ) {
      event.source.attack(
        event.target.unit,
        event.move,
        event.source.checkMovePower(event.move, event.target) ?? 0,
        event.source.checkMoveType(event.move, event.target),
        getMoveData(event.move).category,
        MoveAttackFlags.Critical,
      );
    }
  });
}
