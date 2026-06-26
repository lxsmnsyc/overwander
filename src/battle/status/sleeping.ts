import { EventPriority } from '../../core/event-emitter';
import { Statuses } from '../../data/ids/status';
import type { Battle, Unit } from '../core';
import { BattleEvents, type EffectCause, EffectType } from '../events';

interface SleepingData {
  progress: number;
  cause: EffectCause;
}

const DURATION = 2000;

export function setupSleepingStatusMechanics(battle: Battle) {
  const instances = new Map<Unit, SleepingData>();

  const timer = battle.on(BattleEvents.Tick, EventPriority.Post, event => {
    for (const [unit, data] of instances.entries()) {
      data.progress -= event.duration;

      if (data.progress <= 0) {
        unit.removeStatus(Statuses.Sleeping, data.cause);
      }
    }
  });

  timer.stop();

  battle.on(BattleEvents.CheckUnitCanCast, EventPriority.Post, event => {
    if (event.success && event.source.status[Statuses.Sleeping]) {
      event.success = false;

      event.source.triggerStatus(Statuses.Sleeping, {
        type: EffectType.None,
      });
    }
  });

  battle.on(BattleEvents.UnitAddStatus, EventPriority.Post, event => {
    if (event.status === Statuses.Sleeping && !instances.has(event.source)) {
      if (event.source.casting) {
        event.source.casting.stopCast();
      }

      instances.set(event.source, {
        progress: DURATION,
        cause: event.cause,
      });

      if (instances.size === 1) {
        timer.start();
      }
    }
  });

  battle.on(BattleEvents.UnitRemoveStatus, EventPriority.Post, event => {
    if (event.status === Statuses.Sleeping) {
      instances.delete(event.source);

      if (instances.size === 0) {
        timer.stop();
      }
    }
  });
}
