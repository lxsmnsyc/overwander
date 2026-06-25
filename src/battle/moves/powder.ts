import { EventPriority } from '../../core/event-emitter';
import { Types } from '../../data/constants/types';
import { Moves } from '../../data/ids/moves';
import { Battle } from '../core';
import { BattleEvents } from '../events';

export const POWDER_MOVES = new Set<Moves>([Moves.PoisonPowder]);

export function setupPowderMoves(battle: Battle) {
  // Setup grass-type immunity
  battle.on(BattleEvents.CheckMoveImmunity, EventPriority.Post, event => {
    if (
      !event.immune &&
      POWDER_MOVES.has(event.move) &&
      event.target.types.has(Types.Grass)
    ) {
      event.immune = true;
    }
  });
}
