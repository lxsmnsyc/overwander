import { EventPriority } from '../../core/event-emitter';
import { Moves } from '../../data/ids/moves';
import { Statuses } from '../../data/ids/status';
import type Battle from '../core';
import { BattleEvents, EffectType } from '../events';

/**
 * The fire moves warm enough to thaw their own user out. Frozen locks
 * a unit out of casting, so the thaw is worth having on the two moves
 * a frozen Fire type would want
 */
const THAWING_MOVES = new Set<Moves>([Moves.FlameWheel, Moves.SacredFire]);

export default function setupThawingMoves(battle: Battle): void {
  battle.on(BattleEvents.UnitTriggerMove, EventPriority.Post, (event) => {
    const frozen = event.source.status[Statuses.Frozen];

    if (frozen != null && THAWING_MOVES.has(event.move)) {
      event.source.removeStatus(Statuses.Frozen, {
        type: EffectType.Move,
        move: event.move,
        unit: event.source,
      });
    }
  });
}
