import { EventPriority } from '../../core/event-emitter';
import type Battle from '../core';
import { BattleEvents } from '../events';
import { MOVE_LOCKING_STATUS } from '../status';
import type Unit from '../unit';
import { hasAnyStatus } from '../utils';
import { chooseMove } from './choose-move';

/**
 * Drives the units: every tick, any idle unit picks its best move and
 * casts it. A unit is idle when it is not casting or channeling, has
 * no triggered move whose effect is still pending, and is not locked
 * out of using moves by a status.
 *
 * Instead of scanning the whole field every tick, the loop keeps a
 * tracking set of idle units, maintained by the lifecycle events that
 * change a unit's ability to act.
 */
export default function setupIdleAI(battle: Battle): void {
  const pendingTrigger = new Set<Unit>();
  const idle = new Set<Unit>();

  function isIdle(unit: Unit): boolean {
    return (
      unit.alive &&
      !unit.casting &&
      !unit.channeling &&
      !pendingTrigger.has(unit) &&
      !hasAnyStatus(unit, MOVE_LOCKING_STATUS)
    );
  }

  function refresh(unit: Unit): void {
    if (isIdle(unit)) {
      idle.add(unit);
    } else {
      idle.delete(unit);
    }
  }

  // --- Busy transitions ---

  battle.on(BattleEvents.UnitCast, EventPriority.Post, (event) => {
    idle.delete(event.source);
  });

  battle.on(BattleEvents.UnitChannel, EventPriority.Post, (event) => {
    idle.delete(event.source);
  });

  battle.on(BattleEvents.UnitTriggerMove, EventPriority.Post, (event) => {
    pendingTrigger.add(event.source);
    idle.delete(event.source);
  });

  battle.on(BattleEvents.UnitAddStatus, EventPriority.Post, (event) => {
    if (MOVE_LOCKING_STATUS.has(event.status)) {
      idle.delete(event.source);
    }
  });

  battle.on(BattleEvents.UnitFaints, EventPriority.Post, (event) => {
    pendingTrigger.delete(event.source);
    idle.delete(event.source);
  });

  battle.on(BattleEvents.UnitLeavesField, EventPriority.Post, (event) => {
    pendingTrigger.delete(event.source);
    idle.delete(event.source);
  });

  // --- Idle transitions (re-verified through the full check) ---

  battle.on(BattleEvents.UnitFinishCast, EventPriority.Post, (event) => {
    refresh(event.source);
  });

  battle.on(BattleEvents.UnitStopCast, EventPriority.Post, (event) => {
    refresh(event.source);
  });

  battle.on(BattleEvents.UnitFinishChannel, EventPriority.Post, (event) => {
    refresh(event.source);
  });

  battle.on(BattleEvents.UnitStopChannel, EventPriority.Post, (event) => {
    refresh(event.source);
  });

  battle.on(BattleEvents.UnitTriggerMoveEnd, EventPriority.Post, (event) => {
    pendingTrigger.delete(event.source);
    refresh(event.source);
  });

  battle.on(BattleEvents.UnitRemoveStatus, EventPriority.Post, (event) => {
    if (MOVE_LOCKING_STATUS.has(event.status)) {
      refresh(event.source);
    }
  });

  battle.on(BattleEvents.UnitEntersField, EventPriority.Post, (event) => {
    refresh(event.source);
  });

  battle.on(BattleEvents.Tick, EventPriority.Post, () => {
    for (const unit of idle) {
      const choice = chooseMove(battle, unit);

      if (choice) {
        unit.cast(choice.move, choice.target);
      }
    }
  });
}
