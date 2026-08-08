import { EventPriority } from '../../core/event-emitter';
import { Stages } from '../../data/constants/stats';
import { Moves } from '../../data/ids/moves';
import type { Battle } from '../core';
import { BattleEvents, EffectType } from '../events';

/**
 * Two-step moves that boost a stage of the user on the charging step.
 * The damage on the final step is handled by the hit move group.
 */
const CHARGE_STAGE_MOVES: {
  [key in Moves]?: { stage: Stages; value: number };
} = {
  // https://bulbapedia.bulbagarden.net/wiki/Skull_Bash_(move)
  [Moves.SkullBash]: { stage: Stages.Defense, value: 1 },
};

export function setupChargeMoves(battle: Battle) {
  battle.on(BattleEvents.UnitTriggerMoveEffect, EventPriority.Exact, event => {
    const config = CHARGE_STAGE_MOVES[event.move];
    if (config && event.steps === 1) {
      event.source.addStage(config.stage, config.value, {
        type: EffectType.Move,
        move: event.move,
        unit: event.source,
      });
    }
  });
}
