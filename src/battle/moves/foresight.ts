import { AttackPriority } from '../../core/event-emitter';
import { Moves } from '../../data/ids/moves';
import { Statuses } from '../../data/ids/status';
import type Battle from '../core';
import { BattleEvents, EffectType, MoveTargetType } from '../events';

/**
 * The ways of pointing a pokemon out, and what each leaves it open
 * to. Foresight and Odor Sleuth come to the same thing; Miracle Eye
 * reads a Dark type instead, so it puts its own mark on
 */
const IDENTIFYING_MOVES = new Map<Moves, Statuses>([
  [Moves.Foresight, Statuses.Identified],
  [Moves.OdorSleuth, Statuses.Identified],
  [Moves.MiracleEye, Statuses.MindRead],
]);

export default function setupForesight(battle: Battle): void {
  battle.on(BattleEvents.CheckUnitAIMoveUsable, AttackPriority.Exact, (event) => {
    const mark = IDENTIFYING_MOVES.get(event.move);

    if (event.usable && mark != null) {
      event.usable =
        event.target.type === MoveTargetType.Unit && event.target.unit.status[mark] == null;
    }
  });

  battle.on(BattleEvents.UnitTriggerMoveEffect, AttackPriority.Exact, (event) => {
    const mark = IDENTIFYING_MOVES.get(event.move);

    if (mark != null && event.target.type === MoveTargetType.Unit) {
      event.target.unit.addStatus(mark, {
        type: EffectType.Move,
        move: event.move,
        unit: event.source,
      });
    }
  });
}
