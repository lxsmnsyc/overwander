import { EventPriority } from '../../core/event-emitter';
import { Types } from '../../data/constants/types';
import { Moves } from '../../data/ids/moves';
import type { Battle } from '../core';
import { BattleEvents, MoveTargetType } from '../events';

export const POWDER_MOVES = new Set<Moves>([
  Moves.PoisonPowder,
  Moves.SleepPowder,
]);

export function setupPowderMoves(battle: Battle) {
  // Setup grass-type immunity
  battle.on(BattleEvents.CheckUnitMoveImmunity, EventPriority.Post, event => {
    if (
      !event.immune &&
      POWDER_MOVES.has(event.move) &&
      event.target.type === MoveTargetType.Unit &&
      event.target.unit.types.has(Types.Grass)
    ) {
      event.immune = true;
    }
  });
}
