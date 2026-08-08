import { EventPriority } from '../../core/event-emitter';
import { Moves } from '../../data/ids/moves';
import type Battle from '../core';
import { BattleEvents, MoveTargetType } from '../events';
import type Unit from '../unit';

// https://bulbapedia.bulbagarden.net/wiki/Mirror_Move_(move)
export default function setupMirrorMove(battle: Battle): void {
  const lastMove = new Map<Unit, Moves>();

  // Track the last move each unit used
  battle.on(BattleEvents.UnitTriggerMove, EventPriority.Post, (event) => {
    if (event.move !== Moves.MirrorMove) {
      lastMove.set(event.source, event.move);
    }
  });

  battle.on(BattleEvents.UnitFaints, EventPriority.Post, (event) => {
    lastMove.delete(event.source);
  });

  battle.on(BattleEvents.UnitLeavesField, EventPriority.Post, (event) => {
    lastMove.delete(event.source);
  });

  battle.on(BattleEvents.UnitTriggerMoveEffect, EventPriority.Exact, (event) => {
    if (event.move !== Moves.MirrorMove || event.target.type !== MoveTargetType.Unit) {
      return;
    }

    const copied = lastMove.get(event.target.unit);

    if (copied == null) {
      event.source.triggerMoveEffectFailed(Moves.MirrorMove, event.target, event.steps);
      return;
    }

    // Use the copied move back at the original user, mirroring the
    // finish-cast flow so multi-step moves channel their later steps
    const steps = event.source.checkMoveSteps(copied, event.target);

    event.source.triggerMove(copied, event.target, steps);

    if (steps > 0) {
      event.source.channel(copied, event.target, steps - 1);
    }
  });
}
