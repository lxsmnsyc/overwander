import { AttackPriority, EventPriority } from '../../../core/event-emitter';
import { Stages } from '../../../data/constants/stats';
import { StatFlags } from '../../../data/ids/moves';
import { getMoveData } from '../../../data/moves';
import type Battle from '../../core';
import type {
  TriggerMoveData,
  UnitTriggerMoveEvent,
  UnitTriggerMoveResolveAccuracyEvent,
  UnitTriggerMoveRollHitEvent,
} from '../../events';
import { BattleEvents, MoveTargetType } from '../../events';
import resolveMoveTargets from './targeting';

/** A move going off: what it is aimed at, whether it lands, and what it sets off */
export default function setupTriggerMoveMechanics(battle: Battle): void {
  const triggerMoveData = new Set<TriggerMoveData>();

  function triggerMoveUpdate(data: Partial<TriggerMoveData>): void {
    battle.emit(BattleEvents.UnitTriggerMoveUpdate, {
      id: 'UnitTriggerMoveUpdate',
      disabled: false,
      data,
    });
  }

  function triggerMoveEnd(data: UnitTriggerMoveEvent): void {
    battle.emit(BattleEvents.UnitTriggerMoveEnd, {
      ...data,
      id: 'UnitTriggerMoveEnd',
      disabled: false,
    });
  }

  const timer = battle.on(BattleEvents.Tick, EventPriority.Exact, (event) => {
    for (const data of triggerMoveData) {
      data.time.progress += event.duration;

      if (data.time.progress >= data.time.duration) {
        triggerMoveData.delete(data);

        if (triggerMoveData.size === 0) {
          timer.stop();
        }

        triggerMoveEnd(data.parent);
      } else {
        triggerMoveUpdate(data);
      }
    }
  });

  /**
   * A swap takes the target's place as well as its spot: whatever was
   * already in the air aimed at whoever left now arrives at whoever
   * arrived. A cast and a channel follow the swap the same way, so a
   * move mid-flight is the only one that used to land on an empty
   * square
   */
  battle.on(BattleEvents.UnitSwitch, EventPriority.Post, (event) => {
    if (event.source === event.target) {
      return;
    }

    for (const data of triggerMoveData) {
      const aimed = data.parent.target;

      if (aimed.type !== MoveTargetType.Unit) {
        continue;
      }
      if (aimed.unit === event.source) {
        data.parent.target = { type: MoveTargetType.Unit, unit: event.target };
      } else if (aimed.unit === event.target) {
        data.parent.target = { type: MoveTargetType.Unit, unit: event.source };
      }
    }
  });

  battle.on(BattleEvents.UnitTriggerMove, AttackPriority.Exact, (event) => {
    const duration = event.source.checkMoveDelay(event.move, event.target);

    // No delay: resolve in the same frame
    if (duration <= 0) {
      triggerMoveEnd(event);
      return;
    }

    const data: TriggerMoveData = {
      parent: event,
      time: {
        progress: 0,
        duration,
      },
    };

    triggerMoveData.add(data);

    if (triggerMoveData.size === 1) {
      timer.start();
    }
  });

  // The effective target mask resolves through the event engine so
  // abilities (e.g. Boss) can widen it
  battle.on(BattleEvents.CheckUnitMoveTargeting, EventPriority.Exact, (event) => {
    const data = getMoveData(event.move);

    event.target = data.target;
    event.affects = data.affects;
  });

  battle.on(BattleEvents.UnitTriggerMoveEnd, EventPriority.Exact, (event) => {
    // A move that goes out to everybody has no pre-picked target: who
    // it lands on is worked out now, from the flags and whoever is
    // still standing
    const targeting = event.source.checkMoveTargeting(event.move);
    const targets = resolveMoveTargets(
      battle,
      event.source,
      event.target,
      targeting.target,
      targeting.affects,
    );

    for (const target of targets) {
      event.source.triggerMoveTarget(event.move, target, event.steps);
    }
  });

  battle.on(BattleEvents.UnitTriggerMoveResolveAccuracy, EventPriority.Exact, (event) => {
    const parent = event.parent;
    const baseAccuracy = parent.source.checkMoveAccuracy(parent.move, parent.target);

    if (baseAccuracy) {
      /**
       *  Base modifier for accuracy
       */
      let accuracyStage = parent.source.checkStage(Stages.Accuracy, StatFlags.Attack);
      if (parent.target.type === MoveTargetType.Unit) {
        accuracyStage -= parent.target.unit.checkStage(Stages.Evasion, StatFlags.Attack);

        accuracyStage = Math.max(-6, Math.min(accuracyStage, 6));
      }
      event.accuracy =
        baseAccuracy * (accuracyStage < 0 ? 3 / (3 - accuracyStage) : (3 + accuracyStage) / 3);
    }
  });

  function resolveMoveAccuracy(parent: UnitTriggerMoveEvent): number | undefined {
    const event: UnitTriggerMoveResolveAccuracyEvent = {
      id: 'UnitTriggerMoveResolveAccuracy',
      disabled: false,
      parent,
    };
    battle.emit(BattleEvents.UnitTriggerMoveResolveAccuracy, event);
    return event.accuracy;
  }

  battle.on(BattleEvents.UnitTriggerMoveRollHit, EventPriority.Exact, (event) => {
    if (!event.hit) {
      const actualAccuracy = resolveMoveAccuracy(event.parent);
      event.hit = actualAccuracy == null || battle.random() * 100 <= actualAccuracy;
    }
  });

  function rollHit(parent: UnitTriggerMoveEvent): boolean {
    const event: UnitTriggerMoveRollHitEvent = {
      id: 'TriggerMovUnitTriggerMoveRollHiteRollHit',
      disabled: false,
      parent,
      hit: false,
    };
    battle.emit(BattleEvents.UnitTriggerMoveRollHit, event);
    return event.hit;
  }

  function triggerFailed(parent: UnitTriggerMoveEvent): void {
    battle.emit(BattleEvents.UnitTriggerMoveFailed, {
      id: 'UnitTriggerMoveFailed',
      disabled: false,
      parent,
    });
  }

  function triggerMiss(parent: UnitTriggerMoveEvent): void {
    battle.emit(BattleEvents.UnitTriggerMoveMissed, {
      id: 'UnitTriggerMoveMissed',
      disabled: false,
      parent,
    });
  }

  battle.on(BattleEvents.UnitTriggerMoveTarget, AttackPriority.Exact, (event) => {
    const currentSource = event.source;
    const currentMove = event.move;
    // Get the move's type
    const currentType = currentSource.checkMoveType(currentMove, event.target);

    // Check for the target's immunity
    const isImmune = currentSource.checkMoveImmunity(currentMove, event.target, currentType);

    // if the target is immune, skip
    if (isImmune) {
      triggerFailed(event);
      return;
    }

    if (event.target.type === MoveTargetType.Unit && !rollHit(event)) {
      triggerMiss(event);
      return;
    }

    // Trigger move effect
    currentSource.triggerMoveEffect(event.move, event.target, event.steps);
  });
}
