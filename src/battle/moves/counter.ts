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

/**
 * What Metal Burst gives back. Counter and Mirror Coat each answer
 * one half of the fight and double it; Metal Burst answers whichever
 * landed last and gives back half again, which is what the wider
 * reach costs it
 */
const BURST_SHARE = 1.5;

const COUNTER_SHARE = 2;

export default function setupCounter(battle: Battle): void {
  const taken = new Map<MoveCategories, Map<Unit, CounterData>>([
    [MoveCategories.Physical, new Map()],
    [MoveCategories.Special, new Map()],
  ]);

  /** Whatever landed last, whichever half of the fight it came from */
  const latest = new Map<Unit, CounterData>();

  function lastHit(unit: Unit, move: Moves): CounterData | undefined {
    if (move === Moves.MetalBurst) {
      return latest.get(unit);
    }

    const category = RETURNED[move];

    return category == null ? undefined : taken.get(category)?.get(unit);
  }

  /** Whether this move gives a hit back at all, and so reads the record */
  function returns(move: Moves): boolean {
    return move === Moves.MetalBurst || RETURNED[move] != null;
  }

  // Track the last direct hit of each kind every unit takes
  battle.on(BattleEvents.UnitDamage, AttackPriority.Post, (event) => {
    if (
      event.success &&
      !(event.flags & DamageFlags.Indirect) &&
      event.cause.type === EffectType.Move &&
      event.cause.unit !== event.target
    ) {
      const record = { attacker: event.cause.unit, value: event.value };

      taken.get(getMoveData(event.cause.move).category)?.set(event.target, record);
      latest.set(event.target, record);
    }
  });

  function forget(unit: Unit): void {
    for (const record of taken.values()) {
      record.delete(unit);
    }
    latest.delete(unit);
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
    if (event.usable && returns(event.move)) {
      event.usable = lastHit(event.source, event.move)?.attacker.alive === true;
    }
  });

  battle.on(BattleEvents.UnitTriggerMoveEffect, AttackPriority.Exact, (event) => {
    if (!returns(event.move)) {
      return;
    }

    const record = lastHit(event.source, event.move);

    // Fails without a hit of that kind to return, or when whoever
    // landed it is gone
    if (!record?.attacker.alive) {
      event.source.triggerMoveEffectFailed(event.move, event.target, event.steps);
      return;
    }

    // Given back to whoever landed it, whatever the move was aimed at
    event.source.attack(
      record.attacker,
      event.move,
      record.value * (event.move === Moves.MetalBurst ? BURST_SHARE : COUNTER_SHARE),
      event.source.checkMoveType(event.move, {
        type: MoveTargetType.Unit,
        unit: record.attacker,
      }),
      getMoveData(event.move).category,
      MoveAttackFlags.Pure,
    );

    const category = RETURNED[event.move];

    if (category != null) {
      taken.get(category)?.delete(event.source);
    }
    latest.delete(event.source);
  });
}
