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
 * change a unit's ability to act. A set is only worth keeping if it
 * cannot go stale, so the two rules it is built on are:
 *
 * - **bookkeeping opens before the thing it tracks, and closes before
 *   anything that could veto the close.** A move with no delay ends
 *   inside the very event that started it, so a listener that opened
 *   the pending trigger at Post would run after the close and leave
 *   the unit pending forever — standing still for the rest of the
 *   fight. Both halves therefore run at `Pre`.
 * - **pending triggers are counted, not flagged.** One move can put
 *   several in the air at once — Mirror Move casts a copy from inside
 *   the trigger it is finishing — and a flag cleared by the first to
 *   land would free the unit while the rest are still coming.
 */
export default function setupIdleAI(battle: Battle): void {
  const pendingTrigger = new Map<Unit, number>();
  const idle = new Set<Unit>();

  function isPending(unit: Unit): boolean {
    return (pendingTrigger.get(unit) ?? 0) > 0;
  }

  function isIdle(unit: Unit): boolean {
    return (
      unit.alive &&
      !unit.casting &&
      !unit.channeling &&
      !isPending(unit) &&
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

  // Pre, and counted: see the note above the loop
  battle.on(BattleEvents.UnitTriggerMove, EventPriority.Pre, (event) => {
    pendingTrigger.set(event.source, (pendingTrigger.get(event.source) ?? 0) + 1);
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

  battle.on(BattleEvents.UnitTriggerMoveEnd, EventPriority.Pre, (event) => {
    const pending = (pendingTrigger.get(event.source) ?? 0) - 1;

    if (pending > 0) {
      pendingTrigger.set(event.source, pending);
    } else {
      pendingTrigger.delete(event.source);
    }
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
    // A copy, because casting mutates the set the loop is walking —
    // and a unit that leaves it and comes back within the same tick
    // would otherwise be visited twice
    for (const unit of [...idle]) {
      // The set is a cache of the check, so the check has the last
      // word: a unit that stopped being idle earlier in this very tick
      // does not get to act on the strength of a stale entry
      if (!isIdle(unit)) {
        idle.delete(unit);
        continue;
      }

      const choice = chooseMove(battle, unit);

      if (choice) {
        unit.cast(choice.move, choice.target);
      }
    }
  });
}
