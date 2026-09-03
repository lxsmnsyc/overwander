import { AttackPriority } from '../../core/event-emitter';
import { Moves } from '../../data/ids/moves';
import { Statuses } from '../../data/ids/status';
import type Battle from '../core';
import { BattleEvents, EffectType, MoveTargetType } from '../events';

/**
 * The moves that hold a target where it stands. They deal nothing:
 * what they take away is the way out
 */
const NO_ESCAPE_MOVES = new Set<Moves>([Moves.MeanLook, Moves.SpiderWeb, Moves.Block]);

export default function setupNoEscapeMoves(battle: Battle): void {
  battle.on(BattleEvents.CheckUnitAIMoveUsable, AttackPriority.Exact, (event) => {
    if (event.usable && NO_ESCAPE_MOVES.has(event.move)) {
      event.usable =
        event.target.type === MoveTargetType.Unit &&
        event.target.unit.status[Statuses.Cornered] == null;
    }
  });

  battle.on(BattleEvents.UnitTriggerMoveEffect, AttackPriority.Exact, (event) => {
    if (!NO_ESCAPE_MOVES.has(event.move) || event.target.type !== MoveTargetType.Unit) {
      return;
    }

    event.target.unit.addStatus(Statuses.Cornered, {
      type: EffectType.Move,
      move: event.move,
      unit: event.source,
    });
  });
}
