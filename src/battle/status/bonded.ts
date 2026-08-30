import { EventPriority } from '../../core/event-emitter';
import { Statuses } from '../../data/ids/status';
import type Battle from '../core';
import { BattleEvents } from '../events';
import turns from '../turn';
import createTimedStatus from './__create';

/**
 * How long the bond holds. The mainline holds it until the user's
 * next move; a fight with no turns needs a clock, and two casts is
 * about what one costs
 */
const DURATION = turns(2);

const setupTimer = createTimedStatus(Statuses.Bonded, DURATION);

/**
 * Bound fate: whoever knocks the bonded unit out goes down with it
 * https://bulbapedia.bulbagarden.net/wiki/Destiny_Bond_(move)
 */
export default function setupBondedStatus(battle: Battle): void {
  setupTimer(battle);

  battle.on(BattleEvents.UnitFaints, EventPriority.Post, (event) => {
    const attacker = event.attacker;

    if (
      event.source.status[Statuses.Bonded] == null ||
      attacker === event.source ||
      !attacker.alive
    ) {
      return;
    }

    attacker.faint(event.source);
  });
}
