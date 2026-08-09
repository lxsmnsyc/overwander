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

// https://bulbapedia.bulbagarden.net/wiki/Counter_(move)
export default function setupCounter(battle: Battle): void {
  const lastPhysicalHit = new Map<Unit, CounterData>();

  // Track the last direct physical hit each unit takes
  battle.on(BattleEvents.UnitDamage, AttackPriority.Post, (event) => {
    if (
      event.success &&
      !(event.flags & DamageFlags.Indirect) &&
      event.cause.type === EffectType.Move &&
      event.cause.unit !== event.target &&
      getMoveData(event.cause.move).category === MoveCategories.Physical
    ) {
      lastPhysicalHit.set(event.target, {
        attacker: event.cause.unit,
        value: event.value,
      });
    }
  });

  battle.on(BattleEvents.UnitFaints, EventPriority.Post, (event) => {
    lastPhysicalHit.delete(event.source);
  });

  battle.on(BattleEvents.UnitLeavesField, EventPriority.Post, (event) => {
    lastPhysicalHit.delete(event.source);
  });

  battle.on(BattleEvents.UnitTriggerMoveEffect, EventPriority.Exact, (event) => {
    if (event.move !== Moves.Counter) {
      return;
    }

    const record = lastPhysicalHit.get(event.source);

    // Fails without a physical hit to return, or when the attacker is gone
    if (!record?.attacker.alive) {
      event.source.triggerMoveEffectFailed(Moves.Counter, event.target, event.steps);
      return;
    }

    // Return double the damage, ignoring the selected target
    event.source.attack(
      record.attacker,
      Moves.Counter,
      record.value * 2,
      event.source.checkMoveType(event.move, {
        type: MoveTargetType.Unit,
        unit: record.attacker,
      }),
      getMoveData(event.move).category,
      MoveAttackFlags.Pure,
    );

    lastPhysicalHit.delete(event.source);
  });
}
