import { EventPriority } from '../../core/event-emitter';
import { Statuses } from '../../data/ids/status';
import type { Battle } from '../core';
import { BattleEvents } from '../events';
import type { Unit } from '../unit';

export function setupParalyzedStatus(battle: Battle) {
  function rollParalyzed(source: Unit) {
    const current = source.status[Statuses.Paralyzed];
    if (current && battle.random() * 100 <= 25) {
      source.triggerStatus(Statuses.Paralyzed, current);
      return true;
    }
    return false;
  }
  battle.on(BattleEvents.CheckUnitCanCast, EventPriority.Post, event => {
    event.success = event.success && !rollParalyzed(event.source);
  });

  battle.on(BattleEvents.CheckUnitCanChannel, EventPriority.Post, event => {
    event.success = event.success && !rollParalyzed(event.source);
  });

  // Electric-type immunity to paralysis is handled by the shared
  // STATUS_TYPE_IMMUNITY table in status/index.ts

  battle.on(BattleEvents.UnitCure, EventPriority.Post, event => {
    event.source.removeStatus(Statuses.Paralyzed, event.cause);
  });
}
