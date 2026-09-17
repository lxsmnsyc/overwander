// Shared by the signature suites beside this file.
import type Battle from '../../../../src/battle/core';
import {
  BattleEvents,
  EffectType,
  MoveTargetType,
  type UnitAttackEvent,
} from '../../../../src/battle/events';
import type Unit from '../../../../src/battle/unit';
import type { Stats } from '../../../../src/data/constants/stats';
import { Types } from '../../../../src/data/constants/types';
import { MoveCategories, Moves } from '../../../../src/data/ids/moves';
import type { createUnit } from '../../harness';

export const NONE_CAUSE = { type: EffectType.None } as const;

/** Deterministic direct attack; returns the health lost by the target */
export function dealDamage(
  attacker: ReturnType<typeof createUnit>,
  defender: ReturnType<typeof createUnit>,
  move: Moves,
  power: number,
  type: Types,
  category: MoveCategories,
): number {
  const before = defender.health;
  attacker.attack(defender, move, power, type, category, 0);
  return before - defender.health;
}

/** The unit reaching for a move, which is when a residual is paid */
export function act(battle: Battle, unit: Unit): void {
  battle.emit(BattleEvents.UnitCast, {
    id: 'UnitCast',
    disabled: false,
    source: unit,
    move: Moves.Tackle,
    target: { type: MoveTargetType.None },
  });
}

/** A synthetic blow, for the resolvers that answer questions about one */
export function makeAttack(
  source: Unit,
  target: Unit,
  move: Moves,
  type: Types,
  category: MoveCategories,
): UnitAttackEvent {
  return {
    id: 'UnitAttack',
    disabled: false,
    source,
    target,
    move,
    value: 0,
    category,
    type,
    flags: 0,
    success: false,
  };
}

export function resolveAttackStat(
  battle: Battle,
  parent: UnitAttackEvent,
  unit: Unit,
  stat: Stats,
  value: number,
): number {
  const event = {
    id: 'UnitAttackResolveStat',
    disabled: false,
    parent,
    unit,
    stat,
    value,
  };
  battle.emit(BattleEvents.UnitAttackResolveStat, event);
  return event.value;
}

/** Whether the blow lands once every listener has answered for it */
export function rolled(battle: Battle, source: Unit, target: Unit, move: Moves): boolean {
  const event = {
    id: 'UnitTriggerMoveRollHit',
    disabled: false,
    parent: {
      id: 'UnitTriggerMove',
      disabled: false,
      source,
      move,
      target: { type: MoveTargetType.Unit, unit: target } as const,
      steps: 0,
    },
    hit: true,
  };
  battle.emit(BattleEvents.UnitTriggerMoveRollHit, event);
  return event.hit;
}

export function rollMove(
  battle: Battle,
  source: Unit,
  target: Unit,
  move: Moves,
  hit: boolean,
): void {
  battle.emit(BattleEvents.UnitTriggerMoveRollHit, {
    id: 'UnitTriggerMoveRollHit',
    disabled: false,
    parent: {
      id: 'UnitTriggerMove',
      disabled: false,
      source,
      move,
      target: { type: MoveTargetType.Unit, unit: target },
      steps: 0,
    },
    hit,
  });
}

/** What one plain blow works out to against a given defender */
export function resolveAttackDamage(battle: Battle, attacker: Unit, target: Unit): number {
  const event = {
    id: 'UnitAttackResolveDamage',
    disabled: false,
    parent: makeAttack(attacker, target, Moves.Pound, Types.Normal, MoveCategories.Physical),
    value: 0,
  };
  battle.emit(BattleEvents.UnitAttackResolveDamage, event);
  return event.value;
}
