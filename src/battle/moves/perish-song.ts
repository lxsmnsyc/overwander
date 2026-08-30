import { AttackPriority } from '../../core/event-emitter';
import { Moves } from '../../data/ids/moves';
import { Statuses } from '../../data/ids/status';
import type Battle from '../core';
import { BattleEvents, EffectType, MoveTargetType } from '../events';

/**
 * Everything that hears the song starts counting, the singer
 * included. A move that reaches the whole field is resolved once per
 * unit, so this only has to answer for the one in front of it
 */
export default function setupPerishSong(battle: Battle): void {
  battle.on(BattleEvents.UnitTriggerMoveEffect, AttackPriority.Exact, (event) => {
    if (event.move !== Moves.PerishSong || event.target.type !== MoveTargetType.Unit) {
      return;
    }

    event.target.unit.addStatus(Statuses.Perishing, {
      type: EffectType.Move,
      move: event.move,
      unit: event.source,
    });
  });
}
