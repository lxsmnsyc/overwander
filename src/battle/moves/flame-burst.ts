import { AttackPriority } from '../../core/event-emitter';
import { Stats } from '../../data/constants/stats';
import { DamageFlags, Moves } from '../../data/ids/moves';
import type Battle from '../core';
import { BattleEvents, EffectType } from '../events';

/**
 * Flame Burst splashes the pokemon beside its target. With no rows
 * here, beside is the target's own team
 * https://bulbapedia.bulbagarden.net/wiki/Flame_Burst_(move)
 */
const SPLASH_SHARE = 1 / 16;

export default function setupFlameBurst(battle: Battle): void {
  battle.on(BattleEvents.UnitAttack, AttackPriority.Post, (event) => {
    if (event.move !== Moves.FlameBurst || !event.success) {
      return;
    }

    const cause = { type: EffectType.Move, move: event.move, unit: event.source } as const;

    for (const unit of event.target.team.units) {
      if (unit !== event.target && unit.alive) {
        event.source.damage(
          cause,
          unit,
          unit.checkStat(Stats.HP, 0) * SPLASH_SHARE,
          DamageFlags.Indirect | DamageFlags.HealthScaled,
        );
      }
    }
  });
}
