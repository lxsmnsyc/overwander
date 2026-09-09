import { AttackPriority } from '../../core/event-emitter';
import { Stages } from '../../data/constants/stats';
import { Moves } from '../../data/ids/moves';
import { USELESS_PENALTY } from '../ai/score';
import type Battle from '../core';
import { BattleEvents, EffectType, MoveTargetType } from '../events';
import type Unit from '../unit';

/**
 * The three moves that trade stages across the field rather than
 * making any: Power Swap takes the offence, Guard Swap the defence,
 * Heart Swap the lot. Nothing is created or destroyed, so what they
 * are worth is entirely about who is ahead
 * https://bulbapedia.bulbagarden.net/wiki/Power_Swap_(move)
 */
const SWAPPED: { [key in Moves]?: Stages[] } = {
  [Moves.PowerSwap]: [Stages.Attack, Stages.SpecialAttack],
  [Moves.GuardSwap]: [Stages.Defense, Stages.SpecialDefense],
  [Moves.HeartSwap]: [
    Stages.Attack,
    Stages.Defense,
    Stages.SpecialAttack,
    Stages.SpecialDefense,
    Stages.Speed,
    Stages.Accuracy,
    Stages.Evasion,
  ],
};

/** How far ahead the target is on the stages this move would take */
function ahead(source: Unit, target: Unit, stages: Stages[]): number {
  return stages.reduce((total, stage) => total + target.stages[stage] - source.stages[stage], 0);
}

export default function setupStageSwaps(battle: Battle): void {
  battle.on(BattleEvents.UnitTriggerMoveEffect, AttackPriority.Exact, (event) => {
    const stages = SWAPPED[event.move];

    if (stages == null || event.target.type !== MoveTargetType.Unit) {
      return;
    }

    const source = event.source;
    const target = event.target.unit;
    const cause = { type: EffectType.Move, move: event.move, unit: source } as const;

    for (const stage of stages) {
      const difference = target.stages[stage] - source.stages[stage];

      if (difference !== 0) {
        source.addStage(stage, difference, cause);
        target.addStage(stage, -difference, cause);
      }
    }
  });

  // Trading with somebody who is behind hands them the advantage
  battle.on(BattleEvents.CheckUnitAIMoveScore, AttackPriority.Post, (event) => {
    const stages = SWAPPED[event.move];

    if (stages == null || event.target.type !== MoveTargetType.Unit) {
      return;
    }

    if (ahead(event.source, event.target.unit, stages) <= 0) {
      event.score -= USELESS_PENALTY;
    }
  });
}
