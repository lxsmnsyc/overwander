import { describe, expect, it } from 'vitest';
import {
  BACK_SEAT_ORDERS_SCALE,
  GLAIVE_GUARD_STAGES,
  MOUTHFUL_DURATION,
  MOUTHFUL_HEAL,
  SNOW_HOARD_CAP,
  SNOW_HOARD_INTERVAL,
} from '../../../../src/battle/abilities/signature/greavard-to-frigibax';
import { EffectType } from '../../../../src/battle/events';
import { unitTarget } from '../../../../src/battle/utils';
import { Stages, Stats } from '../../../../src/data/constants/stats';
import { Types } from '../../../../src/data/constants/types';
import Abilities from '../../../../src/data/ids/abilities';
import { Items } from '../../../../src/data/ids/items';
import { DamageFlags, MoveCategories, Moves } from '../../../../src/data/ids/moves';
import { Statuses, Weathers } from '../../../../src/data/ids/status';
import { createBattle, createUnit, pinRandom } from '../../harness';
import { act, dealDamage } from './helpers';

describe('Grave Digger', () => {
  it('takes a fallen teammate’s item into empty hands', () => {
    const { battle, teamA, teamB } = createBattle();
    const digger = createUnit(battle, teamA);
    const mate = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);

    digger.addAbility(Abilities.GraveDigger);
    mate.addItem(Items.Leftovers);
    foe.damage({ type: EffectType.None }, mate, mate.health, 0);

    expect(mate.alive).toBe(false);
    expect(digger.items[Items.Leftovers]).toBe(true);
    expect(mate.items[Items.Leftovers]).toBeUndefined();
  });

  it('leaves the item where it fell when its own hands are full', () => {
    const { battle, teamA, teamB } = createBattle();
    const digger = createUnit(battle, teamA);
    const mate = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);

    digger.addAbility(Abilities.GraveDigger);
    digger.addItem(Items.OranBerry);
    mate.addItem(Items.Leftovers);
    foe.damage({ type: EffectType.None }, mate, mate.health, 0);

    expect(digger.items[Items.Leftovers]).toBeUndefined();
    expect(mate.items[Items.Leftovers]).toBe(true);
  });
});

describe('Snow Hoard', () => {
  it('banks a stage of Attack every 4 seconds of snow, up to +3', () => {
    const { battle, teamA } = createBattle();
    const seal = createUnit(battle, teamA);

    seal.addAbility(Abilities.SnowHoard);
    battle.tick(SNOW_HOARD_INTERVAL);

    expect(seal.stages[Stages.Attack]).toBe(0);

    battle.weather.current = Weathers.Snow;
    battle.tick(SNOW_HOARD_INTERVAL - 1);

    expect(seal.stages[Stages.Attack]).toBe(0);

    battle.tick(1);

    expect(seal.stages[Stages.Attack]).toBe(1);

    for (let i = 0; i < SNOW_HOARD_CAP + 2; i++) {
      battle.tick(SNOW_HOARD_INTERVAL);
    }

    expect(seal.stages[Stages.Attack]).toBe(SNOW_HOARD_CAP);
  });
});

describe('Fillet Thrift', () => {
  it('pays half the HP a Substitute costs', () => {
    const { battle, teamA } = createBattle();
    const fish = createUnit(battle, teamA);
    const plain = createUnit(battle, teamA);
    const max = fish.checkStat(Stats.HP, 0);

    fish.addAbility(Abilities.FilletThrift);
    fish.triggerMoveEffect(Moves.Substitute, unitTarget(fish), 0);
    plain.triggerMoveEffect(Moves.Substitute, unitTarget(plain), 0);

    expect(fish.status[Statuses.Substituted]).toBeDefined();
    expect(max - plain.health).toBe(Math.floor(max / 4));
    expect(max - fish.health).toBe(Math.floor(max / 4) / 2);
  });

  it('pays the full price of a cost that is not a move of that kind', () => {
    const { battle, teamA } = createBattle();
    const fish = createUnit(battle, teamA);
    const max = fish.health;

    fish.addAbility(Abilities.FilletThrift);
    fish.damage(
      { type: EffectType.Move, move: Moves.Struggle, unit: fish },
      fish,
      40,
      DamageFlags.Indirect | DamageFlags.Cost,
    );

    expect(max - fish.health).toBe(40);
  });
});

