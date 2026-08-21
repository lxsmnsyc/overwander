import { AttackPriority } from '../../core/event-emitter';
import { DamageFlags, Moves } from '../../data/ids/moves';
import type Battle from '../core';
import { BattleEvents, EffectType } from '../events';

/**
 * What one landed Pay Day scatters, per level of the user: the
 * mainline's five
 */
export const PAY_DAY_COINS_PER_LEVEL = 5;

export default function setupPayDay(battle: Battle): void {
  battle.on(BattleEvents.UnitDamage, AttackPriority.Post, (event) => {
    // Only the direct hit scatters: damage merely carrying the move
    // as its cause must not pay twice
    if (
      !(event.flags & DamageFlags.Indirect) &&
      event.cause.type === EffectType.Move &&
      event.cause.move === Moves.PayDay
    ) {
      event.source.coins += PAY_DAY_COINS_PER_LEVEL * event.source.level;
    }
  });
}
