import { AttackPriority, EventPriority } from '../../core/event-emitter';
import { Types } from '../../data/constants/types';
import { Moves } from '../../data/ids/moves';
import type Battle from '../core';
import { BattleEvents } from '../events';
import turns from '../turn';

/**
 * Fairy Lock: nobody on the field can be swapped out for a turn. It
 * holds the whole field rather than one target, which is what sets it
 * apart from Mean Look's five-cast hold on one pokemon. A Ghost type
 * slips out of it, as it does out of every hold in the modern games
 * https://bulbapedia.bulbagarden.net/wiki/Fairy_Lock_(move)
 */
export const FAIRY_LOCK_DURATION = turns(1);

export default function setupFairyLock(battle: Battle): void {
  let held = 0;

  battle.on(BattleEvents.UnitTriggerMoveEffect, AttackPriority.Exact, (event) => {
    if (event.move === Moves.FairyLock) {
      held = FAIRY_LOCK_DURATION;
    }
  });

  battle.on(BattleEvents.Tick, EventPriority.Post, (event) => {
    held = Math.max(0, held - event.duration);
  });

  battle.on(BattleEvents.CheckUnitEscape, EventPriority.Post, (event) => {
    if (event.success && held > 0 && !event.source.types.has(Types.Ghost)) {
      event.success = false;
    }
  });
}
