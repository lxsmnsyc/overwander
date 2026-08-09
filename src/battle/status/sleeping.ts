import { EventPriority } from '../../core/event-emitter';
import { Statuses } from '../../data/ids/status';
import type Battle from '../core';
import { BattleEvents, EffectType } from '../events';
import createTimedStatus from './__create';

const DURATION = 2000;

const setupTimer = createTimedStatus(Statuses.Sleeping, DURATION);

export default function setupSleepingStatus(battle: Battle): void {
  setupTimer(battle);

  battle.on(BattleEvents.CheckUnitCanCast, EventPriority.Post, (event) => {
    if (event.success && event.source.status[Statuses.Sleeping]) {
      event.success = false;

      event.source.triggerStatus(Statuses.Sleeping, {
        type: EffectType.None,
      });
    }
  });

  battle.on(BattleEvents.UnitAddStatus, EventPriority.Post, (event) => {
    if (event.status === Statuses.Sleeping) {
      event.source.interrupt();
    }
  });

  battle.on(BattleEvents.UnitCure, EventPriority.Post, (event) => {
    event.source.removeStatus(Statuses.Sleeping, event.cause);
  });
}
