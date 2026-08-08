import { EventPriority } from '../../core/event-emitter';
import { Statuses } from '../../data/ids/status';
import type { Battle } from '../core';
import { BattleEvents, type EffectCause, EffectType } from '../events';
import type { Unit } from '../unit';

interface FlinchedData {
  progress: number;
  cause: EffectCause;
}

// Real-time equivalent of losing the turn
const DURATION = 500;

export function setupFlinchedStatus(battle: Battle) {
  const instances = new Map<Unit, FlinchedData>();

  const timer = battle.on(BattleEvents.Tick, EventPriority.Post, event => {
    for (const [unit, data] of instances.entries()) {
      data.progress -= event.duration;

      if (data.progress <= 0) {
        unit.removeStatus(Statuses.Flinched, data.cause);
      }
    }
  });

  timer.stop();

  battle.on(BattleEvents.CheckUnitCanCast, EventPriority.Post, event => {
    if (event.success && event.source.status[Statuses.Flinched]) {
      event.success = false;

      event.source.triggerStatus(Statuses.Flinched, {
        type: EffectType.None,
      });
    }
  });

  battle.on(BattleEvents.UnitAddStatus, EventPriority.Post, event => {
    if (event.status === Statuses.Flinched) {
      event.source.interrupt();

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
    if (event.status === Statuses.Flinched) {
      instances.delete(event.source);

      if (instances.size === 0) {
        timer.stop();
      }
    }
  });
}
