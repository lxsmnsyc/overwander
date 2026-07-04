import { EventPriority } from '../../core/event-emitter';
import { Moves } from '../../data/ids/moves';
import type { Battle } from '../core';
import { BattleEvents, EffectType } from '../events';

const ABSORB_MOVES = new Set<Moves>([Moves.MegaDrain]);

const HEALING_FACTOR = 0.5;

export function setupAbsorb(battle: Battle) {
  battle.on(BattleEvents.UnitDamage, EventPriority.Post, event => {
    if (
      event.cause.type === EffectType.Move &&
      ABSORB_MOVES.has(event.cause.move)
    ) {
      event.source.heal(
        event.cause,
        event.source,
        event.value * HEALING_FACTOR,
        0,
      );
    }
  });
}
