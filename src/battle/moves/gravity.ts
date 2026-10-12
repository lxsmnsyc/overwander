import { AttackPriority, EventPriority } from '../../core/event-emitter';
import { Types } from '../../data/constants/types';
import Abilities from '../../data/ids/abilities';
import { Moves } from '../../data/ids/moves';
import { USELESS_PENALTY } from '../ai/score';
import type Battle from '../core';
import { BattleEvents, MoveTargetType } from '../events';
import turns from '../turn';

/**
 * Gravity pulls the whole field down for a while: nothing is Flying
 * out of the way of a Ground move and nothing is levitating over one.
 *
 * It covers the battle rather than one side, the way the sports and
 * the weather do, and it is read where an immunity is asked for
 * rather than written onto each unit: a pokemon that comes in while
 * it holds is just as stuck as one that was already standing there
 * https://bulbapedia.bulbagarden.net/wiki/Gravity_(move)
 */
const DURATION = turns(5);

/** What a Grav Apple is worth while the field runs heavy */
const GRAV_APPLE_BOOST = 1.5;

const PULLS = new WeakMap<Battle, () => void>();

/** Call up Gravity from something other than the move (G-Max Gravitas) */
export function pullDown(battle: Battle): void {
  PULLS.get(battle)?.();
}

export default function setupGravity(battle: Battle): void {
  /** How long the field still has to run heavy */
  let remaining = 0;

  PULLS.set(battle, () => {
    remaining = DURATION;
  });

  battle.on(BattleEvents.UnitTriggerMoveEffect, AttackPriority.Exact, (event) => {
    if (event.move === Moves.Gravity) {
      remaining = DURATION;
    }
  });

  battle.on(BattleEvents.Tick, EventPriority.Post, (event) => {
    remaining = Math.max(0, remaining - event.duration);
  });

  battle.on(BattleEvents.CheckUnitMoveImmunity, EventPriority.Post, (event) => {
    if (
      event.immune &&
      remaining > 0 &&
      event.type === Types.Ground &&
      event.target.type === MoveTargetType.Unit
    ) {
      const target = event.target.unit;

      // Whichever way it was staying up, the floor has it now
      if (target.types.has(Types.Flying) || target.hasAbility(Abilities.Levitate)) {
        event.immune = false;
      }
    }
  });

  // Grav Apple falls harder for the field pulling it down
  battle.on(BattleEvents.CheckUnitMovePower, EventPriority.Post, (event) => {
    if (event.power != null && event.move === Moves.GravApple && remaining > 0) {
      event.power *= GRAV_APPLE_BOOST;
    }
  });

  // Pulling down a field that is already down is a cast spent on it
  // twice
  battle.on(BattleEvents.CheckUnitAIMoveScore, AttackPriority.Post, (event) => {
    if (event.move === Moves.Gravity && remaining > 0) {
      event.score -= USELESS_PENALTY;
    }
  });
}
