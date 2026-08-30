import { EventPriority } from '../../core/event-emitter';
import { Statuses } from '../../data/ids/status';
import type Battle from '../core';
import { BattleEvents, EffectType } from '../events';
import turns from '../turn';
import createTimedStatus from './__create';

/**
 * Held on the field for five casts. The mainline holds a target until
 * whoever caught it leaves; a timer is what a real-time fight can
 * promise to let go of
 */
const DURATION = turns(5);

const setupTimer = createTimedStatus(Statuses.Cornered, DURATION);

/**
 * Cornered: the unit cannot be swapped out. It is the hold Mean Look
 * and Spider Web put on, with none of the chip damage a bind does
 */
export default function setupCorneredStatus(battle: Battle): void {
  setupTimer(battle);

  battle.on(BattleEvents.CheckUnitEscape, EventPriority.Post, (event) => {
    if (event.success && event.source.status[Statuses.Cornered] != null) {
      event.success = false;

      event.source.triggerStatus(Statuses.Cornered, { type: EffectType.None });
    }
  });
}
