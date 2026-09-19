import { AttackPriority } from '../../core/event-emitter';
import { DamageFlags, Moves } from '../../data/ids/moves';
import type Battle from '../core';
import { BattleEvents, EffectType } from '../events';
import type Team from '../team';

/**
 * What one landed Pay Day scatters, per level of the user: the
 * mainline's five
 */
export const PAY_DAY_COINS_PER_LEVEL = 5;

/**
 * Happy Hour: whatever the user's team picks up this battle is worth
 * twice as much. It counts once, however often it is thrown
 */
export const HAPPY_HOUR_FACTOR = 2;

export default function setupPayDay(battle: Battle): void {
  const happy = new WeakSet<Team>();

  battle.on(BattleEvents.UnitTriggerMoveEffect, AttackPriority.Exact, (event) => {
    const team = event.source.team;

    if (event.move !== Moves.HappyHour || happy.has(team)) {
      return;
    }

    happy.add(team);
    for (const unit of team.units) {
      unit.coins *= HAPPY_HOUR_FACTOR;
    }
  });

  battle.on(BattleEvents.UnitDamage, AttackPriority.Post, (event) => {
    // Only the direct hit scatters: damage merely carrying the move
    // as its cause must not pay twice
    if (
      !(event.flags & DamageFlags.Indirect) &&
      event.cause.type === EffectType.Move &&
      event.cause.move === Moves.PayDay
    ) {
      event.source.coins +=
        PAY_DAY_COINS_PER_LEVEL *
        event.source.level *
        (happy.has(event.source.team) ? HAPPY_HOUR_FACTOR : 1);
    }
  });
}
