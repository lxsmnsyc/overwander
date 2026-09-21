// Litleo and Spritzee, the two Kalos lines that waited on their art.

import { describe, expect, it } from 'vitest';
import { Stages } from '../../../../src/data/constants/stats';
import { Types } from '../../../../src/data/constants/types';
import Abilities from '../../../../src/data/ids/abilities';
import { Items } from '../../../../src/data/ids/items';
import { EffectType } from '../../../../src/battle/events';
import turns from '../../../../src/battle/turn';
import { createBattle, createUnit, pinRandom } from '../../harness';
import { NONE_CAUSE } from './helpers';

describe('Litleo and Spritzee', () => {
  it('announces itself as it arrives, and Noble Roar does the rest', () => {
    const { battle, teamA, teamB } = createBattle();
    const lion = createUnit(battle, teamA, [Types.Fire, Types.Normal]);
    const foe = createUnit(battle, teamB);

    pinRandom(battle, 1);
    lion.addAbility(Abilities.PrideCall);
    foe.enter();
    lion.enter();
    battle.tick(turns(1));

    expect(foe.stages[Stages.Attack]).toBe(-1);
    expect(foe.stages[Stages.SpecialAttack]).toBe(-1);
  });

  it('takes a step of Speed off the other side when it spends its own scent', () => {
    const { battle, teamA, teamB } = createBattle();
    const perfume = createUnit(battle, teamA, [Types.Fairy]);
    const mate = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);

    pinRandom(battle, 1);
    perfume.addAbility(Abilities.CalmingScent);
    perfume.addItem(Items.SitrusBerry);
    perfume.enter();
    mate.enter();
    foe.enter();

    perfume.removeItem(Items.SitrusBerry, {
      type: EffectType.Item,
      item: Items.SitrusBerry,
      unit: perfume,
    });

    expect(foe.stages[Stages.Speed]).toBe(-1);

    // The mirror only reaches across: its own side is untouched
    expect(perfume.stages[Stages.Speed]).toBe(0);
    expect(mate.stages[Stages.Speed]).toBe(0);
  });

  it('takes nothing off when the scent is knocked out of its hands', () => {
    const { battle, teamA, teamB } = createBattle();
    const perfume = createUnit(battle, teamA, [Types.Fairy]);
    const foe = createUnit(battle, teamB);

    pinRandom(battle, 1);
    perfume.addAbility(Abilities.CalmingScent);
    perfume.addItem(Items.SitrusBerry);
    perfume.enter();
    foe.enter();

    perfume.removeItem(Items.SitrusBerry, NONE_CAUSE);

    expect(foe.stages[Stages.Speed]).toBe(0);
  });
});
