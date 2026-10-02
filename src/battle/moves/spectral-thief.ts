import { AttackPriority } from '../../core/event-emitter';
import { Stages } from '../../data/constants/stats';
import { Moves } from '../../data/ids/moves';
import type Battle from '../core';
import { BattleEvents, EffectType, MoveTargetType } from '../events';

const STAGES = [
  Stages.Attack,
  Stages.Defense,
  Stages.SpecialAttack,
  Stages.SpecialDefense,
  Stages.Speed,
  Stages.Evasion,
  Stages.Accuracy,
];

/**
 * Spectral Thief takes every stage the target has raised before it
 * hits: the target loses them and the user gains them
 * https://bulbapedia.bulbagarden.net/wiki/Spectral_Thief_(move)
 */
export default function setupSpectralThief(battle: Battle): void {
  battle.on(BattleEvents.UnitTriggerMoveEffect, AttackPriority.Pre, (event) => {
    if (event.move !== Moves.SpectralThief || event.target.type !== MoveTargetType.Unit) {
      return;
    }

    const target = event.target.unit;
    const cause = { type: EffectType.Move, move: event.move, unit: event.source } as const;

    for (const stage of STAGES) {
      const raised = target.stages[stage];

      if (raised > 0) {
        target.addStage(stage, -raised, cause);
        event.source.addStage(stage, raised, cause);
      }
    }
  });
}
