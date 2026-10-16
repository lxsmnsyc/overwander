import { describe, expect, it } from 'vitest';
import {
  BALL_TOSS_THRESHOLD,
  BUBBLE_SHOCK_SCALE,
  BUBBLE_SHOCK_WINDOW,
  HEAT_TOLERANCE_FRACTION,
  LIGHTNING_DIVE_SCALE,
  STARE_DOWN_COOLDOWN,
  WINDSWEPT_SCALE,
} from '../../../../src/battle/abilities/signature/tadbulb-to-wiglett';
import { EffectType, MoveTargetType } from '../../../../src/battle/events';
import turns from '../../../../src/battle/turn';
import { Stages, Stats } from '../../../../src/data/constants/stats';
import { Types } from '../../../../src/data/constants/types';
import Abilities from '../../../../src/data/ids/abilities';
import { Items } from '../../../../src/data/ids/items';
import { MoveCategories, Moves } from '../../../../src/data/ids/moves';
import { Statuses, Terrains } from '../../../../src/data/ids/status';
import { TAILWIND_DURATION } from '../../../../src/battle/moves/tailwind';
import { createBattle, createUnit, pinRandom } from '../../harness';
import { act, dealDamage, rolled } from './helpers';

type Blow = readonly [Moves, number, Types, MoveCategories];

const TACKLE: Blow = [Moves.Tackle, 40, Types.Normal, MoveCategories.Physical];
const WATER_GUN: Blow = [Moves.WaterGun, 40, Types.Water, MoveCategories.Special];
const THUNDER_SHOCK: Blow = [Moves.ThunderShock, 40, Types.Electric, MoveCategories.Special];
const GUST: Blow = [Moves.Gust, 40, Types.Flying, MoveCategories.Special];
const CONFUSION: Blow = [Moves.Confusion, 40, Types.Psychic, MoveCategories.Special];

const NONE_TARGET = { type: MoveTargetType.None } as const;

function refill(unit: ReturnType<typeof createUnit>): void {
  unit.setHealth(unit.checkStat(Stats.HP, 0));
}

describe('Bubble Shock', () => {
  it('hits a target a Water move landed on 1.5x with Electric moves, for 4 seconds', () => {
    const { battle, teamA, teamB } = createBattle();
    const bulb = createUnit(battle, teamA);
    const splasher = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);

    pinRandom(battle, 1);
    bulb.addAbility(Abilities.BubbleShock);

    const dry = dealDamage(bulb, foe, ...THUNDER_SHOCK);

    refill(foe);
    dealDamage(splasher, foe, ...WATER_GUN);
    refill(foe);

    expect(dealDamage(bulb, foe, ...THUNDER_SHOCK)).toBeCloseTo(dry * BUBBLE_SHOCK_SCALE, 5);

    refill(foe);
    battle.tick(BUBBLE_SHOCK_WINDOW);

    expect(dealDamage(bulb, foe, ...THUNDER_SHOCK)).toBeCloseTo(dry, 5);
  });
});

describe('Lightning Dive', () => {
  it('hits 1.3x with Electric moves while Tailwind blows on its side', () => {
    const { battle, teamA, teamB } = createBattle();
    const bird = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);

    pinRandom(battle, 1);
    bird.addAbility(Abilities.LightningDive);

    const calm = dealDamage(bird, foe, ...THUNDER_SHOCK);
    const plain = dealDamage(bird, foe, ...TACKLE);

    refill(foe);
    bird.triggerMoveEffect(Moves.Tailwind, { type: MoveTargetType.Team, team: teamA }, 0);

    expect(dealDamage(bird, foe, ...THUNDER_SHOCK)).toBeCloseTo(calm * LIGHTNING_DIVE_SCALE, 5);
    expect(dealDamage(bird, foe, ...TACKLE)).toBeCloseTo(plain, 5);

    refill(foe);
    battle.tick(TAILWIND_DURATION);

    expect(dealDamage(bird, foe, ...THUNDER_SHOCK)).toBeCloseTo(calm, 5);
  });

  it('ignores a Tailwind on the other side', () => {
    const { battle, teamA, teamB } = createBattle();
    const bird = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);

    pinRandom(battle, 1);
    bird.addAbility(Abilities.LightningDive);

    const calm = dealDamage(bird, foe, ...THUNDER_SHOCK);

    refill(foe);
    foe.triggerMoveEffect(Moves.Tailwind, { type: MoveTargetType.Team, team: teamB }, 0);

    expect(dealDamage(bird, foe, ...THUNDER_SHOCK)).toBeCloseTo(calm, 5);
  });
});

