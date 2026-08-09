import { EventPriority } from '../../core/event-emitter';
import { Statuses } from '../../data/ids/status';
import type Battle from '../core';
import { BattleEvents, EffectType } from '../events';
import createTimedStatus from './__create';

// The warm-up period of a freshly fielded Boss
const DURATION = 5000;

const setupTimer = createTimedStatus(Statuses.Dormant, DURATION);

export default function setupDormantStatus(battle: Battle): void {
  setupTimer(battle);

  battle.on(BattleEvents.CheckUnitCanCast, EventPriority.Post, (event) => {
    if (event.success && event.source.status[Statuses.Dormant]) {
      event.success = false;

      event.source.triggerStatus(Statuses.Dormant, {
        type: EffectType.None,
      });
    }
  });

  battle.on(BattleEvents.UnitAddStatus, EventPriority.Post, (event) => {
    if (event.status === Statuses.Dormant) {
      event.source.interrupt();
    }
  });

  // No UnitCure hook: dormancy is a move lock, not a status
  // condition, so heals/cures do not clear it.
}
