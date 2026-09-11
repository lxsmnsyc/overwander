import { EventPriority } from '../../core/event-emitter';
import { Statuses } from '../../data/ids/status';
import type Battle from '../core';
import { BattleEvents } from '../events';
import turns from '../turn';
import createTimedStatus from './__create';

const DURATION = turns(2);

/** What a hand is worth on the move it is lent to */
const HELPED_POWER = 1.5;

const setupTimer = createTimedStatus(Statuses.Helped, DURATION);

/**
 * Helped: somebody is lending a hand, and the next move this unit
 * lands is worth half as much again. It is spent on that move, so a
 * hand cannot be banked
 * https://bulbapedia.bulbagarden.net/wiki/Helping_Hand_(move)
 */
export default function setupHelpedStatus(battle: Battle): void {
  setupTimer(battle);

  battle.on(BattleEvents.CheckUnitMovePower, EventPriority.Post, (event) => {
    if (event.power != null && event.source.status[Statuses.Helped] != null) {
      event.power *= HELPED_POWER;
    }
  });

  // Spent where the move resolves rather than where it is thrown: the
  // power is read a delay later, so a hand taken back at the throw is a
  // hand that was never lent
  battle.on(BattleEvents.UnitTriggerMoveEnd, EventPriority.Post, (event) => {
    const helped = event.source.status[Statuses.Helped];

    if (helped != null) {
      event.source.removeStatus(Statuses.Helped, helped);
    }
  });
}