describe('Windswept', () => {
  it('halves the next wind-up after a wind move lands on anybody', () => {
    const { battle, teamA, teamB } = createBattle();
    const weed = createUnit(battle, teamA);
    const mate = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);

    pinRandom(battle, 1);
    weed.addAbility(Abilities.Windswept);

    const plain = weed.checkMoveCastTime(Moves.Tackle, NONE_TARGET);

    expect(plain).toBeGreaterThan(0);

    dealDamage(foe, mate, ...TACKLE);

    expect(weed.checkMoveCastTime(Moves.Tackle, NONE_TARGET)).toBe(plain);

    dealDamage(foe, mate, ...GUST);

    expect(weed.checkMoveCastTime(Moves.Tackle, NONE_TARGET)).toBeCloseTo(
      plain * WINDSWEPT_SCALE,
      5,
    );

    // Spent on the cast it speeds up
    act(battle, weed);
    weed.casting = undefined;

    expect(weed.checkMoveCastTime(Moves.Tackle, NONE_TARGET)).toBe(plain);
  });
});

describe('Mycelium Mat', () => {
  it('cures a teammate Grassy Terrain heals of its major status', () => {
    const { battle, teamA, teamB } = createBattle();
    const mush = createUnit(battle, teamA);
    const mate = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);

    pinRandom(battle, 1);
    mush.addAbility(Abilities.MyceliumMat);
    mush.enter();
    mate.enter();
    foe.enter();
    battle.setTerrain(Terrains.Grassy);
    mate.addStatus(Statuses.Burned, {
      type: EffectType.Ability,
      ability: Abilities.FlameBody,
      unit: foe,
    });
    mate.setHealth(mate.health / 2);

    const hurt = mate.health;

    act(battle, mate);

    expect(mate.health).toBeGreaterThan(hurt);
    expect(mate.status[Statuses.Burned]).toBeUndefined();
  });

  it('cures nothing without the terrain, nor on the holder itself', () => {
    const { battle, teamA, teamB } = createBattle();
    const mush = createUnit(battle, teamA);
    const mate = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);
    const cause = { type: EffectType.Ability, ability: Abilities.FlameBody, unit: foe } as const;

    pinRandom(battle, 1);
    mush.addAbility(Abilities.MyceliumMat);
    mush.enter();
    mate.enter();
    foe.enter();
    mate.addStatus(Statuses.Burned, cause);
    mate.setHealth(mate.health / 2);
    act(battle, mate);

    expect(mate.status[Statuses.Burned]).toBeDefined();

    battle.setTerrain(Terrains.Grassy);
    mush.addStatus(Statuses.Burned, cause);
    mush.setHealth(mush.health / 2);
    act(battle, mush);

    expect(mush.status[Statuses.Burned]).toBeDefined();
  });

  it('cures nothing once the holder has fallen', () => {
    const { battle, teamA, teamB } = createBattle();
    const mush = createUnit(battle, teamA);
    const mate = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);

    pinRandom(battle, 1);
    mush.addAbility(Abilities.MyceliumMat);
    mush.enter();
    mate.enter();
    foe.enter();
    battle.setTerrain(Terrains.Grassy);
    mush.alive = false;
    mate.addStatus(Statuses.Burned, {
      type: EffectType.Ability,
      ability: Abilities.FlameBody,
      unit: foe,
    });
    mate.setHealth(mate.health / 2);
    act(battle, mate);

    expect(mate.status[Statuses.Burned]).toBeDefined();
  });
});

describe('Heat Tolerance', () => {
  it('turns the burn into a heal of 1/8 its HP each time it acts', () => {
    const { battle, teamA, teamB } = createBattle();
    const pepper = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);
    const max = pepper.checkStat(Stats.HP, 0);

    pinRandom(battle, 1);
    pepper.addAbility(Abilities.HeatTolerance);
    pepper.addStatus(Statuses.Burned, {
      type: EffectType.Ability,
      ability: Abilities.FlameBody,
      unit: foe,
    });
    pepper.setHealth(max / 2);
    battle.tick(turns(2));

    expect(pepper.health).toBe(max / 2);

    act(battle, pepper);

    expect(pepper.health).toBeCloseTo(max / 2 + max * HEAT_TOLERANCE_FRACTION, 5);
    expect(pepper.status[Statuses.Burned]).toBeDefined();
  });

  it('keeps its physical blows whole while burned', () => {
    const { battle, teamA, teamB } = createBattle();
    const pepper = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);

    pinRandom(battle, 1);
    pepper.addAbility(Abilities.HeatTolerance);

    const whole = dealDamage(pepper, foe, ...TACKLE);

    refill(foe);
    pepper.addStatus(Statuses.Burned, {
      type: EffectType.Ability,
      ability: Abilities.FlameBody,
      unit: foe,
    });

    expect(dealDamage(pepper, foe, ...TACKLE)).toBeCloseTo(whole, 5);
  });
});

