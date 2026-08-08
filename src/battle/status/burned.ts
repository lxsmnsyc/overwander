import { EventPriority } from '../../core/event-emitter';
import { Stats } from '../../data/constants/stats';
import { DamageFlags, MoveAttackFlags, MoveCategories } from '../../data/ids/moves';
import { Statuses } from '../../data/ids/status';
import type Battle from '../core';
import { BattleEvents, type EffectCause, EffectType } from '../events';
import type Unit from '../unit';

interface BurnedData {
  progress: number;
  cause: EffectCause;
}

export default function setupBurnedStatus(battle: Battle): void {
  const instances = new Map<Unit, BurnedData>();

  const BURNED_TICK = 1000;

  const timer = battle.on(BattleEvents.Tick, EventPriority.Post, (event) => {
    for (const [unit, data] of instances.entries()) {
      data.progress += event.duration;

      if (data.progress >= BURNED_TICK) {
        data.progress = 0;

        unit.triggerStatus(Statuses.Burned, data.cause);
      }
    }
  });

  timer.stop();

  battle.on(BattleEvents.UnitAddStatus, EventPriority.Post, (event) => {
    if (event.status === Statuses.Burned && !instances.has(event.source)) {
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
    if (event.status === Statuses.Burned) {
      instances.delete(event.source);

      if (instances.size === 0) {
        timer.stop();
      }
    }
  });

  battle.on(BattleEvents.UnitTriggerStatus, EventPriority.Exact, (event) => {
    if (event.status === Statuses.Burned) {
      // Modern residual damage: 1/16 of max HP
      const amount = event.source.checkStat(Stats.HP, 0) / 16;

      if (event.cause.type !== EffectType.None) {
        event.cause.unit.damage(event.cause, event.source, amount, DamageFlags.Indirect);
      }
    }
  });

  // A burn halves the damage of the user's physical moves
  // (Guts compensates this in its own ability setup)
  battle.on(BattleEvents.UnitAttackResolveDamage, EventPriority.Post, (event) => {
    if (
      event.parent.category === MoveCategories.Physical &&
      event.parent.source.status[Statuses.Burned] &&
      !(event.parent.flags & MoveAttackFlags.Pure) &&
      !(event.parent.flags & MoveAttackFlags.Confused)
    ) {
      event.value *= 0.5;
    }
  });

  battle.on(BattleEvents.UnitCure, EventPriority.Post, (event) => {
    event.source.removeStatus(Statuses.Burned, event.cause);
  });
}
