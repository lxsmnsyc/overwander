import { EventPriority } from '../../core/event-emitter';
import { Statuses } from '../../data/ids/status';
import type { Battle } from '../core';
import { BattleEvents, type EffectCause, EffectType } from '../events';
import type { Unit } from '../unit';

interface RechargingData {
  progress: number;
  cause: EffectCause;
}

// Real-time equivalent of the single recharge turn
const DURATION = 1000;

export function setupRechargingStatus(battle: Battle) {
  const instances = new Map<Unit, RechargingData>();

  const timer = battle.on(BattleEvents.Tick, EventPriority.Post, event => {
    for (const [unit, data] of instances.entries()) {
      data.progress -= event.duration;

      if (data.progress <= 0) {
        unit.removeStatus(Statuses.Recharging, data.cause);
      }
    }
  });

  timer.stop();

  battle.on(BattleEvents.CheckUnitCanCast, EventPriority.Post, event => {
    if (event.success && event.source.status[Statuses.Recharging]) {
      event.success = false;

      event.source.triggerStatus(Statuses.Recharging, {
        type: EffectType.None,
      });
    }
  });

  battle.on(BattleEvents.UnitAddStatus, EventPriority.Post, event => {
    if (event.status === Statuses.Recharging && !instances.has(event.source)) {
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
    if (event.status === Statuses.Recharging) {
      instances.delete(event.source);

      if (instances.size === 0) {
        timer.stop();
      }
    }
  });

  // No UnitCure hook: recharging is a move lock, not a status condition,
  // so heals/cures (e.g. Rest, Heal Bell) do not clear it.
}
