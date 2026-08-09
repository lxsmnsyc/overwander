import { EventPriority } from '../../core/event-emitter';
import { DamageFlags, Moves } from '../../data/ids/moves';
import { getMoveData } from '../../data/moves';
import type Battle from '../core';
import { BattleEvents, EffectType, MoveTargetType } from '../events';

/**
 * Moves whose blast engulfs the user as one of its own targets (Damp
 * forbids casting them)
 */
export const SELF_DESTRUCT_MOVES = new Set<Moves>([Moves.SelfDestruct, Moves.Explosion]);

// https://bulbapedia.bulbagarden.net/wiki/Explosion_(move)
export default function setupSelfDestructMoves(battle: Battle): void {
  /**
   * The user is just one more target of its own blast, but the
   * self-hit bypasses the immunity and accuracy checks entirely: the
   * standard chain is replaced by indirect damage of the move's raw
   * power, so no damage modification applies.
   */
  battle.on(BattleEvents.UnitTriggerMoveTarget, EventPriority.Pre, (event) => {
    if (
      SELF_DESTRUCT_MOVES.has(event.move) &&
      event.target.type === MoveTargetType.Unit &&
      event.target.unit === event.source
    ) {
      event.disabled = true;

      event.source.damage(
        { type: EffectType.Move, move: event.move, unit: event.source },
        event.source,
        getMoveData(event.move).power ?? 0,
        DamageFlags.Indirect,
      );
    }
  });
}
