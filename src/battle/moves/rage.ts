import { AttackPriority, EventPriority } from '../../core/event-emitter';
import { Stages } from '../../data/constants/stats';
import { Moves } from '../../data/ids/moves';
import { Statuses } from '../../data/ids/status';
import type Battle from '../core';
import { BattleEvents, EffectType } from '../events';

export default function setupRage(battle: Battle): void {
  battle.on(BattleEvents.UnitTriggerMoveEffect, EventPriority.Exact, (event) => {
    if (event.move === Moves.Rage) {
      if (!event.source.status[Statuses.Raging]) {
        event.source.addStatus(Statuses.Raging, {
          type: EffectType.Move,
          unit: event.source,
          move: Moves.Rage,
        });
      }
    } else if (event.source.status[Statuses.Raging]) {
      event.source.removeStatus(Statuses.Raging, {
        type: EffectType.Move,
        unit: event.source,
        move: Moves.Rage,
      });
    }
  });
  battle.on(BattleEvents.UnitAttack, AttackPriority.Post, (event) => {
    if (event.target.status[Statuses.Raging]) {
      event.target.addStage(Stages.Attack, 1, {
        type: EffectType.Move,
        move: Moves.Rage,
        unit: event.target,
      });
    }
  });
}
