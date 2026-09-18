import { EventPriority } from '../../core/event-emitter';
import { Statuses } from '../../data/ids/status';
import type Battle from '../core';
import { BattleEvents, MoveTargetType } from '../events';
import { OHKO_MOVES } from '../moves/fixed-damage';
import turns from '../turn';
import createTimedStatus from './__create';

const DURATION = turns(3);

const setupTimer = createTimedStatus(Statuses.Telekinetic, DURATION);

/**
 * Telekinetic: the unit is held up off the ground, and anything aimed
 * at it lands, except a one-hit knockout
 * https://bulbapedia.bulbagarden.net/wiki/Telekinesis_(move)
 */
export default function setupTelekineticStatus(battle: Battle): void {
  setupTimer(battle);

  battle.on(BattleEvents.CheckUnitGrounded, EventPriority.Post, (event) => {
    if (event.source.status[Statuses.Telekinetic] != null) {
      event.grounded = false;
    }
  });

  battle.on(BattleEvents.CheckUnitMoveAccuracy, EventPriority.Post, (event) => {
    if (
      event.target.type === MoveTargetType.Unit &&
      event.target.unit.status[Statuses.Telekinetic] != null &&
      !OHKO_MOVES.has(event.move)
    ) {
      event.accuracy = undefined;
    }
  });
}
