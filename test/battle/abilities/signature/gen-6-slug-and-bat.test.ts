// Goomy and Noibat.

import { describe, expect, it } from 'vitest';
import { Stages, Stats } from '../../../../src/data/constants/stats';
import { Types } from '../../../../src/data/constants/types';
import Abilities from '../../../../src/data/ids/abilities';
import {
  DamageFlags,
  MoveAttackFlags,
  MoveCategories,
  Moves,
} from '../../../../src/data/ids/moves';
import {
  SEEPAGE_DELAY,
  SEEPAGE_SHARE,
} from '../../../../src/battle/abilities/signature/goomy-and-noibat';
import type Battle from '../../../../src/battle/core';
import {
  BattleEvents,
  type UnitAttackEvent,
  type UnitAttackResolveCriticalEvent,
} from '../../../../src/battle/events';
import { createBattle, createUnit, pinRandom } from '../../harness';
import { NONE_CAUSE, dealDamage, makeAttack } from './helpers';

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

describe("Kalos's slug and bat", () => {
  it('holds back part of a blow and pays it out afterwards', () => {
    const { battle, teamA, teamB } = createBattle();
    const slug = createUnit(battle, teamA, [Types.Dragon]);
    const foe = createUnit(battle, teamB);

    pinRandom(battle, 1);
    slug.addAbility(Abilities.Seepage);
    slug.enter();
    foe.enter();

    const whole = slug.checkStat(Stats.HP, 0);
    const blow = whole / 4;

    foe.damage(NONE_CAUSE, slug, blow, 0);

    // Only the share that was not held back has landed
    expect(slug.health).toBeCloseTo(whole - blow * (1 - SEEPAGE_SHARE), 0);

    battle.tick(SEEPAGE_DELAY / 2);

    expect(slug.health).toBeLessThan(whole - blow * (1 - SEEPAGE_SHARE));
    expect(slug.health).toBeGreaterThan(whole - blow);

    battle.tick(SEEPAGE_DELAY);

    // The whole blow is paid in the end, and no more than the blow
    expect(slug.health).toBeCloseTo(whole - blow, 0);
  });

  it('leaves poison and the rest of the indirect damage alone', () => {
    const { battle, teamA, teamB } = createBattle();
    const slug = createUnit(battle, teamA, [Types.Dragon]);
    const foe = createUnit(battle, teamB);

    pinRandom(battle, 1);
    slug.addAbility(Abilities.Seepage);
    slug.enter();
    foe.enter();

    const whole = slug.checkStat(Stats.HP, 0);

    slug.damage(NONE_CAUSE, slug, whole / 8, DamageFlags.Indirect);

    expect(slug.health).toBeCloseTo(whole - whole / 8, 0);
  });

  it('answers whoever hit it with one critical hit', () => {
    const { battle, teamA, teamB } = createBattle();
    const bat = createUnit(battle, teamA, [Types.Flying, Types.Dragon]);
    const foe = createUnit(battle, teamB);

    // Pinned above any roll, so a critical here is the ability's doing
    pinRandom(battle, 1);
    bat.addAbility(Abilities.Echolocation);
    bat.enter();
    foe.enter();

    const strike = makeAttack(bat, foe, Moves.Pound, Types.Normal, MoveCategories.Physical);

    expect(resolveCritical(battle, strike)).toBe(false);

    dealDamage(foe, bat, Moves.Pound, 40, Types.Normal, MoveCategories.Physical);

    expect(resolveCritical(battle, strike)).toBe(true);
    // Spent on the one answer
    expect(resolveCritical(battle, strike)).toBe(false);
  });

  it('hears only enemies, and only the one that hit it', () => {
    const { battle, teamA, teamB } = createBattle();
    const bat = createUnit(battle, teamA, [Types.Flying, Types.Dragon]);
    const ally = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);
    const other = createUnit(battle, teamB);

    pinRandom(battle, 1);
    bat.addAbility(Abilities.Echolocation);
    bat.enter();
    ally.enter();
    foe.enter();
    other.enter();

    dealDamage(ally, bat, Moves.Pound, 40, Types.Normal, MoveCategories.Physical);

    expect(
      resolveCritical(
        battle,
        makeAttack(bat, ally, Moves.Pound, Types.Normal, MoveCategories.Physical),
      ),
    ).toBe(false);

    dealDamage(foe, bat, Moves.Pound, 40, Types.Normal, MoveCategories.Physical);

    expect(
      resolveCritical(
        battle,
        makeAttack(bat, other, Moves.Pound, Types.Normal, MoveCategories.Physical),
      ),
    ).toBe(false);
    expect(
      resolveCritical(
        battle,
        makeAttack(bat, foe, Moves.Pound, Types.Normal, MoveCategories.Physical),
      ),
    ).toBe(true);
  });

  it('lets the AI read the answer without spending it', () => {
    const { battle, teamA, teamB } = createBattle();
    const bat = createUnit(battle, teamA, [Types.Flying, Types.Dragon]);
    const foe = createUnit(battle, teamB);

    pinRandom(battle, 1);
    bat.addAbility(Abilities.Echolocation);
    bat.enter();
    foe.enter();

    dealDamage(foe, bat, Moves.Pound, 40, Types.Normal, MoveCategories.Physical);

    const guess = {
      ...makeAttack(bat, foe, Moves.Pound, Types.Normal, MoveCategories.Physical),
      flags: MoveAttackFlags.Simulated,
    };

    expect(resolveCritical(battle, guess)).toBe(true);
    expect(resolveCritical(battle, guess)).toBe(true);
    expect(
      resolveCritical(
        battle,
        makeAttack(bat, foe, Moves.Pound, Types.Normal, MoveCategories.Physical),
      ),
    ).toBe(true);
  });

  it('lands the answer as a critical in the damage', () => {
    const { battle, teamA, teamB } = createBattle();
    const bat = createUnit(battle, teamA, [Types.Flying, Types.Dragon]);
    const foe = createUnit(battle, teamB);

    pinRandom(battle, 1);
    bat.addAbility(Abilities.Echolocation);
    bat.enter();
    foe.enter();

    // A blow that may land critically, as a real move's does
    const strike = (): number => {
      const before = foe.health;

      bat.attack(
        foe,
        Moves.Pound,
        40,
        Types.Normal,
        MoveCategories.Physical,
        MoveAttackFlags.Critical,
      );
      return before - foe.health;
    };
    const whole = foe.checkStat(Stats.HP, 0);
    const bare = strike();

    foe.setHealth(whole);
    dealDamage(foe, bat, Moves.Pound, 40, Types.Normal, MoveCategories.Physical);

    expect(strike()).toBeGreaterThan(bare * 1.4);

    foe.setHealth(whole);

    // Answered, so the next one is ordinary again
    expect(strike()).toBeCloseTo(bare, 0);
  });

  it('slows whatever touches the slime, and only what touches it', () => {
    const { battle, teamA, teamB } = createBattle();
    const slug = createUnit(battle, teamA, [Types.Dragon]);
    const foe = createUnit(battle, teamB);

    pinRandom(battle, 1);
    slug.addAbility(Abilities.Gooey);
    slug.enter();
    foe.enter();

    dealDamage(foe, slug, Moves.Tackle, 20, Types.Normal, MoveCategories.Physical);

    expect(foe.stages[Stages.Speed]).toBe(-1);

    // Thrown from a distance, so nothing came off on it
    dealDamage(foe, slug, Moves.Swift, 20, Types.Normal, MoveCategories.Special);

    expect(foe.stages[Stages.Speed]).toBe(-1);
  });
});
