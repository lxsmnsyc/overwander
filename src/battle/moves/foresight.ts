import { AttackPriority } from '../../core/event-emitter';
import { Moves } from '../../data/ids/moves';
import { Statuses } from '../../data/ids/status';
import type Battle from '../core';
import { BattleEvents, EffectType, MoveTargetType } from '../events';

/** Both ways of pointing a pokemon out, which come to the same thing */
const IDENTIFYING_MOVES = new Set<Moves>([Moves.Foresight, Moves.OdorSleuth]);

export default function setupForesight(battle: Battle): void {
  battle.on(BattleEvents.CheckUnitAIMoveUsable, AttackPriority.Exact, (event) => {
    if (event.usable && IDENTIFYING_MOVES.has(event.move)) {
      event.usable =
        event.target.type === MoveTargetType.Unit &&
        event.target.unit.status[Statuses.Identified] == null;
    }
  });

  battle.on(BattleEvents.UnitTriggerMoveEffect, AttackPriority.Exact, (event) => {
    if (IDENTIFYING_MOVES.has(event.move) && event.target.type === MoveTargetType.Unit) {
      event.target.unit.addStatus(Statuses.Identified, {
        type: EffectType.Move,
        move: event.move,
        unit: event.source,
      });
    }
  });
}
