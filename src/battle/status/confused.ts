import { EventPriority } from '../../core/event-emitter';
import { Types } from '../../data/constants/types';
import { MoveAttackFlags, MoveCategories, Moves } from '../../data/ids/moves';
import { Statuses } from '../../data/ids/status';
import type Battle from '../core';
import { BattleEvents, type EffectCause, EffectType } from '../events';
import turns from '../turn';
import type Unit from '../unit';

interface ConfusedData {
  progress: number;
  cause: EffectCause;
}

const MIN_DURATION = turns(2);
const MAX_DURATION = turns(5);
const CONFUSION_CHANCE = 1 / 3;

export default function setupConfusedStatus(battle: Battle): void {
  const instances = new Map<Unit, ConfusedData>();

  const timer = battle.on(BattleEvents.Tick, EventPriority.Post, (event) => {
    for (const [unit, data] of instances.entries()) {
      data.progress -= event.duration;

      if (data.progress <= 0) {
        unit.removeStatus(Statuses.Confused, data.cause);
      }
    }
  });

  timer.stop();

  battle.on(BattleEvents.UnitLeavesField, EventPriority.Post, (event) => {
    event.source.removeStatus(Statuses.Confused, {
      type: EffectType.None,
    });
  });

  battle.on(BattleEvents.CheckUnitCanCast, EventPriority.Post, (event) => {
    if (
      event.success &&
      event.source.status[Statuses.Confused] &&
      battle.random() >= CONFUSION_CHANCE
    ) {
      event.success = false;

      event.source.triggerStatus(Statuses.Confused, {
        type: EffectType.None,
      });
    }
  });

  battle.on(BattleEvents.UnitAddStatus, EventPriority.Post, (event) => {
    if (event.status === Statuses.Confused && !instances.has(event.source)) {
      instances.set(event.source, {
        progress: battle.randomRange(MIN_DURATION, MAX_DURATION),
        cause: event.cause,
      });

      if (instances.size === 1) {
        timer.start();
      }
    }
  });

  battle.on(BattleEvents.UnitRemoveStatus, EventPriority.Post, (event) => {
    if (event.status === Statuses.Confused) {
      instances.delete(event.source);

      if (instances.size === 0) {
        timer.stop();
      }
    }
  });

  battle.on(BattleEvents.UnitTriggerStatus, EventPriority.Post, (event) => {
    if (event.status === Statuses.Confused) {
      event.source.attack(
        event.source,
        Moves._Confused,
        40,
        Types.Unknown,
        MoveCategories.Physical,
        MoveAttackFlags.Confused,
      );
    }
  });
}
