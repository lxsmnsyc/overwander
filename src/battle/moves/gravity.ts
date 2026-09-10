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

export default function setupGravity(battle: Battle): void {
  /** How long the field still has to run heavy */
  let remaining = 0;

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

  // Pulling down a field that is already down is a cast spent on it
  // twice
  battle.on(BattleEvents.CheckUnitAIMoveScore, AttackPriority.Post, (event) => {
    if (event.move === Moves.Gravity && remaining > 0) {
      event.score -= USELESS_PENALTY;
    }
  });
}
