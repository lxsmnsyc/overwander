import { EventPriority } from '../../core/event-emitter';
import { Stats } from '../../data/constants/stats';
import { DamageFlags } from '../../data/ids/moves';
import { Statuses } from '../../data/ids/status';
import type Battle from '../core';
import { BattleEvents, type EffectCause, EffectType } from '../events';
import type Unit from '../unit';

interface PoisonedData {
  progress: number;
  cause: EffectCause;
}

export function setupPoisonedStatus(battle: Battle): void {
  const instances = new Map<Unit, PoisonedData>();

  const POISONED_TICK = 1000;

  const timer = battle.on(BattleEvents.Tick, EventPriority.Post, (event) => {
    for (const [unit, data] of instances.entries()) {
      data.progress += event.duration;

      if (data.progress >= POISONED_TICK) {
        data.progress = 0;

        unit.triggerStatus(Statuses.Poisoned, data.cause);
      }
    }
  });

  timer.stop();

  battle.on(BattleEvents.UnitAddStatus, EventPriority.Post, (event) => {
    if (event.status === Statuses.Poisoned && !instances.has(event.source)) {
      instances.set(event.source, {
        progress: 0,
        cause: event.cause,
      });

      if (instances.size === 1) {
        timer.start();
      }
    }
  });

  battle.on(BattleEvents.UnitRemoveStatus, EventPriority.Post, (event) => {
    if (event.status === Statuses.Poisoned) {
      instances.delete(event.source);

      if (instances.size === 0) {
        timer.stop();
      }
    }
  });

  battle.on(BattleEvents.UnitTriggerStatus, EventPriority.Exact, (event) => {
    if (event.status === Statuses.Poisoned) {
      const amount = event.source.checkStat(Stats.HP, 0) / 8;

      if (event.cause.type !== EffectType.None) {
        // Deal damage to the target first
        event.cause.unit.damage(event.cause, event.source, amount, DamageFlags.Indirect);
      }
    }
  });

  battle.on(BattleEvents.UnitCure, EventPriority.Post, (event) => {
    event.source.removeStatus(Statuses.Poisoned, event.cause);
  });
}

interface BadlyPoisonedData {
  step: number;
  progress: number;
  cause: EffectCause;
}

export function setupBadlyPoisonedStatus(battle: Battle): void {
  const instances = new Map<Unit, BadlyPoisonedData>();

  const BADLY_POISONED_TICK = 1000;

  const timer = battle.on(BattleEvents.Tick, EventPriority.Post, (event) => {
    for (const [unit, data] of instances.entries()) {
      data.progress += event.duration;

      if (data.progress >= BADLY_POISONED_TICK) {
        data.progress = 0;

        unit.triggerStatus(Statuses.BadlyPoisoned, data.cause);
      }
    }
  });

  timer.stop();

  battle.on(BattleEvents.UnitAddStatus, EventPriority.Post, (event) => {
    if (event.status === Statuses.BadlyPoisoned && !instances.has(event.source)) {
      instances.set(event.source, {
        step: 1,
        progress: 0,
        cause: event.cause,
      });

      if (instances.size === 1) {
        timer.start();
      }
    }
  });

  battle.on(BattleEvents.UnitRemoveStatus, EventPriority.Post, (event) => {
    if (event.status === Statuses.BadlyPoisoned) {
      instances.delete(event.source);

      if (instances.size === 0) {
        timer.stop();
      }
    }
  });

  battle.on(BattleEvents.UnitTriggerStatus, EventPriority.Exact, (event) => {
    if (event.status === Statuses.BadlyPoisoned) {
      //
      const instance = instances.get(event.source);

      if (instance) {
        const amount = event.source.checkStat(Stats.HP, 0) / 16;

        const cause = event.cause.type === EffectType.None ? event.source : event.cause.unit;

        // Deal damage to the target first
        cause.damage(event.cause, event.source, amount * instance.step, DamageFlags.Indirect);

        instance.step += 1;
      }
    }
  });

  battle.on(BattleEvents.UnitCure, EventPriority.Post, (event) => {
    event.source.removeStatus(Statuses.BadlyPoisoned, event.cause);
  });
}
