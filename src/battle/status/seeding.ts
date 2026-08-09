import { EventPriority } from '../../core/event-emitter';
import { Stats } from '../../data/constants/stats';
import { DamageFlags } from '../../data/ids/moves';
import { Statuses } from '../../data/ids/status';
import type Battle from '../core';
import { BattleEvents, type EffectCause, EffectType } from '../events';
import type Unit from '../unit';

interface SeedingData {
  progress: number;
  cause: EffectCause;
}

export default function setupSeedingStatus(battle: Battle): void {
  const instances = new Map<Unit, SeedingData>();

  const timer = battle.on(BattleEvents.Tick, EventPriority.Post, (event) => {
    for (const [unit, data] of instances.entries()) {
      data.progress += event.duration;

      if (data.progress >= 1000) {
        data.progress = 0;

        unit.triggerStatus(Statuses.Seeding, data.cause);
      }
    }
  });

  timer.stop();

  battle.on(BattleEvents.UnitLeavesField, EventPriority.Exact, (event) => {
    event.source.removeStatus(Statuses.Seeding, {
      type: EffectType.None,
    });
  });

  battle.on(BattleEvents.UnitAddStatus, EventPriority.Post, (event) => {
    if (event.status === Statuses.Seeding && !instances.has(event.source)) {
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
    if (event.status === Statuses.Seeding) {
      instances.delete(event.source);

      if (instances.size === 0) {
        timer.stop();
      }
    }
  });

  battle.on(BattleEvents.UnitTriggerStatus, EventPriority.Exact, (event) => {
    if (event.status === Statuses.Seeding) {
      const amount = event.source.checkStat(Stats.HP, 0) / 8;

      if (event.cause.type !== EffectType.None) {
        const seeder = event.cause.unit;

        // Deal damage to the target first
        seeder.damage(
          event.cause,
          event.source,
          amount,
          DamageFlags.Indirect | DamageFlags.HealthScaled,
        );

        const drained = seeder.checkDrain(event.source, amount);

        if (drained >= 0) {
          // Heal the source
          seeder.heal(event.cause, seeder, drained, 0);
        } else {
          // The drain backfired (e.g. Liquid Ooze)
          seeder.damage(event.cause, seeder, -drained, DamageFlags.Indirect);
        }
      }
    }
  });
}
