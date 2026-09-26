import { AttackPriority } from '../../core/event-emitter';
import { Stages } from '../../data/constants/stats';
import { DamageFlags, Moves } from '../../data/ids/moves';
import type Battle from '../core';
import { BattleEvents, EffectType } from '../events';

/**
 * Fell Stinger: finishing something off with it sharpens the user.
 * The modern three stages rather than the two it started with
 * https://bulbapedia.bulbagarden.net/wiki/Fell_Stinger_(move)
 */
export const FELL_STINGER_STAGES = 3;

export default function setupFellStinger(battle: Battle): void {
  battle.on(BattleEvents.UnitDamage, AttackPriority.Post, (event) => {
    if (
      !event.success ||
      event.target.alive ||
      event.flags & DamageFlags.Indirect ||
      event.cause.type !== EffectType.Move ||
      event.cause.move !== Moves.FellStinger
    ) {
      return;
    }

    event.source.addStage(Stages.Attack, FELL_STINGER_STAGES, event.cause);
  });
}
