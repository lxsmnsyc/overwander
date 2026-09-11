import { AttackPriority } from '../../core/event-emitter';
import { Moves } from '../../data/ids/moves';
import { Statuses } from '../../data/ids/status';
import type Battle from '../core';
import { BattleEvents, EffectType } from '../events';

/**
 * Uproar is a rampage that makes a noise: the hits are the rampage
 * group's, and the racket is this. The noise goes up as the move
 * starts and comes off when it stops, so a pokemon shouting for three
 * hits keeps the field awake for exactly as long as it is shouting
 * https://bulbapedia.bulbagarden.net/wiki/Uproar_(move)
 */
export default function setupUproar(battle: Battle): void {
  battle.on(BattleEvents.UnitTriggerMove, AttackPriority.Post, (event) => {
    if (event.move !== Moves.Uproar) {
      return;
    }

    const cause = { type: EffectType.Move, move: event.move, unit: event.source } as const;

    if (event.steps > 0) {
      event.source.addStatus(Statuses.Uproaring, cause);
      return;
    }

    // The last hit is where the shouting stops
    const noise = event.source.status[Statuses.Uproaring];

    if (noise != null) {
      event.source.removeStatus(Statuses.Uproaring, noise);
    }
  });
}
