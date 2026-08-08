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

const setupDefenseStageMoves = createStageMove(Stages.Defense, {
  [Moves.Leer]: -1,
  [Moves.TailWhip]: -1,
  [Moves.Withdraw]: 1,
  [Moves.Harden]: 1,
});

const setupSpeedStageMoves = createStageMove(Stages.Speed, {
  [Moves.StringShot]: -2,
  [Moves.Agility]: 2,
});

const setupAccuracyStageMoves = createStageMove(Stages.Accuracy, {
  [Moves.Flash]: -1,
});

const setupEvasionStageMoves = createStageMove(Stages.SpecialAttack, {
  [Moves.DoubleTeam]: 1,
});

export function setupStageMoves(battle: Battle) {
  setupAttackStageMoves(battle);
  setupSpecialAttackStageMoves(battle);
  setupDefenseStageMoves(battle);
  setupSpeedStageMoves(battle);
  setupAccuracyStageMoves(battle);
  setupEvasionStageMoves(battle);
}
