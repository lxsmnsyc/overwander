// Morelull through Passimian, with Receiver.

import { describe, expect, it } from 'vitest';
import { AttackPriority } from '../../../../src/core/event-emitter';
import { BattleEvents, MoveTargetType } from '../../../../src/battle/events';
import { unitTarget } from '../../../../src/battle/utils';
import {
  LEI_HEAL_FRACTION,
  RUSH_PASS_SCALE,
  SAGES_CALL_SCALE,
} from '../../../../src/battle/abilities/signature/morelull-to-passimian';
import { Stats, StatsKind } from '../../../../src/data/constants/stats';
import { Types } from '../../../../src/data/constants/types';
import Abilities from '../../../../src/data/ids/abilities';
import { MoveCategories, Moves } from '../../../../src/data/ids/moves';
import { createBattle, createUnit, pinRandom } from '../../harness';
import { NONE_CAUSE, act, dealDamage } from './helpers';

describe('Receiver', () => {
  it('takes a fainted teammate’s ability in its place, once', () => {
    const { battle, teamA, teamB } = createBattle();
    const troop = createUnit(battle, teamA);
    const mate = createUnit(battle, teamA);
    const other = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);

    troop.addAbility(Abilities.Receiver);
    mate.addAbility(Abilities.Intimidate);
    other.addAbility(Abilities.Levitate);

    foe.damage(NONE_CAUSE, mate, mate.checkStat(Stats.HP, 0), 0);

    expect(mate.alive).toBe(false);
    expect(troop.hasAbility(Abilities.Intimidate)).toBe(true);
    expect(troop.hasAbility(Abilities.Receiver)).toBe(false);

    // With no Receiver left, the next one to fall hands nothing over
    foe.damage(NONE_CAUSE, other, other.checkStat(Stats.HP, 0), 0);

    expect(troop.hasAbility(Abilities.Levitate)).toBe(false);
  });

  it('passes over an ability only one shape can use', () => {
    const { battle, teamA, teamB } = createBattle();
    const troop = createUnit(battle, teamA);
    const mate = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);

    troop.addAbility(Abilities.Receiver);
    mate.addAbility(Abilities.ZenMode);
    foe.damage(NONE_CAUSE, mate, mate.checkStat(Stats.HP, 0), 0);

    expect(troop.hasAbility(Abilities.ZenMode)).toBe(false);
    expect(troop.hasAbility(Abilities.Receiver)).toBe(true);
  });
});

describe('Drowsy Glow', () => {
  it('casts Yawn on what it hits when the roll comes up', () => {
    const { battle, teamA, teamB } = createBattle();
    const lull = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);
    const yawns: unknown[] = [];

    battle.on(BattleEvents.UnitTriggerMove, AttackPriority.Post, (event) => {
      if (event.move === Moves.Yawn) {
        yawns.push(event.target);
      }
    });

    lull.addAbility(Abilities.DrowsyGlow);

    // Above the chance, nothing
    pinRandom(battle, 0.5);
    dealDamage(lull, foe, Moves.Tackle, 40, Types.Normal, MoveCategories.Physical);

    expect(yawns).toHaveLength(0);

    pinRandom(battle, 0);
    dealDamage(lull, foe, Moves.Tackle, 40, Types.Normal, MoveCategories.Physical);

    expect(yawns).toEqual([unitTarget(foe)]);
  });
});

describe('Lei Gift', () => {
  it('gives its worst hurt teammate a lei that heals each time they act', () => {
    const { battle, teamA } = createBattle();
    const posy = createUnit(battle, teamA);
    const hurt = createUnit(battle, teamA);
    const fine = createUnit(battle, teamA);
    const max = hurt.checkStat(Stats.HP, 0);

    hurt.setHealth(max / 4);
    fine.setHealth(max / 2);
    posy.addAbility(Abilities.LeiGift);
    posy.enter();

    act(battle, hurt);

    expect(hurt.health).toBeCloseTo(max / 4 + max * LEI_HEAL_FRACTION, 5);

    const before = fine.health;

    act(battle, fine);

    expect(fine.health).toBe(before);
  });
});

describe('Sage’s Call and Rush Pass', () => {
  it('hurries the strongest teammate’s next cast, and only that one', () => {
    const { battle, teamA } = createBattle();
    const sage = createUnit(battle, teamA);
    const weak = createUnit(battle, teamA);
    const strong = createUnit(battle, teamA);
    const none = { type: MoveTargetType.None } as const;

    strong.setStat(StatsKind.Base, Stats.Attack, 150);
    sage.addAbility(Abilities.SagesCall);

    const plain = strong.checkMoveCastTime(Moves.Tackle, none);

    act(battle, sage);

    expect(strong.checkMoveCastTime(Moves.Tackle, none)).toBeCloseTo(plain * SAGES_CALL_SCALE, 5);
    expect(weak.checkMoveCastTime(Moves.Tackle, none)).toBe(plain);

    // Spent on the cast it hurried
    act(battle, strong);

    expect(strong.checkMoveCastTime(Moves.Tackle, none)).toBe(plain);
  });

  it('hits harder with a cast the sage hurried', () => {
    /** One real Tackle from a Rush Pass holder, called on first or not */
    function blow(hurried: boolean): number {
      const { battle, teamA, teamB } = createBattle();
      const sage = createUnit(battle, teamA);
      const troop = createUnit(battle, teamA);
      const foe = createUnit(battle, teamB);
      const at = unitTarget(foe);

      pinRandom(battle, 1);
      troop.setStat(StatsKind.Base, Stats.Attack, 150);
      troop.addMove(Moves.Tackle);
      troop.addAbility(Abilities.RushPass);
      sage.addAbility(Abilities.SagesCall);
      if (hurried) {
        act(battle, sage);
      }
      troop.cast(Moves.Tackle, at);
      for (let elapsed = 0; elapsed < 5000; elapsed += 1000 / 60) {
        battle.tick(1000 / 60);
      }
      return foe.checkStat(Stats.HP, 0) - foe.health;
    }

    const plain = blow(false);

    expect(plain).toBeGreaterThan(0);
    expect(blow(true) / plain).toBeCloseTo(RUSH_PASS_SCALE, 1);
  });
});