describe('Mouthful', () => {
  it('swallows a teammate that drops below 1/3: healed and out of reach', () => {
    const { battle, teamA, teamB } = createBattle();
    const whale = createUnit(battle, teamA);
    const mate = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);
    const max = mate.checkStat(Stats.HP, 0);

    pinRandom(battle, 0.5);
    whale.addAbility(Abilities.Mouthful);
    foe.damage({ type: EffectType.None }, mate, max - 40, 0);

    expect(mate.health).toBe(40 + max * MOUTHFUL_HEAL);

    const inside = mate.health;

    expect(dealDamage(foe, mate, Moves.Tackle, 40, Types.Normal, MoveCategories.Physical)).toBe(0);
    expect(mate.health).toBe(inside);

    battle.tick(MOUTHFUL_DURATION);

    expect(
      dealDamage(foe, mate, Moves.Tackle, 40, Types.Normal, MoveCategories.Physical),
    ).toBeGreaterThan(0);
  });

  it('swallows each teammate once per fight', () => {
    const { battle, teamA, teamB } = createBattle();
    const whale = createUnit(battle, teamA);
    const mate = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);
    const max = mate.checkStat(Stats.HP, 0);

    whale.addAbility(Abilities.Mouthful);
    foe.damage({ type: EffectType.None }, mate, max - 40, 0);
    battle.tick(MOUTHFUL_DURATION);
    mate.setHealth(max);
    foe.damage({ type: EffectType.None }, mate, max - 40, 0);

    expect(mate.health).toBe(40);
  });

  it('never swallows itself', () => {
    const { battle, teamA, teamB } = createBattle();
    const whale = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);
    const max = whale.checkStat(Stats.HP, 0);

    whale.addAbility(Abilities.Mouthful);
    foe.damage({ type: EffectType.None }, whale, max - 40, 0);

    expect(whale.health).toBe(40);
  });
});

describe('Back Seat Orders', () => {
  it('lifts a teammate’s moves 1.2x while it is behind a Substitute or Protect', () => {
    const { battle, teamA, teamB } = createBattle();
    const fish = createUnit(battle, teamA);
    const mate = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);

    fish.addAbility(Abilities.BackSeatOrders);

    expect(mate.checkMovePower(Moves.Tackle, unitTarget(foe))).toBe(40);

    fish.addStatus(Statuses.Substituted, { type: EffectType.None });

    expect(mate.checkMovePower(Moves.Tackle, unitTarget(foe))).toBeCloseTo(
      40 * BACK_SEAT_ORDERS_SCALE,
    );
    // Its own moves are not ordered about
    expect(fish.checkMovePower(Moves.Tackle, unitTarget(foe))).toBe(40);

    fish.removeStatus(Statuses.Substituted, { type: EffectType.None });
    fish.addStatus(Statuses.Protected, { type: EffectType.None });

    expect(mate.checkMovePower(Moves.Tackle, unitTarget(foe))).toBeCloseTo(
      40 * BACK_SEAT_ORDERS_SCALE,
    );
  });
});

describe('Glaive Guard', () => {
  it('reads Defense and Special Defense +2 after Glaive Rush, until it next acts', () => {
    const { battle, teamA, teamB } = createBattle();
    const dragon = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);

    dragon.addAbility(Abilities.GlaiveGuard);
    dragon.triggerMoveEffect(Moves.GlaiveRush, unitTarget(foe), 0);

    expect(dragon.checkStage(Stages.Defense, 0)).toBe(GLAIVE_GUARD_STAGES);
    expect(dragon.checkStage(Stages.SpecialDefense, 0)).toBe(GLAIVE_GUARD_STAGES);
    expect(dragon.stages[Stages.Defense]).toBe(0);

    act(battle, dragon);

    expect(dragon.checkStage(Stages.Defense, 0)).toBe(0);
  });

  it('guards through a recharge', () => {
    const { battle, teamA } = createBattle();
    const dragon = createUnit(battle, teamA);

    dragon.addAbility(Abilities.GlaiveGuard);
    dragon.addStatus(Statuses.Recharging, {
      type: EffectType.Move,
      move: Moves.HyperBeam,
      unit: dragon,
    });

    expect(dragon.checkStage(Stages.SpecialDefense, 0)).toBe(GLAIVE_GUARD_STAGES);
  });

  it('does nothing after an ordinary move', () => {
    const { battle, teamA, teamB } = createBattle();
    const dragon = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);

    dragon.addAbility(Abilities.GlaiveGuard);
    dragon.triggerMoveEffect(Moves.Tackle, unitTarget(foe), 0);

    expect(dragon.checkStage(Stages.Defense, 0)).toBe(0);
  });
});
