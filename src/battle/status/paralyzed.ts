import { EventPriority } from '../../core/event-emitter';
import { Statuses } from '../../data/ids/status';
import type Battle from '../core';
import { BattleEvents } from '../events';
import type Unit from '../unit';

// After a successful full-paralysis roll the unit stays numb: no new
// attempt (and no new roll) for this long
const LOCK_DURATION = 1000;

export default function setupParalyzedStatus(battle: Battle): void {
  const locked = new Map<Unit, number>();

  const timer = battle.on(BattleEvents.Tick, EventPriority.Post, (event) => {
    // Snapshot: releases mutate the map mid-walk
    for (const [unit, progress] of [...locked]) {
      const next = progress + event.duration;

      if (next >= LOCK_DURATION) {
        locked.delete(unit);
      } else {
        locked.set(unit, next);
      }
    }

    if (locked.size === 0) {
      timer.stop();
    }
  });

  timer.stop();

  function release(unit: Unit): void {
    locked.delete(unit);

    if (locked.size === 0) {
      timer.stop();
    }
  }

  function rollParalyzed(source: Unit): boolean {
    const current = source.status[Statuses.Paralyzed];

    if (!current) {
      return false;
    }

    // Still numb from the last proc: blocked without a new roll (or
    // another cue)
    if (locked.has(source)) {
      return true;
    }

    if (battle.random() * 100 <= 25) {
      source.triggerStatus(Statuses.Paralyzed, current);

      locked.set(source, 0);

      timer.start();

      return true;
    }

    return false;
  }

  battle.on(BattleEvents.CheckUnitCanCast, EventPriority.Post, (event) => {
    event.success = event.success && !rollParalyzed(event.source);
  });

  battle.on(BattleEvents.CheckUnitCanChannel, EventPriority.Post, (event) => {
    event.success = event.success && !rollParalyzed(event.source);
  });

  // Electric-type immunity to paralysis is handled by the shared
  // STATUS_TYPE_IMMUNITY table in status/index.ts

  battle.on(BattleEvents.UnitRemoveStatus, EventPriority.Post, (event) => {
    if (event.status === Statuses.Paralyzed) {
      release(event.source);
    }
  });

  battle.on(BattleEvents.UnitFaints, EventPriority.Post, (event) => {
    release(event.source);
  });

  battle.on(BattleEvents.UnitCure, EventPriority.Post, (event) => {
    event.source.removeStatus(Statuses.Paralyzed, event.cause);
  });
}
