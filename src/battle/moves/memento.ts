import { AttackPriority } from '../../core/event-emitter';
import { DamageFlags, Moves } from '../../data/ids/moves';
import { sacrificeCost } from '../ai/score';
import type Battle from '../core';
import { BattleEvents, EffectType } from '../events';

/**
 * Memento: the stat drops it leaves behind are the stage move group's,
 * and what is left here is the price. The user goes down whether or
 * not the drops landed, the way it does in the main games
 * https://bulbapedia.bulbagarden.net/wiki/Memento_(move)
 */

export default function setupMemento(battle: Battle): void {
  battle.on(BattleEvents.UnitTriggerMoveEffect, AttackPriority.Post, (event) => {
    if (event.move !== Moves.Memento) {
      return;
    }

    event.source.damage(
      { type: EffectType.Move, move: event.move, unit: event.source },
      event.source,
      event.source.health,
      DamageFlags.Indirect | DamageFlags.Cost,
    );
  });

  // The same trade Explosion offers: worth making with nothing left,
  // and worth nothing while there is
  battle.on(BattleEvents.CheckUnitAIMoveScore, AttackPriority.Post, (event) => {
    if (event.move === Moves.Memento) {
      event.score -= sacrificeCost(event.source);
    }
  });
}
