import { EventPriority } from '../../core/event-emitter';
import { Stats } from '../../data/constants/stats';
import Abilities from '../../data/ids/abilities';
import { Statuses } from '../../data/ids/status';
import type Battle from '../core';
import { BattleEvents } from '../events';
import turns from '../turn';
import type Unit from '../unit';

// After a successful full-paralysis roll the unit stays numb: no new
// attempt (and no new roll) for this long
const LOCK_DURATION = turns(1);

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

  // Paralysis halves Speed; Quick Feet holders ignore the drop
  // (explicit check, like Run Away vs Arena Trap)
  battle.on(BattleEvents.CheckUnitStat, EventPriority.Post, (event) => {
    if (
      event.stat === Stats.Speed &&
      event.source.status[Statuses.Paralyzed] != null &&
      !event.source.hasAbility(Abilities.QuickFeet)
    ) {
      event.value *= 0.5;
    }
  });

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
