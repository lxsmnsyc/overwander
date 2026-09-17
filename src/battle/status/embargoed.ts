import { EventPriority } from '../../core/event-emitter';
import { Statuses } from '../../data/ids/status';
import type Battle from '../core';
import { BattleEvents } from '../events';
import turns from '../turn';
import createTimedStatus from './__create';

const DURATION = turns(5);

const setupTimer = createTimedStatus(Statuses.Embargoed, DURATION);

/**
 * Embargoed: whatever the unit is holding does nothing while it
 * lasts. The item is still there and comes back on afterwards, which
 * is what separates an embargo from having it knocked off
 * https://bulbapedia.bulbagarden.net/wiki/Embargo_(move)
 */
export default function setupEmbargoedStatus(battle: Battle): void {
  setupTimer(battle);

  battle.on(BattleEvents.CheckUnitItem, EventPriority.Post, (event) => {
    if (event.source.status[Statuses.Embargoed] != null) {
      event.enabled = false;
    }
  });
}
