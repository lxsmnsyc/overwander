import { EventPriority } from '../../core/event-emitter';
import { Stats } from '../../data/constants/stats';
import { DamageFlags, Moves } from '../../data/ids/moves';
import { Statuses } from '../../data/ids/status';
import type Battle from '../core';
import { BattleEvents, EffectType } from '../events';

// https://bulbapedia.bulbagarden.net/wiki/Substitute_(move)
export default function setupSubstitute(battle: Battle): void {
  battle.on(BattleEvents.UnitTriggerMoveEffect, EventPriority.Exact, (event) => {
    if (event.move !== Moves.Substitute) {
      return;
    }

    const source = event.source;
    const cost = Math.floor(source.checkStat(Stats.HP, 0) / 4);

    // Fails if a substitute is already up, or the user cannot afford
    // the HP cost without fainting.
    if (source.status[Statuses.Substituted] || source.health <= cost) {
      source.triggerMoveEffectFailed(Moves.Substitute, event.target, event.steps);
      return;
    }

    const cause = {
      type: EffectType.Move,
      move: Moves.Substitute,
      unit: source,
    } as const;

    // Pay the HP cost first so the fresh substitute doesn't absorb it.
    source.damage(cause, source, cost, DamageFlags.Indirect);

    source.addStatus(Statuses.Substituted, cause);
  });
}
