import { describe, expect, it } from 'vitest';
import type Battle from '../../../src/battle/core';
import {
  BattleEvents,
  EffectType,
  type UnitAttackEvent,
  type UnitAttackResolveCriticalEvent,
} from '../../../src/battle/events';
import type Unit from '../../../src/battle/unit';
import { Stats } from '../../../src/data/constants/stats';
import { Types } from '../../../src/data/constants/types';
import Abilities from '../../../src/data/ids/abilities';
import { MoveCategories, Moves } from '../../../src/data/ids/moves';
import { Statuses } from '../../../src/data/ids/status';
import turns from '../../../src/battle/turn';
import { createBattle, createUnit, pinRandom } from '../harness';

function makeAttack(
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

function resolveAttackStat(
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

/** Whether the blow lands critically, once everybody has answered */
function resolveCritical(battle: Battle, parent: UnitAttackEvent): boolean {
  const event: UnitAttackResolveCriticalEvent = {
    id: 'UnitAttackResolveCriticalHit',
    disabled: false,
    parent,
    critical: false,
  };
  battle.emit(BattleEvents.UnitAttackResolveCriticalHit, event);
  return event.critical;
}

describe('Heatproof', () => {
  it('halves the attacking stat behind a Fire move and nothing else', () => {
    const { battle, teamA, teamB } = createBattle();
    const attacker = createUnit(battle, teamA);
    const bronze = createUnit(battle, teamB);
    bronze.addAbility(Abilities.Heatproof);

    const fire = makeAttack(attacker, bronze, Moves.Ember, Types.Fire, MoveCategories.Special);

    expect(resolveAttackStat(battle, fire, attacker, Stats.SpecialAttack, 100)).toBe(50);

    // Thick Fat's other half is not its: Ice comes through whole
    const ice = makeAttack(attacker, bronze, Moves.IceBeam, Types.Ice, MoveCategories.Special);

    expect(resolveAttackStat(battle, ice, attacker, Stats.SpecialAttack, 100)).toBe(100);

    // And what the holder throws is its own business
    const thrown = makeAttack(bronze, attacker, Moves.Ember, Types.Fire, MoveCategories.Special);

    expect(resolveAttackStat(battle, thrown, bronze, Stats.SpecialAttack, 100)).toBe(100);
  });
});

describe('Heatproof and a burn', () => {
  it('takes half of what the burn would have cost it', () => {
    const { battle, teamA, teamB } = createBattle();
    const bronze = createUnit(battle, teamA);
    const plain = createUnit(battle, teamB);
    bronze.addAbility(Abilities.Heatproof);

    // A residual only chips when somebody is behind it
    const cause = { type: EffectType.Move, unit: plain, move: Moves.Ember } as const;

    bronze.addStatus(Statuses.Burned, cause);
    plain.addStatus(Statuses.Burned, cause);

    const bronzeHP = bronze.health;
    const plainHP = plain.health;

    battle.tick(turns(1));

    const taken = plainHP - plain.health;

    expect(taken).toBeGreaterThan(0);
    expect(bronzeHP - bronze.health).toBeCloseTo(taken / 2, 5);
  });
});

describe('Merciless', () => {
  it('lands critically on a poisoned target, and armour still refuses it', () => {
    const { battle, teamA, teamB } = createBattle();
    const scorpion = createUnit(battle, teamA);
    const target = createUnit(battle, teamB);
    scorpion.addAbility(Abilities.Merciless);

    // Pinned above any roll, so a critical here is the ability's doing
    pinRandom(battle, 1);

    const parent = makeAttack(
      scorpion,
      target,
      Moves.Tackle,
      Types.Normal,
      MoveCategories.Physical,
    );

    expect(resolveCritical(battle, parent)).toBe(false);

    target.addStatus(Statuses.Poisoned, { type: EffectType.None });

    expect(resolveCritical(battle, parent)).toBe(true);

    // Armour answers after the ability, so it has the last word
    target.addAbility(Abilities.BattleArmor);

    expect(resolveCritical(battle, parent)).toBe(false);
  });
});

describe('Aroma Veil', () => {
  it('keeps its whole team out of everything that takes a mind away', () => {
    const { battle, teamA, teamB } = createBattle();
    const veil = createUnit(battle, teamA);
    const ally = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    veil.addAbility(Abilities.AromaVeil);

    const cause = { type: EffectType.Move, unit: enemy, move: Moves.Taunt } as const;

    ally.addStatus(Statuses.Taunted, cause);
    veil.addStatus(Statuses.Tormented, cause);
    enemy.addStatus(Statuses.Taunted, { type: EffectType.None });

    // The holder is on its own team, so it is under its own veil
    expect(ally.status[Statuses.Taunted]).toBeUndefined();
    expect(veil.status[Statuses.Tormented]).toBeUndefined();
    expect(enemy.status[Statuses.Taunted]).toBeDefined();

    // A burn is not a thing anybody was talked into
    ally.addStatus(Statuses.Burned, cause);

    expect(ally.status[Statuses.Burned]).toBeDefined();
  });
});
