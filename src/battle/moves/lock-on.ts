import { AttackPriority, EventPriority } from '../../core/event-emitter';
import { Moves } from '../../data/ids/moves';
import type Battle from '../core';
import { BattleEvents, MoveTargetType } from '../events';
import turns from '../turn';
import type Unit from '../unit';

/**
 * The moves that take aim. Neither deals anything: what they buy is
 * the next move landing whatever the target does about it
 */
const AIMING_MOVES = new Set<Moves>([Moves.LockOn, Moves.MindReader]);

/**
 * How long the aim holds. The mainline spends it on the next turn;
 * here it is a window, so a slow follow-up can still use it
 */
const DURATION = turns(2);

interface Aim {
  target: Unit;
  remaining: number;
}

export default function setupLockOn(battle: Battle): void {
  const aims = new Map<Unit, Aim>();

  const timer = battle.on(BattleEvents.Tick, EventPriority.Post, (event) => {
    for (const [unit, aim] of [...aims]) {
      aim.remaining -= event.duration;

      if (aim.remaining <= 0) {
        aims.delete(unit);
      }
    }

    if (aims.size === 0) {
      timer.stop();
    }
  });

  timer.stop();

  battle.on(BattleEvents.UnitTriggerMoveEffect, AttackPriority.Exact, (event) => {
    if (!AIMING_MOVES.has(event.move) || event.target.type !== MoveTargetType.Unit) {
      return;
    }

    aims.set(event.source, { target: event.target.unit, remaining: DURATION });
    timer.start();
  });

  // No accuracy at all is how this engine says a move cannot miss
  battle.on(BattleEvents.CheckUnitMoveAccuracy, EventPriority.Post, (event) => {
    const aim = aims.get(event.source);

    if (
      aim == null ||
      event.target.type !== MoveTargetType.Unit ||
      aim.target !== event.target.unit ||
      AIMING_MOVES.has(event.move)
    ) {
      return;
    }

    event.accuracy = undefined;
    aims.delete(event.source);
  });

  battle.on(BattleEvents.UnitFaints, EventPriority.Post, (event) => {
    aims.delete(event.source);
  });

  battle.on(BattleEvents.UnitLeavesField, EventPriority.Post, (event) => {
    aims.delete(event.source);
  });
}
