import { AttackPriority, EventPriority } from '../../core/event-emitter';
import { Moves } from '../../data/ids/moves';
import type Battle from '../core';
import { BattleEvents, MoveTargetType } from '../events';
import type Unit from '../unit';

const BANNED_MOVES = new Set<Moves>([
  // ...
]);

export default function setupMimic(battle: Battle): void {
  const lastCast = new Map<Unit, Moves>();

  battle.on(BattleEvents.UnitTriggerMove, EventPriority.Post, (event) => {
    if (!BANNED_MOVES.has(event.move)) {
      lastCast.set(event.source, event.move);
    }
  });

  // Mimic copies the target's last move, so it needs one to copy that
  // the user does not already know
  battle.on(BattleEvents.CheckUnitAIMoveUsable, AttackPriority.Exact, (event) => {
    if (event.usable && event.move === Moves.Mimic) {
      const copied =
        event.target.type === MoveTargetType.Unit ? lastCast.get(event.target.unit) : undefined;

      event.usable = copied != null && event.source.moves[copied] == null;
    }
  });

  battle.on(BattleEvents.UnitTriggerMoveEffect, EventPriority.Exact, (event) => {
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
      event.source.triggerMoveEffectFailed(Moves.Mimic, event.target, event.steps);
    }
  });
}
