import { EventPriority } from '../../core/event-emitter';
import { Stats } from '../../data/constants/stats';
import { DamageFlags } from '../../data/ids/moves';
import { Statuses } from '../../data/ids/status';
import type Battle from '../core';
import { BattleEvents, type EffectCause, EffectType } from '../events';
import type Unit from '../unit';

interface TrappedData {
  duration: number;
  progress: number;
  cause: EffectCause;
}

// Real-time equivalent of the 4-5 trapping turns
export const TRAPPED_DURATION = 4000;
export const TRAPPED_TICK = 1000;

export default function setupTrappedStatus(battle: Battle): void {
  const instances = new Map<Unit, TrappedData>();

  const timer = battle.on(BattleEvents.Tick, EventPriority.Post, (event) => {
    for (const [unit, data] of instances.entries()) {
      data.progress += event.duration;
      data.duration -= event.duration;

      if (data.duration <= 0) {
        unit.removeStatus(Statuses.Trapped, data.cause);
        continue;
      }

      if (data.progress >= TRAPPED_TICK) {
        data.progress = 0;

        unit.triggerStatus(Statuses.Trapped, data.cause);
      }
    }
  });

  timer.stop();

  // A trapped unit cannot escape or switch out
  battle.on(BattleEvents.CheckUnitEscape, EventPriority.Post, (event) => {
    if (event.success && event.source.status[Statuses.Trapped]) {
      event.success = false;

      event.source.triggerStatus(Statuses.Trapped, {
        type: EffectType.None,
      });
    }
  });

  battle.on(BattleEvents.UnitAddStatus, EventPriority.Post, (event) => {
    if (event.status === Statuses.Trapped && !instances.has(event.source)) {
      instances.set(event.source, {
        // Resolved through the event engine: a Grip Claw held by
        // whoever is doing the binding holds it on for longer
        duration: event.source.checkStatusDuration(Statuses.Trapped, TRAPPED_DURATION, event.cause),
        progress: 0,
        cause: event.cause,
      });

      if (instances.size === 1) {
        timer.start();
      }
    }
  });

  battle.on(BattleEvents.UnitRemoveStatus, EventPriority.Post, (event) => {
    if (event.status === Statuses.Trapped) {
      instances.delete(event.source);

      if (instances.size === 0) {
        timer.stop();
      }
    }
  });

  battle.on(BattleEvents.UnitTriggerStatus, EventPriority.Exact, (event) => {
    if (event.status === Statuses.Trapped) {
      // Modern residual damage: 1/8 of max HP
      const amount = event.source.checkStat(Stats.HP, 0) / 8;

      if (event.cause.type !== EffectType.None) {
        event.cause.unit.damage(event.cause, event.source, amount, DamageFlags.Indirect);
      }
    }
  });
}
