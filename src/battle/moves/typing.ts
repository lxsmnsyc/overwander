import { AttackPriority } from '../../core/event-emitter';
import { Types } from '../../data/constants/types';
import Abilities from '../../data/ids/abilities';
import { Moves } from '../../data/ids/moves';
import type Battle from '../core';
import { BattleEvents, MoveTargetType } from '../events';
import type Unit from '../unit';

/**
 * The two moves that rewrite a pokemon's types: Soak makes the target
 * pure Water, Reflect Type copies the target's types onto the user
 * https://bulbapedia.bulbagarden.net/wiki/Soak_(move)
 */

function hasExactly(unit: Unit, types: Types[]): boolean {
  return unit.types.size === types.length && types.every((type) => unit.types.has(type));
}

function retype(unit: Unit, types: Types[]): void {
  for (const held of unit.types) {
    unit.removeType(held);
  }
  for (const type of types) {
    unit.addType(type);
  }
}

/** Whether the move would change anything, which is also when it works */
function changes(move: Moves, source: Unit, target: Unit): boolean {
  if (move === Moves.Soak) {
    // A Multitype pokemon's type is its plate's, not something to wash off
    return !hasExactly(target, [Types.Water]) && !target.hasAbility(Abilities.Multitype);
  }
  return target.types.size > 0 && !hasExactly(source, [...target.types]);
}

const TYPING_MOVES = new Set<Moves>([Moves.Soak, Moves.ReflectType]);

export default function setupTypingMoves(battle: Battle): void {
  battle.on(BattleEvents.UnitTriggerMoveEffect, AttackPriority.Exact, (event) => {
    if (!TYPING_MOVES.has(event.move) || event.target.type !== MoveTargetType.Unit) {
      return;
    }

    const target = event.target.unit;

    if (!changes(event.move, event.source, target)) {
      event.source.triggerMoveEffectFailed(event.move, event.target, event.steps);
      return;
    }

    if (event.move === Moves.Soak) {
      retype(target, [Types.Water]);
    } else {
      retype(event.source, [...target.types]);
    }
  });

  battle.on(BattleEvents.CheckUnitAIMoveUsable, AttackPriority.Exact, (event) => {
    if (event.usable && TYPING_MOVES.has(event.move)) {
      event.usable =
        event.target.type === MoveTargetType.Unit &&
        changes(event.move, event.source, event.target.unit);
    }
  });
}