describe('Ball Toss', () => {
  it('hands its item to an empty-handed teammate that drops under 1/3, once a fight', () => {
    const { battle, teamA, teamB } = createBattle();
    const beetle = createUnit(battle, teamA);
    const mate = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);
    const cause = { type: EffectType.Ability, ability: Abilities.RoughSkin, unit: foe } as const;
    const max = mate.checkStat(Stats.HP, 0);

    pinRandom(battle, 0);
    beetle.addAbility(Abilities.BallToss);
    beetle.addItem(Items.Leftovers);

    // Still above the line: nothing thrown
    foe.damage(cause, mate, max * 0.5, 0);
    expect(mate.items[Items.Leftovers]).toBeUndefined();

    foe.damage(cause, mate, max * (0.5 - BALL_TOSS_THRESHOLD) + 1, 0);
    expect(mate.items[Items.Leftovers]).toBe(true);
    expect(beetle.items[Items.Leftovers]).toBeUndefined();

    // Spent: a second drop, hands empty again, gets nothing
    mate.removeItem(Items.Leftovers, cause);
    beetle.addItem(Items.Leftovers);
    refill(mate);
    foe.damage(cause, mate, max * 0.9, 0);
    expect(mate.items[Items.Leftovers]).toBeUndefined();
    expect(beetle.items[Items.Leftovers]).toBe(true);
  });

  it('throws nothing to a teammate already holding something', () => {
    const { battle, teamA, teamB } = createBattle();
    const beetle = createUnit(battle, teamA);
    const mate = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);
    const cause = { type: EffectType.Ability, ability: Abilities.RoughSkin, unit: foe } as const;

    pinRandom(battle, 0);
    beetle.addAbility(Abilities.BallToss);
    beetle.addItem(Items.Leftovers);
    mate.addItem(Items.SitrusBerry);
    foe.damage(cause, mate, mate.checkStat(Stats.HP, 0) * 0.9, 0);

    expect(beetle.items[Items.Leftovers]).toBe(true);
  });
});

describe('Stare Down', () => {
  it('casts Taunt at whoever its Psychic move lands on, once every 10 seconds per target', () => {
    const { battle, teamA, teamB } = createBattle();
    const fly = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);

    pinRandom(battle, 0);
    fly.addAbility(Abilities.StareDown);
    fly.enter();
    foe.enter();

    dealDamage(fly, foe, ...TACKLE);
    battle.tick(turns(1));
    expect(foe.status[Statuses.Taunted]).toBeUndefined();

    dealDamage(fly, foe, ...CONFUSION);
    battle.tick(turns(1));
    expect(foe.status[Statuses.Taunted]).toBeDefined();

    const none = { type: EffectType.None } as const;

    foe.removeStatus(Statuses.Taunted, none);
    refill(foe);
    dealDamage(fly, foe, ...CONFUSION);
    battle.tick(turns(1));
    expect(foe.status[Statuses.Taunted]).toBeUndefined();

    battle.tick(STARE_DOWN_COOLDOWN);
    foe.removeStatus(Statuses.Taunted, none);
    refill(foe);
    dealDamage(fly, foe, ...CONFUSION);
    battle.tick(turns(1));
    expect(foe.status[Statuses.Taunted]).toBeDefined();
  });
});

describe('Tinker', () => {
  it('remakes the first item each teammate uses up, once per teammate', () => {
    const { battle, teamA } = createBattle();
    const smith = createUnit(battle, teamA);
    const mate = createUnit(battle, teamA);
    const used = { type: EffectType.Item, item: Items.SitrusBerry, unit: mate } as const;

    smith.addAbility(Abilities.Tinker);
    mate.addItem(Items.SitrusBerry);
    mate.removeItem(Items.SitrusBerry, used, true);

    expect(mate.items[Items.SitrusBerry]).toBe(true);

    mate.removeItem(Items.SitrusBerry, used, true);

    expect(mate.items[Items.SitrusBerry]).toBeUndefined();
  });

  it('remakes nothing knocked away, nor its own', () => {
    const { battle, teamA, teamB } = createBattle();
    const smith = createUnit(battle, teamA);
    const mate = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);

    smith.addAbility(Abilities.Tinker);
    mate.addItem(Items.SitrusBerry);
    mate.removeItem(Items.SitrusBerry, {
      type: EffectType.Ability,
      ability: Abilities.Pickpocket,
      unit: foe,
    });

    expect(mate.items[Items.SitrusBerry]).toBeUndefined();

    smith.addItem(Items.SitrusBerry);
    smith.removeItem(Items.SitrusBerry, {
      type: EffectType.Item,
      item: Items.SitrusBerry,
      unit: smith,
    });

    expect(smith.items[Items.SitrusBerry]).toBeUndefined();
  });
});

describe('Sand Duck', () => {
  it('makes Ground moves aimed at it miss, raising its Speed each time', () => {
    const { battle, teamA, teamB } = createBattle();
    const eel = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);

    eel.addAbility(Abilities.SandDuck);

    expect(rolled(battle, foe, eel, Moves.Tackle)).toBe(true);
    expect(eel.stages[Stages.Speed]).toBe(0);

    expect(rolled(battle, foe, eel, Moves.MudSlap)).toBe(false);
    expect(rolled(battle, foe, eel, Moves.MudSlap)).toBe(false);
    expect(eel.stages[Stages.Speed]).toBe(2);
  });
});
