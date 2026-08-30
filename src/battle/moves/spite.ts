import { AttackPriority, EventPriority } from '../../core/event-emitter';
import { Moves } from '../../data/ids/moves';
import type Battle from '../core';
import { BattleEvents, MoveTargetType } from '../events';
import type Unit from '../unit';

/**
 * How much longer the spited move takes to come round. PP here is how
 * often a move comes back, so what the mainline takes off the count
 * is taken off the clock instead
 */
const COOLDOWN_FACTOR = 4;

const NOT_A_MOVE = new Set<Moves>([Moves.Struggle, Moves.Attack, Moves.Spite]);

export default function setupSpite(battle: Battle): void {
  const lastUsed = new Map<Unit, Moves>();

  battle.on(BattleEvents.UnitTriggerMove, AttackPriority.Post, (event) => {
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

  function getSpitedMove(target: Unit): Moves | undefined {
    const move = target.casting?.move ?? target.channeling?.move ?? lastUsed.get(target);

    return move != null && target.moves[move] != null ? move : undefined;
  }

  battle.on(BattleEvents.CheckUnitAIMoveUsable, AttackPriority.Exact, (event) => {
    if (event.usable && event.move === Moves.Spite) {
      event.usable =
        event.target.type === MoveTargetType.Unit && getSpitedMove(event.target.unit) !== undefined;
    }
  });

  battle.on(BattleEvents.UnitTriggerMoveEffect, AttackPriority.Exact, (event) => {
    if (event.move !== Moves.Spite || event.target.type !== MoveTargetType.Unit) {
      return;
    }

    const target = event.target.unit;
    const move = getSpitedMove(target);

    if (move === undefined) {
      event.source.triggerMoveEffectFailed(event.move, event.target, event.steps);
      return;
    }

    // A move already cooling has its wait stretched; one that is ready
    // is put on a cooldown it has to sit out first
    if (target.moves[move]?.cooldown == null) {
      target.startCooldown(move, { type: MoveTargetType.Unit, unit: target });
    }

    const cooldown = target.moves[move]?.cooldown;

    if (cooldown != null) {
      target.updateCooldown(move, { duration: cooldown.duration * COOLDOWN_FACTOR });
    }
  });
}
