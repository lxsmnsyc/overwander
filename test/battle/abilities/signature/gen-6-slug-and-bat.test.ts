// Goomy and Noibat.

import { describe, expect, it } from 'vitest';
import { Stages, Stats, StatsKind } from '../../../../src/data/constants/stats';
import { Types } from '../../../../src/data/constants/types';
import Abilities from '../../../../src/data/ids/abilities';
import { DamageFlags, MoveCategories, Moves } from '../../../../src/data/ids/moves';
import {
  OUTPACE_SCALE,
  SEEPAGE_DELAY,
  SEEPAGE_SHARE,
} from '../../../../src/battle/abilities/signature/goomy-and-noibat';
import { createBattle, createUnit, pinRandom } from '../../harness';
import { NONE_CAUSE, dealDamage } from './helpers';

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

  it('hits harder for being the faster of the two', () => {
    const { battle, teamA, teamB } = createBattle();
    const bat = createUnit(battle, teamA, [Types.Flying, Types.Dragon]);
    const foe = createUnit(battle, teamB);

    pinRandom(battle, 1);
    bat.setStat(StatsKind.Base, Stats.Speed, 150);
    foe.setStat(StatsKind.Base, Stats.Speed, 40);
    bat.enter();
    foe.enter();

    const whole = foe.checkStat(Stats.HP, 0);
    const bare = dealDamage(bat, foe, Moves.Pound, 40, Types.Normal, MoveCategories.Physical);

    foe.setHealth(whole);
    bat.addAbility(Abilities.Outpace);

    expect(
      dealDamage(bat, foe, Moves.Pound, 40, Types.Normal, MoveCategories.Physical),
    ).toBeCloseTo(bare * OUTPACE_SCALE, 0);
  });

  it('gains nothing against something quicker than it', () => {
    const { battle, teamA, teamB } = createBattle();
    const bat = createUnit(battle, teamA, [Types.Flying, Types.Dragon]);
    const foe = createUnit(battle, teamB);

    pinRandom(battle, 1);
    bat.setStat(StatsKind.Base, Stats.Speed, 40);
    foe.setStat(StatsKind.Base, Stats.Speed, 150);
    bat.enter();
    foe.enter();

    const whole = foe.checkStat(Stats.HP, 0);
    const bare = dealDamage(bat, foe, Moves.Pound, 40, Types.Normal, MoveCategories.Physical);

    foe.setHealth(whole);
    bat.addAbility(Abilities.Outpace);

    expect(
      dealDamage(bat, foe, Moves.Pound, 40, Types.Normal, MoveCategories.Physical),
    ).toBeCloseTo(bare, 0);
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
