import { AttackPriority } from '../../core/event-emitter';
import { Stats } from '../../data/constants/stats';
import { DamageFlags, Moves } from '../../data/ids/moves';
import { Statuses } from '../../data/ids/status';
import type Battle from '../core';
import { BattleEvents, EffectType } from '../events';
import type Unit from '../unit';

/**
 * A quarter of the user's pool, which is what a substitute is made of
 */
function getSubstituteCost(source: Unit): number {
  return Math.floor(source.checkStat(Stats.HP, 0) / 4);
}

/**
 * Fails if a substitute is already up, or the user cannot afford the
 * HP cost without fainting
 */
function canSubstitute(source: Unit): boolean {
  return source.status[Statuses.Substituted] == null && source.health > getSubstituteCost(source);
}

// https://bulbapedia.bulbagarden.net/wiki/Substitute_(move)
export default function setupSubstitute(battle: Battle): void {
  battle.on(BattleEvents.CheckUnitAIMoveUsable, AttackPriority.Exact, (event) => {
    if (event.usable && event.move === Moves.Substitute && !canSubstitute(event.source)) {
      event.usable = false;
    }
  });

  battle.on(BattleEvents.UnitTriggerMoveEffect, AttackPriority.Exact, (event) => {
    if (event.move !== Moves.Substitute) {
      return;
    }

    const source = event.source;
    const cost = getSubstituteCost(source);

    if (!canSubstitute(source)) {
      source.triggerMoveEffectFailed(Moves.Substitute, event.target, event.steps);
      return;
    }

    const cause = {
      type: EffectType.Move,
      move: Moves.Substitute,
      unit: source,
    } as const;

    // Pay the HP cost first so the fresh substitute doesn't absorb it.
    // It is a price rather than damage, so even a unit that shrugs
    // off indirect damage pays it
    source.damage(cause, source, cost, DamageFlags.Indirect | DamageFlags.Cost);

    source.addStatus(Statuses.Substituted, cause);
  });
}
