import { AttackPriority } from '../../core/event-emitter';
import { Stats } from '../../data/constants/stats';
import { DamageFlags, Moves } from '../../data/ids/moves';
import { RISKY_PENALTY, USELESS_PENALTY } from '../ai/score';
import type Battle from '../core';
import { BattleEvents, EffectType } from '../events';

/**
 * Memento: the stat drops it leaves behind are the stage move group's,
 * and what is left here is the price. The user goes down whether or
 * not the drops landed, the way it does in the main games
 * https://bulbapedia.bulbagarden.net/wiki/Memento_(move)
 */

/** The share of its health below which a unit has little left to lose */
const LAST_LEGS = 0.5;

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
    if (event.move !== Moves.Memento) {
      return;
    }

    const ratio = event.source.health / Math.max(1, event.source.checkStat(Stats.HP, 0));

    event.score -= ratio > LAST_LEGS ? USELESS_PENALTY : RISKY_PENALTY;
  });
}
