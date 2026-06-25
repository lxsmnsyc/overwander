import { EventPriority } from '../../core/event-emitter';
import { Moves } from '../../data/ids/moves';
import { Battle } from '../core';
import { BattleEvents } from '../events';

const INCREASED_CRITICAL_HIT_RATIO_MOVES = new Set([Moves.RazorLeaf]);

export function setupIncreasedCriticalHitRatioMoves(battle: Battle) {
  battle.on(
    BattleEvents.UnitAttackCheckCriticalRatio,
    EventPriority.Post,
    event => {
      if (INCREASED_CRITICAL_HIT_RATIO_MOVES.has(event.parent.move)) {
        event.value = 1;
      }
    },
  );
}
