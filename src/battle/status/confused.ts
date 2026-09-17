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

/** What the self-hit swings for, the mainline's own 40 */
const CONFUSED_POWER = 40;

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

  /**
   * The self-hit is not a registered move, so nothing may look it up:
   * the answers are given here at Pre and the question closed, which
   * keeps the mechanics from reaching a registry that has no entry
   * for it. It is a typeless swing that cannot miss and touches
   * nothing, which is what the mainline calls it too
   */
  battle.on(BattleEvents.CheckUnitMoveType, EventPriority.Pre, (event) => {
    if (event.move === Moves._Confused) {
      event.type = Types.Unknown;
      event.disabled = true;
    }
  });

  battle.on(BattleEvents.CheckUnitMoveImmunity, EventPriority.Pre, (event) => {
    if (event.move === Moves._Confused) {
      event.immune = false;
      event.disabled = true;
    }
  });

  battle.on(BattleEvents.CheckUnitMoveAccuracy, EventPriority.Pre, (event) => {
    if (event.move === Moves._Confused) {
      event.accuracy = undefined;
      event.disabled = true;
    }
  });

  battle.on(BattleEvents.CheckUnitMovePower, EventPriority.Pre, (event) => {
    if (event.move === Moves._Confused) {
      event.power = CONFUSED_POWER;
      event.disabled = true;
    }
  });

  battle.on(BattleEvents.CheckUnitMovePriority, EventPriority.Pre, (event) => {
    if (event.move === Moves._Confused) {
      event.priority = 0;
      event.disabled = true;
    }
  });

  battle.on(BattleEvents.CheckUnitMoveSteps, EventPriority.Pre, (event) => {
    if (event.move === Moves._Confused) {
      event.steps = 0;
      event.disabled = true;
    }
  });

  battle.on(BattleEvents.CheckUnitMoveContact, EventPriority.Pre, (event) => {
    if (event.move === Moves._Confused) {
      event.contact = false;
      event.disabled = true;
    }
  });

  battle.on(BattleEvents.UnitTriggerStatus, EventPriority.Post, (event) => {
    if (event.status === Statuses.Confused) {
      event.source.attack(
        event.source,
        Moves._Confused,
        CONFUSED_POWER,
        Types.Unknown,
        MoveCategories.Physical,
        MoveAttackFlags.Confused,
      );
    }
  });
}
