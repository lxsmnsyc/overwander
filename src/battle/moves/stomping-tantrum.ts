import { AttackPriority, EventPriority } from '../../core/event-emitter';
import { Moves } from '../../data/ids/moves';
import type Battle from '../core';
import { BattleEvents } from '../events';
import type Unit from '../unit';

/**
 * Stomping Tantrum hits twice as hard after the user's last move
 * failed: missed, was turned away, or came to nothing
 * https://bulbapedia.bulbagarden.net/wiki/Stomping_Tantrum_(move)
 */
export const TANTRUM_FACTOR = 2;

export default function setupStompingTantrum(battle: Battle): void {
  /** Whether the move each unit is throwing now has failed yet */
  const current = new Map<Unit, boolean>();
  /** Whether the move before it failed */
  const previous = new Map<Unit, boolean>();

  battle.on(BattleEvents.UnitTriggerMove, AttackPriority.Pre, (event) => {
    previous.set(event.source, current.get(event.source) ?? false);
    current.set(event.source, false);
  });

  battle.on(BattleEvents.UnitTriggerMoveFailed, EventPriority.Post, (event) => {
    current.set(event.parent.source, true);
  });

  battle.on(BattleEvents.UnitTriggerMoveEffectFailed, EventPriority.Post, (event) => {
    current.set(event.source, true);
  });

  battle.on(BattleEvents.CheckUnitMovePower, EventPriority.Post, (event) => {
    if (
      event.move === Moves.StompingTantrum &&
      event.power != null &&
      previous.get(event.source) === true
    ) {
      event.power *= TANTRUM_FACTOR;
    }
  });

  for (const gone of [BattleEvents.UnitFaints, BattleEvents.UnitLeavesField] as const) {
    battle.on(gone, EventPriority.Post, (event) => {
      current.delete(event.source);
      previous.delete(event.source);
    });
  }
}
