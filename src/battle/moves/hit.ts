import { AttackPriority } from '../../core/event-emitter';
import { MoveAttackFlags, MoveCategories, Moves } from '../../data/ids/moves';
import { getMoveData } from '../../data/moves';
import type Battle from '../core';
import { BattleEvents, MoveTargetType } from '../events';
import { MULTI_HIT_MOVES } from './multi-hit';

/**
 * Moves whose blow lands on the wind-up step rather than the last
 * one. U-turn hits and then leaves: the strike is the first step and
 * the switch the switch-out group performs is the second, so a
 * damaging move that resolves nothing on its first step would be a
 * pokemon standing still and then hitting on its way out
 */
const STRIKES_FIRST = new Set<Moves>([Moves.UTurn]);

export default function setupHitMoves(battle: Battle): void {
  battle.on(BattleEvents.UnitTriggerMoveEffect, AttackPriority.Exact, (event) => {
    if (
      event.target.type !== MoveTargetType.Unit ||
      event.steps !== (STRIKES_FIRST.has(event.move) ? 1 : 0) ||
      // Multi-hit moves fire their own strikes
      MULTI_HIT_MOVES[event.move] != null
    ) {
      return;
    }

    const data = getMoveData(event.move);

    if (data.category === MoveCategories.Status) {
      return;
    }

    /**
     * Plain hits go by the power the move resolves to rather than the
     * one written in the registry: Fling, Return and Gyro Ball work
     * theirs out as they land and carry none. Fixed-damage moves
     * (Seismic Toss, Counter, Bide, ...) answer nothing here and fire
     * their own strikes.
     */
    const power = event.source.checkMovePower(event.move, event.target);

    if (power == null) {
      return;
    }

    event.source.attack(
      event.target.unit,
      event.move,
      power,
      event.source.checkMoveType(event.move, event.target),
      data.category,
      MoveAttackFlags.Critical,
    );
  });
}
