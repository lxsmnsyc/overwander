import { EventPriority } from '../../core/event-emitter';
import { MoveAttackFlags, Moves } from '../../data/ids/moves';
import { Statuses } from '../../data/ids/status';
import { getMoveData } from '../../data/moves';
import type { Battle } from '../core';
import {
  BattleEvents,
  EffectType,
  type MoveTarget,
  MoveTargetType,
} from '../events';
import type { Unit } from '../unit';

interface BideData {
  value: number;
  target: Unit;
}

export function setupBide(battle: Battle) {
  const bideData = new Map<Unit, BideData>();

  battle.on(BattleEvents.CheckUnitEscape, EventPriority.Post, event => {
    if (event.success && event.source.status[Statuses.Biding]) {
      event.success = false;

      event.source.triggerStatus(Statuses.Biding, {
        type: EffectType.None,
      });
    }
  });

  battle.on(BattleEvents.UnitAddStatus, EventPriority.Post, event => {
    if (event.status === Statuses.Biding) {
      bideData.set(event.source, {
        value: 0,
        target: event.source,
      });
    }
  });

  battle.on(BattleEvents.UnitDamage, EventPriority.Post, event => {
    if (event.target.status[Statuses.Biding] && event.target.alive) {
      const current = bideData.get(event.target);
      if (current) {
        current.value += event.value;
        current.target = event.source;
      }
    }
  });

  battle.on(BattleEvents.UnitFaints, EventPriority.Post, event => {
    bideData.delete(event.source);
  });

  battle.on(
    BattleEvents.CheckUnitMoveChannelTime,
    EventPriority.Post,
    event => {
      if (event.move === Moves.Bide) {
        event.duration *= 2;
      }
    },
  );

  battle.on(BattleEvents.UnitTriggerMoveEffect, EventPriority.Exact, event => {
    if (event.move === Moves.Bide) {
      if (event.steps === 1) {
        event.source.addStatus(Statuses.Biding, {
          type: EffectType.Move,
          move: Moves.Bide,
          unit: event.source,
        });
      } else {
        event.source.removeStatus(Statuses.Biding, {
          type: EffectType.Move,
          move: Moves.Bide,
          unit: event.source,
        });

        const current = bideData.get(event.source);
        if (current) {
          const moveTarget: MoveTarget = {
            type: MoveTargetType.Unit,
            unit: current.target,
          };

          const moveType = event.source.checkMoveType(event.move, moveTarget);

          if (
            event.source.checkMoveImmunity(event.move, moveTarget, moveType)
          ) {
            event.source.attack(
              current.target,
              event.move,
              current.value,
              moveType,
              getMoveData(event.move).category,
              MoveAttackFlags.Critical,
            );
            return;
          }
        }

        event.source.triggerMoveEffectFailed(
          event.move,
          event.target,
          event.steps,
        );
      }
    }
  });
}
