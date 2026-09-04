import { AttackPriority } from '../../core/event-emitter';
import { Moves } from '../../data/ids/moves';
import { Statuses } from '../../data/ids/status';
import type Battle from '../core';
import { BattleEvents, EffectType } from '../events';
import type Unit from '../unit';

/**
 * The guards, and what each one puts on the user. Protect and Detect
 * turn a hit away; Endure takes it and refuses to fall
 */
const GUARD_MOVES: { [key in Moves]?: Statuses } = {
  [Moves.Protect]: Statuses.Protected,
  [Moves.Detect]: Statuses.Protected,
  [Moves.Endure]: Statuses.Enduring,
};

/**
 * A guard held twice over is a unit nothing can reach, so the second
 * one in a row fails. The mainline halves the odds each time; a flat
 * refusal is the same promise without a die roll
 */
export default function setupProtectMoves(battle: Battle): void {
  const guarded = new WeakSet<Unit>();

  battle.on(BattleEvents.UnitTriggerMove, AttackPriority.Post, (event) => {
    if (GUARD_MOVES[event.move] == null) {
      guarded.delete(event.source);
    }
  });

  battle.on(BattleEvents.CheckUnitAIMoveUsable, AttackPriority.Exact, (event) => {
    if (event.usable && GUARD_MOVES[event.move] != null && guarded.has(event.source)) {
      event.usable = false;
    }
  });

  battle.on(BattleEvents.UnitTriggerMoveEffect, AttackPriority.Exact, (event) => {
    const status = GUARD_MOVES[event.move];

    // Explicit null check: the first Statuses enum member is 0
    if (status == null) {
      return;
    }

    if (guarded.has(event.source)) {
      event.source.triggerMoveEffectFailed(event.move, event.target, event.steps);
      return;
    }

    guarded.add(event.source);

    event.source.addStatus(status, {
      type: EffectType.Move,
      move: event.move,
      unit: event.source,
    });
  });
}
