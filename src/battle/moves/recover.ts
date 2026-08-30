import { AttackPriority } from '../../core/event-emitter';
import { Stats } from '../../data/constants/stats';
import { Moves } from '../../data/ids/moves';
import { scoreSelfHeal } from '../ai/score';
import type Battle from '../core';
import { BattleEvents, EffectType } from '../events';

/**
 * Self-healing moves and the fraction of max health they restore
 */
const HEAL_FRACTION: { [key in Moves]?: number } = {
  // https://bulbapedia.bulbagarden.net/wiki/Recover_(move)
  [Moves.Recover]: 0.5,
  // Chansey's own Recover, down to the fraction
  // https://bulbapedia.bulbagarden.net/wiki/Soft-Boiled_(move)
  [Moves.SoftBoiled]: 0.5,
};

export default function setupRecoverMoves(battle: Battle): void {
  battle.on(BattleEvents.UnitTriggerMoveEffect, AttackPriority.Exact, (event) => {
    const fraction = HEAL_FRACTION[event.move];

    if (fraction != null) {
      event.source.heal(
        { type: EffectType.Move, move: event.move, unit: event.source },
        event.source,
        event.source.checkStat(Stats.HP, 0) * fraction,
        0,
      );
    }
  });

  // Worth what it would actually put back, so a full unit does not
  // spend a cast topping itself off
  battle.on(BattleEvents.CheckUnitAIMoveScore, AttackPriority.Post, (event) => {
    const fraction = HEAL_FRACTION[event.move];

    if (fraction != null) {
      scoreSelfHeal(event, fraction);
    }
  });
}
