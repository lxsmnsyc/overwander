import { AttackPriority } from '../../core/event-emitter';
import { MoveAttackFlags, MoveCategories } from '../../data/ids/moves';
import { getMoveData } from '../../data/moves';
import type Battle from '../core';
import { BattleEvents, MoveTargetType } from '../events';
import { MULTI_HIT_MOVES } from './multi-hit';

export default function setupHitMoves(battle: Battle): void {
  battle.on(BattleEvents.UnitTriggerMoveEffect, AttackPriority.Exact, (event) => {
    if (
      event.target.type !== MoveTargetType.Unit ||
      event.steps !== 0 ||
      // Multi-hit moves fire their own strikes
      MULTI_HIT_MOVES[event.move] != null
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
