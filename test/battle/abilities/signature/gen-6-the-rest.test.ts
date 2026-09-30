// Pancham, Swirlix, Dedenne and Carbink.

import { describe, expect, it } from 'vitest';
import { Stages, Stats } from '../../../../src/data/constants/stats';
import { Types } from '../../../../src/data/constants/types';
import Abilities from '../../../../src/data/ids/abilities';
import { Items } from '../../../../src/data/ids/items';
import { Moves } from '../../../../src/data/ids/moves';
import {
  CRYSTAL_GROWTH_INTERVAL,
  CRYSTAL_GROWTH_LIMIT,
} from '../../../../src/battle/abilities/signature/pancham-to-carbink';
import { EffectType, MoveTargetType } from '../../../../src/battle/events';
import { createBattle, createUnit, pinRandom } from '../../harness';
import { NONE_CAUSE } from './helpers';

describe("Kalos's last four", () => {
  it('takes every mend on the other side as a slight', () => {
    const { battle, teamA, teamB } = createBattle();
    const panda = createUnit(battle, teamA, [Types.Fighting, Types.Dark]);
    const mate = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);

    pinRandom(battle, 1);
    panda.addAbility(Abilities.Begrudge);
    panda.enter();
    mate.enter();
    foe.enter();

    const whole = foe.checkStat(Stats.HP, 0);

    foe.setHealth(whole / 2);
    foe.heal(NONE_CAUSE, foe, whole / 4, 0);

    expect(panda.stages[Stages.Attack]).toBe(1);

    // Its own side being mended is nobody's business
    mate.setHealth(whole / 2);
    mate.heal(NONE_CAUSE, mate, whole / 4, 0);

    expect(panda.stages[Stages.Attack]).toBe(1);
  });

  it('hands the sugar round when it eats its own', () => {
    const { battle, teamA, teamB } = createBattle();
    const shop = createUnit(battle, teamA, [Types.Fairy]);
    const mate = createUnit(battle, teamA);

    pinRandom(battle, 1);
    shop.addAbility(Abilities.SugarRush);
    shop.addItem(Items.SitrusBerry);
    shop.enter();
    mate.enter();
    createUnit(battle, teamB).enter();

    shop.removeItem(Items.SitrusBerry, {
      type: EffectType.Item,
      item: Items.SitrusBerry,
      unit: shop,
    });

    expect(shop.stages[Stages.Speed]).toBe(1);
    expect(mate.stages[Stages.Speed]).toBe(1);
  });

  it('hands nothing round when the item is knocked off instead', () => {
    const { battle, teamA, teamB } = createBattle();
    const shop = createUnit(battle, teamA, [Types.Fairy]);
    const mate = createUnit(battle, teamA);

    pinRandom(battle, 1);
    shop.addAbility(Abilities.SugarRush);
    shop.addItem(Items.SitrusBerry);
    shop.enter();
    mate.enter();
    createUnit(battle, teamB).enter();

    shop.removeItem(Items.SitrusBerry, NONE_CAUSE);

    expect(shop.stages[Stages.Speed]).toBe(0);
    expect(mate.stages[Stages.Speed]).toBe(0);
  });

  it('casts a step ahead of everything else', () => {
    const { battle, teamA, teamB } = createBattle();
    const mouse = createUnit(battle, teamA, [Types.Electric, Types.Fairy]);
    const foe = createUnit(battle, teamB);

    pinRandom(battle, 1);
    mouse.enter();
    foe.enter();

    const target = { type: MoveTargetType.Unit, unit: foe } as const;
    const bare = mouse.checkMovePriority(Moves.Thunderbolt, target);

    mouse.addAbility(Abilities.QuickWhiskers);

    expect(mouse.checkMovePriority(Moves.Thunderbolt, target)).toBe(bare + 1);
  });

  it('thickens a layer at a time, and stops at its ceiling', () => {
    const { battle, teamA, teamB } = createBattle();
    const jewel = createUnit(battle, teamA, [Types.Rock, Types.Fairy]);

    pinRandom(battle, 1);
    jewel.addAbility(Abilities.CrystalGrowth);
    jewel.enter();
    createUnit(battle, teamB).enter();

    expect(jewel.stages[Stages.Defense]).toBe(0);

    battle.tick(CRYSTAL_GROWTH_INTERVAL);

    expect(jewel.stages[Stages.Defense]).toBe(1);
    expect(jewel.stages[Stages.SpecialDefense]).toBe(1);

    battle.tick(CRYSTAL_GROWTH_INTERVAL * (CRYSTAL_GROWTH_LIMIT + 3));

    expect(jewel.stages[Stages.Defense]).toBe(CRYSTAL_GROWTH_LIMIT);
    expect(jewel.stages[Stages.SpecialDefense]).toBe(CRYSTAL_GROWTH_LIMIT);
  });
});
