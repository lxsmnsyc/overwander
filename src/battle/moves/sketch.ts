import { AttackPriority, EventPriority } from '../../core/event-emitter';
import { Moves } from '../../data/ids/moves';
import type Battle from '../core';
import { BattleEvents, type MoveTarget, MoveTargetType } from '../events';
import type Unit from '../unit';

/**
 * What cannot be sketched: the two fallbacks, for the same reason
 * Mimic refuses them, and Sketch itself, which would copy the
 * copying rather than a move
 */
const BANNED = new Set<Moves>([Moves.Struggle, Moves.Attack, Moves.Sketch]);

/**
 * Sketch takes the move for good, where Mimic borrows it: the copy
 * replaces Sketch in the move set and there is no getting it back
 */
export default function setupSketch(battle: Battle): void {
  const lastCast = new Map<Unit, Moves>();

  battle.on(BattleEvents.UnitTriggerMove, EventPriority.Post, (event) => {
    if (!BANNED.has(event.move)) {
      lastCast.set(event.source, event.move);
    }
  });

  battle.on(BattleEvents.UnitFaints, EventPriority.Post, (event) => {
    lastCast.delete(event.source);
  });

  function sketchable(source: Unit, target: MoveTarget): Moves | undefined {
    if (target.type !== MoveTargetType.Unit) {
      return undefined;
    }

    const copied = lastCast.get(target.unit);

    return copied != null && source.moves[copied] == null ? copied : undefined;
  }

  battle.on(BattleEvents.CheckUnitAIMoveUsable, AttackPriority.Exact, (event) => {
    if (event.usable && event.move === Moves.Sketch) {
      event.usable = sketchable(event.source, event.target) !== undefined;
    }
  });

  battle.on(BattleEvents.UnitTriggerMoveEffect, EventPriority.Exact, (event) => {
    if (event.move !== Moves.Sketch || event.target.type !== MoveTargetType.Unit) {
      return;
    }

    const copied = sketchable(event.source, event.target);

    if (copied === undefined) {
      event.source.triggerMoveEffectFailed(event.move, event.target, event.steps);
      return;
    }

    event.source.finishCooldown(Moves.Sketch);
    event.source.removeMove(Moves.Sketch);
    event.source.addMove(copied);
    // Kept on the unit so the fight can report it: what a Sketch
    // becomes outlives the battle it was drawn in
    event.source.sketched = copied;
  });
}
