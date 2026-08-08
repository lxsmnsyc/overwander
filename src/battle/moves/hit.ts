import { EventPriority } from '../../core/event-emitter';
import { MoveAttackFlags, MoveCategories, Moves } from '../../data/ids/moves';
import { getMoveData } from '../../data/moves';
import type { Battle } from '../core';
import { BattleEvents, MoveTargetType } from '../events';

/**
 * Damaging moves with their own damage resolution, opted out of the
 * plain hit handler (e.g. multi-hit moves fire their own strikes)
 */
const NON_HIT_MOVES = new Set<Moves>([
  Moves.FuryAttack,
  Moves.PinMissile,
  Moves.Twineedle,
  Moves.FurySwipes,
]);

export function setupHitMoves(battle: Battle) {
  battle.on(BattleEvents.UnitTriggerMoveEffect, EventPriority.Exact, event => {
    if (
      event.target.type !== MoveTargetType.Unit ||
      event.steps !== 0 ||
      NON_HIT_MOVES.has(event.move)
    ) {
      return;
    }

    /**
     * Plain hits are derived from the move registry: any damaging move
     * with a base power. Fixed-damage moves (Seismic Toss, Counter,
     * Bide, ...) carry no power and resolve through their own groups.
     */
    const data = getMoveData(event.move);

    if (data.category === MoveCategories.Status || data.power == null) {
      return;
    }

    event.source.attack(
      event.target.unit,
      event.move,
      event.source.checkMovePower(event.move, event.target) ?? 0,
      event.source.checkMoveType(event.move, event.target),
      data.category,
      MoveAttackFlags.Critical,
    );
  });
}
