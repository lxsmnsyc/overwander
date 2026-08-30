import { AttackPriority, EventPriority } from '../../core/event-emitter';
import { Moves } from '../../data/ids/moves';
import { Statuses } from '../../data/ids/status';
import type Battle from '../core';
import { BattleEvents, EffectType, MoveTargetType } from '../events';

export default function setupForesight(battle: Battle): void {
  battle.on(BattleEvents.CheckUnitAIMoveUsable, AttackPriority.Exact, (event) => {
    if (event.usable && event.move === Moves.Foresight) {
      event.usable =
        event.target.type === MoveTargetType.Unit &&
        event.target.unit.status[Statuses.Identified] == null;
    }
  });

  battle.on(BattleEvents.UnitTriggerMoveEffect, EventPriority.Exact, (event) => {
    if (event.move === Moves.Foresight && event.target.type === MoveTargetType.Unit) {
      event.target.unit.addStatus(Statuses.Identified, {
        type: EffectType.Move,
        move: event.move,
        unit: event.source,
      });
    }
  });
}
