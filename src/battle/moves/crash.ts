import { EventPriority } from '../../core/event-emitter';
import { Stats } from '../../data/constants/stats';
import { DamageFlags, Moves } from '../../data/ids/moves';
import type Battle from '../core';
import { BattleEvents, EffectType } from '../events';

/**
 * Moves whose user crashes on a miss, taking half its max HP (also
 * boosted by Reckless)
 */
export const CRASH_MOVES = new Set<Moves>([Moves.JumpKick, Moves.HiJumpKick]);

const CRASH_FRACTION = 0.5;

export default function setupCrashMoves(battle: Battle): void {
  battle.on(BattleEvents.UnitTriggerMoveMissed, EventPriority.Post, (event) => {
    const source = event.parent.source;

    if (CRASH_MOVES.has(event.parent.move)) {
      source.damage(
        { type: EffectType.Move, move: event.parent.move, unit: source },
        source,
        source.checkStat(Stats.HP, 0) * CRASH_FRACTION,
        DamageFlags.Indirect | DamageFlags.HealthScaled,
      );
    }
  });
}
