import { AttackPriority } from '../../core/event-emitter';
import { Stats } from '../../data/constants/stats';
import { Moves } from '../../data/ids/moves';
import { Statuses } from '../../data/ids/status';
import { scoreSelfHeal } from '../ai/score';
import type Battle from '../core';
import { BattleEvents, EffectType } from '../events';
import type Unit from '../unit';

/**
 * Rest is a sleep the user gives itself, so a user that cannot sleep
 * cannot rest — the heal rides on the sleep rather than the other way
 * around
 */
function canRest(source: Unit): boolean {
  return !source.checkStatusImmunity(Statuses.Sleeping, {
    type: EffectType.Move,
    move: Moves.Rest,
    unit: source,
  });
}

export default function setupRest(battle: Battle): void {
  battle.on(BattleEvents.CheckUnitAIMoveUsable, AttackPriority.Exact, (event) => {
    if (event.usable && event.move === Moves.Rest && !canRest(event.source)) {
      event.usable = false;
    }
  });

  battle.on(BattleEvents.UnitTriggerMoveEffect, AttackPriority.Exact, (event) => {
    if (event.move !== Moves.Rest) {
      return;
    }

    if (!canRest(event.source)) {
      event.source.triggerMoveEffectFailed(Moves.Rest, event.target, event.steps);
      return;
    }
    // Cure unit first
    event.source.cure({
      type: EffectType.Move,
      move: Moves.Rest,
      unit: event.source,
    });
    // Apply sleeping status
    event.source.addStatus(Statuses.Sleeping, {
      type: EffectType.Move,
      move: Moves.Rest,
      unit: event.source,
    });
    // Through the heal rather than straight onto the health, so a
    // pokemon that may not be healed at all is not healed by sleeping:
    // `setHealth` answers to nobody, and `UnitHeal` clamps to the max
    event.source.heal(
      { type: EffectType.Move, move: Moves.Rest, unit: event.source },
      event.source,
      event.source.checkStat(Stats.HP, 0),
      0,
    );
  });

  // Rest fills the whole pool, so it is only ever worth what the user
  // is missing
  battle.on(BattleEvents.CheckUnitAIMoveScore, AttackPriority.Post, (event) => {
    if (event.move === Moves.Rest) {
      scoreSelfHeal(event, 1);
    }
  });
}
