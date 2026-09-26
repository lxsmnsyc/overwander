import { AttackPriority, EventPriority } from '../../core/event-emitter';
import { Types } from '../../data/constants/types';
import { Moves } from '../../data/ids/moves';
import type Battle from '../core';
import { BattleEvents, MoveTargetType } from '../events';
import turns from '../turn';
import type Unit from '../unit';

/**
 * The two moves that turn what is thrown into electricity. Electrify
 * charges one target, whose next move within a turn lands as Electric;
 * Ion Deluge charges the air, so every Normal move within a turn does
 * https://bulbapedia.bulbagarden.net/wiki/Electrify_(move)
 */
export const ELECTRIFY_DURATION = turns(1);

export default function setupElectrify(battle: Battle): void {
  const charged = new Map<Unit, number>();
  let deluge = 0;

  battle.on(BattleEvents.UnitTriggerMoveEffect, AttackPriority.Exact, (event) => {
    if (event.move === Moves.IonDeluge) {
      deluge = ELECTRIFY_DURATION;
    } else if (event.move === Moves.Electrify && event.target.type === MoveTargetType.Unit) {
      charged.set(event.target.unit, ELECTRIFY_DURATION);
    }
  });

  battle.on(BattleEvents.CheckUnitMoveType, EventPriority.Post, (event) => {
    if (charged.has(event.source) || (deluge > 0 && event.type === Types.Normal)) {
      event.type = Types.Electric;
    }
  });

  // The charge is spent on the one move it turns
  battle.on(BattleEvents.UnitTriggerMove, AttackPriority.Post, (event) => {
    if (event.move !== Moves.Electrify) {
      charged.delete(event.source);
    }
  });

  battle.on(BattleEvents.Tick, EventPriority.Post, (event) => {
    deluge = Math.max(0, deluge - event.duration);
    for (const [unit, left] of charged) {
      if (left > event.duration) {
        charged.set(unit, left - event.duration);
      } else {
        charged.delete(unit);
      }
    }
  });
}
