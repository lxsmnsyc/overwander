import { AttackPriority, EventPriority } from '../../core/event-emitter';
import { DamageFlags, MoveAttackFlags, MoveCategories, Moves } from '../../data/ids/moves';
import { getMoveData } from '../../data/moves';
import type Battle from '../core';
import { BattleEvents, EffectType, MoveTargetType } from '../events';
import type Unit from '../unit';

interface CounterData {
  attacker: Unit;
  value: number;
}

/**
 * The two returning moves, and the half of the fight each one
 * answers: Counter throws a physical hit back, Mirror Coat a special
 * one. https://bulbapedia.bulbagarden.net/wiki/Counter_(move)
 */
const RETURNED: { [key in Moves]?: MoveCategories } = {
  [Moves.Counter]: MoveCategories.Physical,
  [Moves.MirrorCoat]: MoveCategories.Special,
};

export default function setupCounter(battle: Battle): void {
  const taken = new Map<MoveCategories, Map<Unit, CounterData>>([
    [MoveCategories.Physical, new Map()],
    [MoveCategories.Special, new Map()],
  ]);

  function lastHit(unit: Unit, move: Moves): CounterData | undefined {
    const category = RETURNED[move];

    return category == null ? undefined : taken.get(category)?.get(unit);
  }

  // Track the last direct hit of each kind every unit takes
  battle.on(BattleEvents.UnitDamage, AttackPriority.Post, (event) => {
    if (
      event.success &&
      !(event.flags & DamageFlags.Indirect) &&
      event.cause.type === EffectType.Move &&
      event.cause.unit !== event.target
    ) {
      taken.get(getMoveData(event.cause.move).category)?.set(event.target, {
        attacker: event.cause.unit,
        value: event.value,
      });
    }
  });

  function forget(unit: Unit): void {
    for (const record of taken.values()) {
      record.delete(unit);
    }
  }

  battle.on(BattleEvents.UnitFaints, EventPriority.Post, (event) => {
    forget(event.source);
  });

  battle.on(BattleEvents.UnitLeavesField, EventPriority.Post, (event) => {
    forget(event.source);
  });

  // Counter returns a hit, so there has to be one to return, and
  // somebody still standing to return it to. The AI asks the same
  // record the trigger below reads
  battle.on(BattleEvents.CheckUnitAIMoveUsable, AttackPriority.Exact, (event) => {
    if (event.usable && RETURNED[event.move] != null) {
      event.usable = lastHit(event.source, event.move)?.attacker.alive === true;
    }
  });

  battle.on(BattleEvents.UnitTriggerMoveEffect, EventPriority.Exact, (event) => {
    const category = RETURNED[event.move];

    if (category == null) {
      return;
    }

    const record = lastHit(event.source, event.move);

    // Fails without a hit of that kind to return, or when whoever
    // landed it is gone
    if (!record?.attacker.alive) {
      event.source.triggerMoveEffectFailed(event.move, event.target, event.steps);
      return;
    }

    // Return double the damage, ignoring the selected target
    event.source.attack(
      record.attacker,
      event.move,
      record.value * 2,
      event.source.checkMoveType(event.move, {
        type: MoveTargetType.Unit,
        unit: record.attacker,
      }),
      getMoveData(event.move).category,
      MoveAttackFlags.Pure,
    );

    taken.get(category)?.delete(event.source);
  });
}
