import { EventPriority } from '../../core/event-emitter';
import { Statuses } from '../../data/ids/status';
import type Battle from '../core';
import { BattleEvents } from '../events';
import turns from '../turn';
import createTimedStatus from './__create';

const DURATION = turns(5);

const setupTimer = createTimedStatus(Statuses.MagnetRisen, DURATION);

/**
 * MagnetRisen: the unit is riding its own magnetic field, so nothing
 * on the floor reaches it. Answered where the engine asks whether a
 * unit is on the ground, so a Ground move, a Spike and an Arena Trap
 * are all told the same thing
 * https://bulbapedia.bulbagarden.net/wiki/Magnet_Rise_(move)
 */
export default function setupMagnetRisenStatus(battle: Battle): void {
  setupTimer(battle);

  battle.on(BattleEvents.CheckUnitGrounded, EventPriority.Post, (event) => {
    if (event.source.status[Statuses.MagnetRisen] != null) {
      event.grounded = false;
    }
  });
}
