import { EventPriority } from '../../core/event-emitter';
import { Stages } from '../../data/constants/stats';
import { Moves } from '../../data/ids/moves';
import type { Battle } from '../core';
import { BattleEvents, EffectType, MoveTargetType } from '../events';

type StageMovesConfig = { [key in Moves]?: number };

function createStageMove(stage: Stages, config: StageMovesConfig) {
  return (battle: Battle) => {
    battle.on(
      BattleEvents.UnitTriggerMoveEffect,
      EventPriority.Exact,
      event => {
        let target = event.source;
        if (event.target.type === MoveTargetType.Unit) {
          target = event.target.unit;
        }
        const move = event.move;
        if (move in config) {
          target.addStage(stage, config[move] || 0, {
            type: EffectType.Move,
            unit: event.source,
            move: event.move,
          });
        }
      },
    );
  };
}

const setupAttackStageMoves = createStageMove(Stages.Attack, {
  [Moves.Growl]: -1,
  [Moves.SwordsDance]: 2,
});

const setupSpecialAttackStageMoves = createStageMove(Stages.SpecialAttack, {
  [Moves.Growth]: 1,
});

export function setupStageMoves(battle: Battle) {
  setupAttackStageMoves(battle);
  setupSpecialAttackStageMoves(battle);
}
