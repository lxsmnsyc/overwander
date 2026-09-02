import { AttackPriority, EventPriority } from '../../core/event-emitter';
import { Moves } from '../../data/ids/moves';
import type Battle from '../core';
import { BattleEvents, MoveTargetType } from '../events';
import type Unit from '../unit';

const NOT_MIRRORED = new Set<Moves>([Moves.MirrorMove, Moves.Struggle, Moves.Attack, Moves.Sketch]);

// https://bulbapedia.bulbagarden.net/wiki/Mirror_Move_(move)
export default function setupMirrorMove(battle: Battle): void {
  const lastMove = new Map<Unit, Moves>();

  // Track the last move each unit used. Neither of the fallbacks is
  // one of them: mirroring what somebody threw because they had
  // nothing left would charge the mirror a quarter of its own health
  // for the privilege, and mirroring a swing they made while waiting
  // on a cooldown spends a real move to copy filler. Nor Sketch,
  // which is spent when it is drawn and cannot be drawn twice
  battle.on(BattleEvents.UnitTriggerMove, AttackPriority.Post, (event) => {
    if (!NOT_MIRRORED.has(event.move)) {
      lastMove.set(event.source, event.move);
    }
  });

  battle.on(BattleEvents.UnitFaints, EventPriority.Post, (event) => {
    lastMove.delete(event.source);
  });

  battle.on(BattleEvents.UnitLeavesField, EventPriority.Post, (event) => {
    lastMove.delete(event.source);
  });

  // Nothing to mirror is nothing to do: the AI is refused Mirror Move
  // against a target that has not used one yet
  battle.on(BattleEvents.CheckUnitAIMoveUsable, AttackPriority.Exact, (event) => {
    if (event.usable && event.move === Moves.MirrorMove) {
      event.usable =
        event.target.type === MoveTargetType.Unit && lastMove.get(event.target.unit) != null;
    }
  });

  battle.on(BattleEvents.UnitTriggerMoveEffect, AttackPriority.Exact, (event) => {
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
