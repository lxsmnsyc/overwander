import { AttackPriority } from '../../core/event-emitter';
import { Stats } from '../../data/constants/stats';
import { DamageFlags, Moves } from '../../data/ids/moves';
import type Battle from '../core';
import { BattleEvents, EffectType } from '../events';

/**
 * Mind Blown costs the user half its HP however it lands, once for the
 * whole blast rather than once for every pokemon caught in it
 * https://bulbapedia.bulbagarden.net/wiki/Mind_Blown_(move)
 */
export const MIND_BLOWN_SHARE = 0.5;

export default function setupMindBlown(battle: Battle): void {
  battle.on(BattleEvents.UnitTriggerMove, AttackPriority.Post, (event) => {
    if (event.move !== Moves.MindBlown) {
      return;
    }

    const unit = event.source;

    unit.damage(
      { type: EffectType.Move, move: event.move, unit },
      unit,
      Math.ceil(unit.checkStat(Stats.HP, 0) * MIND_BLOWN_SHARE),
      DamageFlags.Indirect | DamageFlags.HealthScaled | DamageFlags.Cost,
    );
  });
}
