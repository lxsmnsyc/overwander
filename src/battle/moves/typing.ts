import { AttackPriority, EventPriority } from '../../core/event-emitter';
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
  setupBurnUp(battle);

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

  setupAddedTypes(battle);
}

/**
 * Trick-or-Treat and Forest's Curse add a type on top of what the
 * target already is. There is room for one added type at a time, so
 * either move takes the place of whatever the other one added
 * https://bulbapedia.bulbagarden.net/wiki/Trick-or-Treat_(move)
 */
const ADDED_TYPES: { [key in Moves]?: Types } = {
  [Moves.TrickOrTreat]: Types.Ghost,
  [Moves.ForestsCurse]: Types.Grass,
};

function setupAddedTypes(battle: Battle): void {
  const added = new WeakMap<Unit, Types>();

  battle.on(BattleEvents.UnitTriggerMoveEffect, AttackPriority.Exact, (event) => {
    const type = ADDED_TYPES[event.move];

    if (type == null || event.target.type !== MoveTargetType.Unit) {
      return;
    }

    const target = event.target.unit;

    if (target.types.has(type)) {
      event.source.triggerMoveEffectFailed(event.move, event.target, event.steps);
      return;
    }

    const previous = added.get(target);

    if (previous != null) {
      target.removeType(previous);
    }
    target.addType(type);
    added.set(target, type);
  });

  battle.on(BattleEvents.CheckUnitAIMoveUsable, AttackPriority.Exact, (event) => {
    const type = ADDED_TYPES[event.move];

    if (event.usable && type != null) {
      event.usable =
        event.target.type === MoveTargetType.Unit && !event.target.unit.types.has(type);
    }
  });
}

/**
 * Burn Up spends the user's own fire: it only works from a Fire type,
 * and the user is not one afterwards
 * https://bulbapedia.bulbagarden.net/wiki/Burn_Up_(move)
 */
function setupBurnUp(battle: Battle): void {
  battle.on(BattleEvents.CheckUnitCanCast, EventPriority.Post, (event) => {
    if (event.success && event.move === Moves.BurnUp && !event.source.types.has(Types.Fire)) {
      event.success = false;
    }
  });

  battle.on(BattleEvents.CheckUnitAIMoveUsable, AttackPriority.Exact, (event) => {
    if (event.usable && event.move === Moves.BurnUp) {
      event.usable = event.source.types.has(Types.Fire);
    }
  });

  battle.on(BattleEvents.UnitTriggerMoveEffect, AttackPriority.Post, (event) => {
    if (event.move === Moves.BurnUp && event.source.types.has(Types.Fire)) {
      event.source.removeType(Types.Fire);
    }
  });
}
