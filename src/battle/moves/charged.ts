import { AttackPriority, EventPriority } from '../../core/event-emitter';
import { Types } from '../../data/constants/types';
import { Moves } from '../../data/ids/moves';
import type Battle from '../core';
import { BattleEvents } from '../events';
import type Unit from '../unit';

/**
 * Charge: the Special Defense it raises is the stage group's, and what
 * is left here is the charge itself. It sits on the pokemon until it
 * spends it on an Electric move, which is worth twice as much for it
 * https://bulbapedia.bulbagarden.net/wiki/Charge_(move)
 */
export default function setupCharged(battle: Battle): void {
  const charged = new Set<Unit>();

  battle.on(BattleEvents.UnitTriggerMoveEffect, AttackPriority.Exact, (event) => {
    if (event.move === Moves.Charge) {
      charged.add(event.source);
    }
  });

  battle.on(BattleEvents.CheckUnitMovePower, EventPriority.Post, (event) => {
    if (
      event.power != null &&
      charged.has(event.source) &&
      event.source.checkMoveType(event.move, event.target) === Types.Electric
    ) {
      event.power *= 2;
    }
  });

  // Spent on the first Electric move that goes off, whether or not it
  // reached anything
  battle.on(BattleEvents.UnitTriggerMove, AttackPriority.Post, (event) => {
    if (
      event.move !== Moves.Charge &&
      event.source.checkMoveType(event.move, event.target) === Types.Electric
    ) {
      charged.delete(event.source);
    }
  });

  for (const gone of [BattleEvents.UnitFaints, BattleEvents.UnitLeavesField] as const) {
    battle.on(gone, EventPriority.Post, (event) => {
      charged.delete(event.source);
    });
  }
}
