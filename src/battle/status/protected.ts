import { EventPriority } from '../../core/event-emitter';
import { MoveCategories, Moves } from '../../data/ids/moves';
import { getMoveData } from '../../data/moves';
import { guardOf } from '../moves/protect';
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
 * it, Shadow Force and Phantom Force come back from off the field, and
 * Hoopa's two moves reach round it from somewhere else, and Tearful Look
 * is not an attack to guard against. Anything else
 * that walks through, an ability among them, answers the question
 * below instead of being listed here
 */
const WALKS_THROUGH = new Set<Moves>([
  Moves.Feint,
  Moves.ShadowForce,
  Moves.PhantomForce,
  Moves.HyperspaceHole,
  Moves.HyperspaceFury,
  Moves.TearfulLook,
]);

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

    // A King's Shield is raised against blows, so a status move walks
    // straight past it without breaking it
    if (
      guardOf(target) === Moves.KingsShield &&
      getMoveData(event.move).category === MoveCategories.Status
    ) {
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
