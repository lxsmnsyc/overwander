import { describe, expect, it } from 'vitest';
import {
  PETAL_SCATTER_FRACTION,
  WAKE_COOLDOWN,
} from '../../../../src/battle/abilities/signature/gen-9/sprigatito-to-quaxly';
import { EffectType } from '../../../../src/battle/events';
import { Stages } from '../../../../src/data/constants/stats';
import { Types } from '../../../../src/data/constants/types';
import Abilities from '../../../../src/data/ids/abilities';
import { MoveAttackFlags, MoveCategories, Moves } from '../../../../src/data/ids/moves';
import { Statuses } from '../../../../src/data/ids/status';
import { createBattle, createUnit, pinRandom } from '../../harness';
import { dealDamage } from './helpers';

type Blow = readonly [Moves, number, Types, MoveCategories];

const TACKLE: Blow = [Moves.Tackle, 40, Types.Normal, MoveCategories.Physical];
const VINE_WHIP: Blow = [Moves.VineWhip, 40, Types.Grass, MoveCategories.Physical];
const EMBER: Blow = [Moves.Ember, 40, Types.Fire, MoveCategories.Special];
const WATER_GUN: Blow = [Moves.WaterGun, 40, Types.Water, MoveCategories.Special];

describe('Petal Scatter', () => {
  it('splashes 1/4 of a Grass critical hit onto every other enemy', () => {
    const { battle, teamA, teamB } = createBattle();
    const cat = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);
    const other = createUnit(battle, teamB);
    const before = other.health;

    // A pinned roll of 0 lands every critical hit
    pinRandom(battle, 0);
    cat.addAbility(Abilities.PetalScatter);

    const struck = foe.health;

    cat.attack(foe, ...VINE_WHIP, MoveAttackFlags.Critical);

    const dealt = struck - foe.health;

    expect(dealt).toBeGreaterThan(0);
    expect(before - other.health).toBeCloseTo(dealt * PETAL_SCATTER_FRACTION, 1);
  });

  it('scatters nothing from a hit that is not critical, or not Grass', () => {
    const { battle, teamA, teamB } = createBattle();
    const cat = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);
    const other = createUnit(battle, teamB);
    const before = other.health;

    cat.addAbility(Abilities.PetalScatter);
    pinRandom(battle, 0);
    cat.attack(foe, ...TACKLE, MoveAttackFlags.Critical);
    pinRandom(battle, 0.99);
    cat.attack(foe, ...VINE_WHIP, MoveAttackFlags.Critical);

    expect(other.health).toBe(before);
  });
});

describe('Spreading Flame', () => {
  it('burns the other enemy lowest on HP when a Fire move burns', () => {
    const { battle, teamA, teamB } = createBattle();
    const croc = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);
    const hale = createUnit(battle, teamB);
    const worn = createUnit(battle, teamB);

    worn.setHealth(Math.floor(worn.health / 3));
    pinRandom(battle, 0);
    croc.addAbility(Abilities.SpreadingFlame);
    dealDamage(croc, foe, ...EMBER);

    expect(foe.status[Statuses.Burned]).toBeDefined();
    expect(worn.status[Statuses.Burned]).toBeDefined();
    expect(hale.status[Statuses.Burned]).toBeUndefined();
  });

  it('spreads only a burn a Fire move put on', () => {
    const { battle, teamA, teamB } = createBattle();
    const croc = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);
    const other = createUnit(battle, teamB);

    croc.addAbility(Abilities.SpreadingFlame);
    foe.addStatus(Statuses.Burned, {
      type: EffectType.Ability,
      ability: Abilities.FlameBody,
      unit: croc,
    });

    expect(other.status[Statuses.Burned]).toBeUndefined();
  });
});

describe('Wake', () => {
  it('slows the target and every other enemy when a Water move lands', () => {
    const { battle, teamA, teamB } = createBattle();
    const duck = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);
    const other = createUnit(battle, teamB);

    pinRandom(battle, 1);
    duck.addAbility(Abilities.Wake);
    dealDamage(duck, foe, ...TACKLE);

    expect(foe.stages[Stages.Speed]).toBe(0);

    dealDamage(duck, foe, ...WATER_GUN);

    expect(foe.stages[Stages.Speed]).toBe(-1);
    expect(other.stages[Stages.Speed]).toBe(-1);
  });

  it('leaves a wake at most once every 8 seconds', () => {
    const { battle, teamA, teamB } = createBattle();
    const duck = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);

    pinRandom(battle, 1);
    duck.addAbility(Abilities.Wake);
    dealDamage(duck, foe, ...WATER_GUN);
    dealDamage(duck, foe, ...WATER_GUN);

    expect(foe.stages[Stages.Speed]).toBe(-1);

    battle.tick(WAKE_COOLDOWN);
    dealDamage(duck, foe, ...WATER_GUN);

    expect(foe.stages[Stages.Speed]).toBe(-2);
  });
});
