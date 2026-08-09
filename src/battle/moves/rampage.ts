import { EventPriority } from '../../core/event-emitter';
import { MoveAttackFlags, Moves } from '../../data/ids/moves';
import { Statuses } from '../../data/ids/status';
import { getMoveData } from '../../data/moves';
import type Battle from '../core';
import { BattleEvents, EffectType, MoveTargetType } from '../events';

/**
 * Rampage moves (Thrash, Petal Dance): multi-step moves where every
 * step lands the same full attack, and the fatigue at the end leaves
 * the user confused. The shared hit handler already covers the final
 * step's strike, so only the earlier steps strike here.
 */
const RAMPAGE_MOVES = new Set<Moves>([Moves.Thrash, Moves.PetalDance]);

export default function setupRampageMoves(battle: Battle): void {
  battle.on(BattleEvents.UnitTriggerMoveEffect, EventPriority.Exact, (event) => {
    if (
      RAMPAGE_MOVES.has(event.move) &&
      event.steps > 0 &&
      event.target.type === MoveTargetType.Unit
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

  // Fatigue: the user comes out of the rampage confused
  battle.on(BattleEvents.UnitTriggerMoveEffect, EventPriority.Post, (event) => {
    if (RAMPAGE_MOVES.has(event.move) && event.steps === 0 && event.source.alive) {
      event.source.addStatus(Statuses.Confused, {
        type: EffectType.Move,
        move: event.move,
        unit: event.source,
      });
    }
  });
}
