import { EventPriority } from '../../core/event-emitter';
import { Moves } from '../../data/ids/moves';
import type { Battle } from '../core';
import { BattleEvents, MoveTargetType } from '../events';
import type { Unit } from '../unit';

const BANNED_MOVES = new Set<Moves>([
  // ...
]);

export function setupMimic(battle: Battle) {
  const lastCast = new Map<Unit, Moves>();

  battle.on(BattleEvents.UnitTriggerMove, EventPriority.Post, event => {
    if (!BANNED_MOVES.has(event.move)) {
      lastCast.set(event.source, event.move);
    }
  });

  battle.on(BattleEvents.UnitTriggerMoveEffect, EventPriority.Exact, event => {
    if (event.move === Moves.Mimic) {
      if (event.target.type === MoveTargetType.Unit) {
        const targetMove = lastCast.get(event.target.unit);

        if (targetMove && !event.source.moves[targetMove]) {
          event.source.finishCooldown(Moves.Mimic);
          event.source.removeMove(Moves.Mimic);
          event.source.addMove(targetMove);
          return;
        }
      }
      event.source.triggerMoveEffectFailed(
        Moves.Mimic,
        event.target,
        event.steps,
      );
    }
  });
}
