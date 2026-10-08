import { AttackPriority } from '../../core/event-emitter';
import { Moves } from '../../data/ids/moves';
import { Statuses } from '../../data/ids/status';
import type Battle from '../core';
import { BattleEvents, EffectType } from '../events';

/**
 * Power Trick swaps the user's Attack and Defense over, and casting
 * it again puts them back: a unit is either tricked or it is not, and
 * the mark is what says which. What the swap does to a stat is in
 * `status/power-tricked.ts`
 * https://bulbapedia.bulbagarden.net/wiki/Power_Trick_(move)
 *
 * Power Shift is the same trick across both pairs: Special Attack and
 * Special Defense change places too
 */
const TRICKS = new Map<Moves, Statuses>([
  [Moves.PowerTrick, Statuses.PowerTricked],
  [Moves.PowerShift, Statuses.PowerShifted],
]);

export default function setupPowerTrick(battle: Battle): void {
  battle.on(BattleEvents.UnitTriggerMoveEffect, AttackPriority.Exact, (event) => {
    const status = TRICKS.get(event.move);

    if (status == null) {
      return;
    }

    const cause = { type: EffectType.Move, move: event.move, unit: event.source } as const;
    const tricked = event.source.status[status];

    if (tricked == null) {
      event.source.addStatus(status, cause);
    } else {
      event.source.removeStatus(status, tricked);
    }
  });
}
