import { EventPriority } from '../../core/event-emitter';
import { Statuses } from '../../data/ids/status';
import type Battle from '../core';
import { BattleEvents, EffectType, MoveTargetType } from '../events';
import turns from '../turn';
import createTimedStatus from './__create';

/**
 * How long a guard holds: one cast, the same window a flinch costs.
 * The mainline spends a turn on it, and a turn here is a cast
 */
const DURATION = turns(1);

const setupTimer = createTimedStatus(Statuses.Protected, DURATION);

/**
 * Guarding: everything aimed at the unit from outside is turned away
 * while it holds. https://bulbapedia.bulbagarden.net/wiki/Protect_(move)
 */
export default function setupProtectedStatus(battle: Battle): void {
  setupTimer(battle);

  battle.on(BattleEvents.CheckUnitMoveImmunity, EventPriority.Post, (event) => {
    if (event.immune || event.target.type !== MoveTargetType.Unit) {
      return;
    }

    const target = event.target.unit;

    // A guard turns away what somebody else aims at it, never what the
    // unit does to itself
    if (target !== event.source && target.status[Statuses.Protected] != null) {
      event.immune = true;

      target.triggerStatus(Statuses.Protected, { type: EffectType.None });
    }
  });
}
