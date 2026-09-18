import { EventPriority } from '../../core/event-emitter';
import { Moves } from '../../data/ids/moves';
import type Battle from '../core';
import { BattleEvents, MoveTargetType } from '../events';

/**
 * Synchronoise reaches only the pokemon that share a type with the
 * user, and passes straight through the rest
 * https://bulbapedia.bulbagarden.net/wiki/Synchronoise_(move)
 */
export default function setupSynchronoise(battle: Battle): void {
  battle.on(BattleEvents.CheckUnitMoveImmunity, EventPriority.Post, (event) => {
    if (
      event.immune ||
      event.move !== Moves.Synchronoise ||
      event.target.type !== MoveTargetType.Unit
    ) {
      return;
    }

    const target = event.target.unit;

    for (const type of event.source.types) {
      if (target.types.has(type)) {
        return;
      }
    }
    event.immune = true;
  });
}
