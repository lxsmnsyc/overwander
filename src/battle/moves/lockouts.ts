import { AttackPriority } from '../../core/event-emitter';
import { Moves } from '../../data/ids/moves';
import { Statuses } from '../../data/ids/status';
import { USELESS_PENALTY } from '../ai/score';
import type Battle from '../core';
import { BattleEvents, EffectType, MoveTargetType } from '../events';
import { holdsAnyItem } from '../utils';

/**
 * The two moves that take something away from a target rather than
 * doing anything to it: what it is holding, and its way of putting
 * health back on. Neither touches the thing itself, so both come off
 * on their own and leave the target as they found it
 */
const LOCKOUTS = new Map<Moves, Statuses>([
  [Moves.Embargo, Statuses.Embargoed],
  [Moves.HealBlock, Statuses.HealBlocked],
]);

export default function setupLockouts(battle: Battle): void {
  battle.on(BattleEvents.UnitTriggerMoveEffect, AttackPriority.Exact, (event) => {
    const lock = LOCKOUTS.get(event.move);

    if (lock != null && event.target.type === MoveTargetType.Unit) {
      event.target.unit.addStatus(lock, {
        type: EffectType.Move,
        move: event.move,
        unit: event.source,
      });
    }
  });

  // Locking a target that is already locked spends a cast on nothing
  battle.on(BattleEvents.CheckUnitAIMoveUsable, AttackPriority.Exact, (event) => {
    const lock = LOCKOUTS.get(event.move);

    if (event.usable && lock != null) {
      event.usable =
        event.target.type === MoveTargetType.Unit && event.target.unit.status[lock] == null;
    }
  });

  // An embargo on a target holding nothing takes nothing away. Asked
  // rather than counted off the bag, since an item already knocked
  // off stays in there as a falsy entry
  battle.on(BattleEvents.CheckUnitAIMoveScore, AttackPriority.Post, (event) => {
    if (
      event.move === Moves.Embargo &&
      event.target.type === MoveTargetType.Unit &&
      !holdsAnyItem(event.target.unit)
    ) {
      event.score -= USELESS_PENALTY;
    }
  });
}
