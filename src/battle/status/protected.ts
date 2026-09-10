import { EventPriority } from '../../core/event-emitter';
import { Moves } from '../../data/ids/moves';
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
 * The moves a guard does not stop by themselves: Feint walks through
 * it and Shadow Force comes back from off the field. Anything else
 * that walks through, an ability among them, answers the question
 * below instead of being listed here
 */
const WALKS_THROUGH = new Set<Moves>([Moves.Feint, Moves.ShadowForce]);

/**
 * Guarding: everything aimed at the unit from outside is turned away
 * while it holds. https://bulbapedia.bulbagarden.net/wiki/Protect_(move)
 */
export default function setupProtectedStatus(battle: Battle): void {
  setupTimer(battle);

  // The two moves that walk through by themselves, answered where the
  // guard is written rather than where each move is
  battle.on(BattleEvents.CheckUnitMoveGuard, EventPriority.Exact, (event) => {
    if (WALKS_THROUGH.has(event.move)) {
      event.walks = true;
    }
  });

  battle.on(BattleEvents.CheckUnitMoveImmunity, EventPriority.Post, (event) => {
    if (event.immune || event.target.type !== MoveTargetType.Unit) {
      return;
    }

    const target = event.target.unit;

    const guard = target.status[Statuses.Protected];

    // A guard turns away what somebody else aims at it, never what the
    // unit does to itself
    if (target === event.source || guard == null) {
      return;
    }

    // The guard does not survive being walked through
    if (event.source.checkMoveGuard(event.move, event.target)) {
      target.removeStatus(Statuses.Protected, guard);
      return;
    }

    event.immune = true;

    target.triggerStatus(Statuses.Protected, { type: EffectType.None });
  });
}
