import { EventPriority } from '../../core/event-emitter';
import { Statuses } from '../../data/ids/status';
import type Battle from '../core';
import { BattleEvents } from '../events';
import turns from '../turn';
import createTimedStatus from './__create';

const DURATION = turns(5);

const setupTimer = createTimedStatus(Statuses.HealBlocked, DURATION);

/**
 * HealBlocked: nothing puts health back on this unit while it lasts.
 * It is answered at the point health would go on rather than at each
 * of the dozen things that heal, so a drain, a berry and a Wish are
 * all refused by the one rule
 * https://bulbapedia.bulbagarden.net/wiki/Heal_Block_(move)
 */
export default function setupHealBlockedStatus(battle: Battle): void {
  setupTimer(battle);

  battle.on(BattleEvents.CheckUnitCanHeal, EventPriority.Post, (event) => {
    if (event.target.status[Statuses.HealBlocked] != null) {
      event.success = false;
    }
  });
}
