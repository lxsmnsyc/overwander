import { EventPriority } from '../../core/event-emitter';
import { Statuses } from '../../data/ids/status';
import type Battle from '../core';
import { BattleEvents } from '../events';

/**
 * Raises the unit's critical hit ratio by 2 stages until it leaves
 * the field.
 * https://bulbapedia.bulbagarden.net/wiki/Focus_Energy_(move)
 */
export default function setupFocusEnergyStatus(battle: Battle): void {
  battle.on(BattleEvents.UnitAttackCheckCriticalRatio, EventPriority.Post, (event) => {
    if (event.parent.source.status[Statuses.FocusEnergy]) {
      event.value += 2;
    }
  });

  battle.on(BattleEvents.UnitLeavesField, EventPriority.Post, (event) => {
    const cause = event.source.status[Statuses.FocusEnergy];

    if (cause) {
      event.source.removeStatus(Statuses.FocusEnergy, cause);
    }
  });
}
