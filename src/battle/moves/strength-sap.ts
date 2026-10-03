import { AttackPriority } from '../../core/event-emitter';
import { MIN_STAGE, Stages, Stats } from '../../data/constants/stats';
import { Moves, StatFlags } from '../../data/ids/moves';
import { scoreHeal } from '../ai/score';
import type Battle from '../core';
import { BattleEvents, EffectType, MoveTargetType } from '../events';

/**
 * Strength Sap heals the user by the target's Attack as it stands,
 * stages included, then drops that Attack a stage. A target already
 * at the floor has nothing left to give, so the move fails
 * https://bulbapedia.bulbagarden.net/wiki/Strength_Sap_(move)
 */
export default function setupStrengthSap(battle: Battle): void {
  battle.on(BattleEvents.UnitTriggerMoveEffect, AttackPriority.Exact, (event) => {
    if (event.move !== Moves.StrengthSap || event.target.type !== MoveTargetType.Unit) {
      return;
    }

    const target = event.target.unit;

    if (target.stages[Stages.Attack] <= MIN_STAGE) {
      event.source.triggerMoveEffectFailed(event.move, event.target, event.steps);
      return;
    }

    const cause = { type: EffectType.Move, move: event.move, unit: event.source } as const;

    event.source.heal(cause, event.source, target.resolveStat(Stats.Attack, StatFlags.Attack), 0);
    target.addStage(Stages.Attack, -1, cause);
  });

  battle.on(BattleEvents.CheckUnitAIMoveScore, AttackPriority.Post, (event) => {
    if (event.move !== Moves.StrengthSap || event.target.type !== MoveTargetType.Unit) {
      return;
    }

    const drained = event.target.unit.resolveStat(Stats.Attack, StatFlags.Attack);

    scoreHeal(event, event.source, drained / event.source.checkStat(Stats.HP, 0));
  });
}
