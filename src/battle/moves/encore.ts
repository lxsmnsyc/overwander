import { AttackPriority, EventPriority } from '../../core/event-emitter';
import { Moves } from '../../data/ids/moves';
import { Statuses } from '../../data/ids/status';
import type Battle from '../core';
import { BattleEvents, EffectType, MoveTargetType } from '../events';
import { setEncoredMove } from '../status/encored';
import type Unit from '../unit';

/**
 * The two fallbacks are nobody's last move: locking a unit into
 * Struggle or into the swing it throws between cooldowns is locking
 * it out of the fight rather than into a move
 */
const NOT_A_MOVE = new Set<Moves>([Moves.Struggle, Moves.Attack, Moves.Encore]);

export default function setupEncore(battle: Battle): void {
  const lastUsed = new Map<Unit, Moves>();

  battle.on(BattleEvents.UnitTriggerMove, EventPriority.Post, (event) => {
    if (!NOT_A_MOVE.has(event.move)) {
      lastUsed.set(event.source, event.move);
    }
  });

  battle.on(BattleEvents.UnitFaints, EventPriority.Post, (event) => {
    lastUsed.delete(event.source);
  });

  battle.on(BattleEvents.UnitLeavesField, EventPriority.Post, (event) => {
    lastUsed.delete(event.source);
  });

  /**
   * What the target would be held to: the move it is using now,
   * otherwise the last one it finished. Nothing when it still knows
   * none, or is already encored
   */
  function getEncoredMove(target: Unit): Moves | undefined {
    if (target.status[Statuses.Encored] != null) {
      return undefined;
    }

    const move = target.casting?.move ?? target.channeling?.move ?? lastUsed.get(target);

    return move != null && !NOT_A_MOVE.has(move) && target.moves[move] != null ? move : undefined;
  }

  battle.on(BattleEvents.CheckUnitAIMoveUsable, AttackPriority.Exact, (event) => {
    if (event.usable && event.move === Moves.Encore) {
      event.usable =
        event.target.type === MoveTargetType.Unit &&
        getEncoredMove(event.target.unit) !== undefined;
    }
  });

  battle.on(BattleEvents.UnitTriggerMoveEffect, EventPriority.Exact, (event) => {
    if (event.move !== Moves.Encore || event.target.type !== MoveTargetType.Unit) {
      return;
    }

    const target = event.target.unit;
    const move = getEncoredMove(target);

    if (move === undefined) {
      event.source.triggerMoveEffectFailed(event.move, event.target, event.steps);
      return;
    }

    setEncoredMove(target, move);
    target.addStatus(Statuses.Encored, {
      type: EffectType.Move,
      move: Moves.Encore,
      unit: event.source,
    });
  });
}
