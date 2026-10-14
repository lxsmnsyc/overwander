import { describe, expect, it } from 'vitest';
import {
  ANCIENT_COCOON_THRESHOLD,
  MOLTEN_BULWARK_FRACTION,
  MOON_HOWL_SCALE,
  SHRIEK_SPEED_SCALE,
  STEAM_SURGE_SCALE,
} from '../../../../src/battle/abilities/signature/gen-9/ancient-paradox';
import { EffectType, MoveTargetType } from '../../../../src/battle/events';
import { MOVE_DELAY } from '../../../../src/battle/mechanics/move/timing';
import { unitTarget } from '../../../../src/battle/utils';
import { Stages, Stats } from '../../../../src/data/constants/stats';
import { Types } from '../../../../src/data/constants/types';
import Abilities from '../../../../src/data/ids/abilities';
import { MoveCategories, Moves } from '../../../../src/data/ids/moves';
import { Terrains, Weathers } from '../../../../src/data/ids/status';
import { createBattle, createUnit, pinRandom } from '../../harness';
import { dealDamage } from './helpers';

type Blow = readonly [Moves, number, Types, MoveCategories];

const TACKLE: Blow = [Moves.Tackle, 40, Types.Normal, MoveCategories.Physical];
const CLOSE_COMBAT: Blow = [Moves.CloseCombat, 120, Types.Fighting, MoveCategories.Physical];
const EARTHQUAKE: Blow = [Moves.Earthquake, 100, Types.Ground, MoveCategories.Physical];
const THUNDERBOLT: Blow = [Moves.Thunderbolt, 90, Types.Electric, MoveCategories.Special];
const WATER_GUN: Blow = [Moves.WaterGun, 40, Types.Water, MoveCategories.Special];

const NONE_TARGET = { type: MoveTargetType.None } as const;

describe('Headlong Guard', () => {
  it('undoes its own drops on the next contact move it lands, not on the move that cost them', () => {
    const { battle, teamA, teamB } = createBattle();
    const tusk = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);

    pinRandom(battle, 1);
    tusk.addAbility(Abilities.HeadlongGuard);
    dealDamage(tusk, foe, ...CLOSE_COMBAT);

    expect(tusk.stages[Stages.Defense]).toBe(-1);
    expect(tusk.stages[Stages.SpecialDefense]).toBe(-1);

    // Not contact: the drops stay
    dealDamage(tusk, foe, ...EARTHQUAKE);
    expect(tusk.stages[Stages.Defense]).toBe(-1);

    dealDamage(tusk, foe, ...TACKLE);
    expect(tusk.stages[Stages.Defense]).toBe(0);
    expect(tusk.stages[Stages.SpecialDefense]).toBe(0);
  });

  it('leaves a drop an enemy put on it alone', () => {
    const { battle, teamA, teamB } = createBattle();
    const tusk = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);

    pinRandom(battle, 1);
    tusk.addAbility(Abilities.HeadlongGuard);
    tusk.addStage(Stages.Defense, -1, { type: EffectType.Move, move: Moves.Leer, unit: foe });
    dealDamage(tusk, foe, ...TACKLE);

    expect(tusk.stages[Stages.Defense]).toBe(-1);
  });
});

describe('Shriek Speed', () => {
  it('winds its sound moves up 30% faster, and nothing else', () => {
    const { battle, teamA, teamB } = createBattle();
    const tail = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);
    const target = unitTarget(foe);
    const voice = tail.checkMoveCastTime(Moves.HyperVoice, target);
    const tackle = tail.checkMoveCastTime(Moves.Tackle, target);

    tail.addAbility(Abilities.ShriekSpeed);

    expect(tail.checkMoveCastTime(Moves.HyperVoice, target)).toBeCloseTo(
      voice * SHRIEK_SPEED_SCALE,
    );
    expect(tail.checkMoveCastTime(Moves.Tackle, target)).toBeCloseTo(tackle);
  });
});

describe('Eerie Flutter', () => {
  it("turns a move aimed at it onto the attacker's teammate on a good roll", () => {
    const { battle, teamA, teamB } = createBattle();
    const mane = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);
    const mate = createUnit(battle, teamB);
    const whole = mane.health;
    const before = mate.health;

    mane.addAbility(Abilities.EerieFlutter);
    pinRandom(battle, 0);
    foe.triggerMoveTarget(Moves.Tackle, unitTarget(mane), 0);

    expect(mane.health).toBe(whole);
    expect(mate.health).toBeLessThan(before);
  });

  it('makes the move miss when the attacker stands alone', () => {
    const { battle, teamA, teamB } = createBattle();
    const mane = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);
    const whole = mane.health;
    const own = foe.health;

    mane.addAbility(Abilities.EerieFlutter);
    pinRandom(battle, 0);
    foe.triggerMoveTarget(Moves.Tackle, unitTarget(mane), 0);

    expect(mane.health).toBe(whole);
    expect(foe.health).toBe(own);
  });

  it('lets the move land on a roll past the chance', () => {
    const { battle, teamA, teamB } = createBattle();
    const mane = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);
    const mate = createUnit(battle, teamB);
    const whole = mane.health;
    const before = mate.health;

    mane.addAbility(Abilities.EerieFlutter);
    pinRandom(battle, 0.5);
    foe.triggerMoveTarget(Moves.Tackle, unitTarget(mane), 0);

    expect(mane.health).toBeLessThan(whole);
    expect(mate.health).toBe(before);
  });
});

describe('Ancient Cocoon', () => {
  it('casts Quiver Dance the first time it drops below 1/3, once a fight', () => {
    const { battle, teamA, teamB } = createBattle();
    const wing = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);
    const cause = { type: EffectType.Ability, ability: Abilities.RoughSkin, unit: foe } as const;
    const max = wing.checkStat(Stats.HP, 0);

    pinRandom(battle, 1);
    wing.addAbility(Abilities.AncientCocoon);

    foe.damage(cause, wing, max * 0.5, 0);
    battle.tick(MOVE_DELAY);
    expect(wing.stages[Stages.SpecialAttack]).toBe(0);

    foe.damage(cause, wing, max * (0.5 - ANCIENT_COCOON_THRESHOLD) + 1, 0);
    battle.tick(MOVE_DELAY);
    expect(wing.stages[Stages.SpecialAttack]).toBe(1);
    expect(wing.stages[Stages.SpecialDefense]).toBe(1);
    expect(wing.stages[Stages.Speed]).toBe(1);

    // Spent: a second drop dances no more
    wing.setHealth(max);
    foe.damage(cause, wing, max * 0.8, 0);
    battle.tick(MOVE_DELAY);
    expect(wing.stages[Stages.SpecialAttack]).toBe(1);
  });
});

describe('Earth Current', () => {
  it('lands its Electric moves on Ground types at neutral', () => {
    const { battle, teamA, teamB } = createBattle();
    const shocks = createUnit(battle, teamA);
    const ground = createUnit(battle, teamB, [Types.Ground]);
    const plain = createUnit(battle, teamB);
    const target = unitTarget(ground);

    pinRandom(battle, 1);
    expect(shocks.checkMoveImmunity(Moves.Thunderbolt, target, Types.Electric)).toBe(true);
    expect(dealDamage(shocks, ground, ...THUNDERBOLT)).toBe(0);

    shocks.addAbility(Abilities.EarthCurrent);

    expect(shocks.checkMoveImmunity(Moves.Thunderbolt, target, Types.Electric)).toBe(false);

    const neutral = dealDamage(shocks, plain, ...THUNDERBOLT);

    expect(neutral).toBeGreaterThan(0);
    expect(dealDamage(shocks, ground, ...THUNDERBOLT)).toBeCloseTo(neutral);
  });
});

describe('Moon Howl', () => {
  it("slows every enemy's next wind-up by 30% as it takes the field", () => {
    const { battle, teamA, teamB } = createBattle();
    const moon = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);
    const other = createUnit(battle, teamB);
    const target = unitTarget(moon);

    foe.addMove(Moves.Tackle);
    moon.addAbility(Abilities.MoonHowl);

    const plain = foe.checkMoveCastTime(Moves.Tackle, target);

    moon.enter();

    expect(foe.checkMoveCastTime(Moves.Tackle, target)).toBeCloseTo(plain * MOON_HOWL_SCALE);
    expect(other.checkMoveCastTime(Moves.Tackle, target)).toBeCloseTo(plain * MOON_HOWL_SCALE);

    // Only the next move pays
    foe.cast(Moves.Tackle, target);
    expect(foe.checkMoveCastTime(Moves.Tackle, target)).toBe(plain);
  });
});

describe('Steam Surge', () => {
  it('in sun, winds Water moves up 20% faster and keeps their full power', () => {
    const { battle, teamA, teamB } = createBattle();
    const wake = createUnit(battle, teamA);
    const plain = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);
    const target = unitTarget(foe);
    const gun = wake.checkMoveCastTime(Moves.WaterGun, target);

    pinRandom(battle, 1);
    wake.addAbility(Abilities.SteamSurge);
    expect(wake.checkMoveCastTime(Moves.WaterGun, target)).toBeCloseTo(gun);

    const dry = dealDamage(wake, foe, ...WATER_GUN);

    foe.setHealth(foe.checkStat(Stats.HP, 0));
    wake.triggerMove(Moves.SunnyDay, NONE_TARGET, 0);
    battle.tick(MOVE_DELAY);
    expect(battle.weather.current).toBe(Weathers.Sunny);

    expect(wake.checkMoveCastTime(Moves.WaterGun, target)).toBeCloseTo(gun * STEAM_SURGE_SCALE);
    expect(wake.checkMoveCastTime(Moves.Tackle, target)).toBeCloseTo(
      plain.checkMoveCastTime(Moves.Tackle, target),
    );

    const sunny = dealDamage(wake, foe, ...WATER_GUN);
    const weakened = dealDamage(plain, foe, ...WATER_GUN);

    expect(sunny).toBeCloseTo(dry);
    expect(weakened).toBeCloseTo(dry / 2, 0);
  });
});

describe('Molten Bulwark', () => {
  it('heals 1/8 of its HP each time its guard blocks a move', () => {
    const { battle, teamA, teamB } = createBattle();
    const fire = createUnit(battle, teamA);
    const striker = createUnit(battle, teamB);
    const max = fire.checkStat(Stats.HP, 0);

    pinRandom(battle, 1);
    fire.enter();
    striker.enter();
    fire.addAbility(Abilities.MoltenBulwark);
    fire.setHealth(Math.floor(max / 2));

    const hurt = fire.health;

    fire.triggerMoveEffect(Moves.Protect, NONE_TARGET, 0);
    striker.triggerMoveTarget(Moves.Tackle, unitTarget(fire), 0);

    expect(fire.health - hurt).toBeCloseTo(max * MOLTEN_BULWARK_FRACTION, 0);
  });

  it('heals nothing from a move that fails behind the guard for another reason', () => {
    const { battle, teamA, teamB } = createBattle();
    const fire = createUnit(battle, teamA, [Types.Ghost]);
    const striker = createUnit(battle, teamB);
    const max = fire.checkStat(Stats.HP, 0);

    pinRandom(battle, 1);
    fire.enter();
    striker.enter();
    fire.addAbility(Abilities.MoltenBulwark);
    fire.setHealth(Math.floor(max / 2));

    const hurt = fire.health;

    // A Ghost was never going to be touched by a Tackle
    fire.triggerMoveEffect(Moves.Protect, NONE_TARGET, 0);
    striker.triggerMoveTarget(Moves.Tackle, unitTarget(fire), 0);

    expect(fire.health).toBe(hurt);
  });
});

describe('Storm Cloud', () => {
  it('lays Electric Terrain from an Electric move on a good roll', () => {
    const { battle, teamA, teamB } = createBattle();
    const bolt = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);

    bolt.addAbility(Abilities.StormCloud);
    pinRandom(battle, 0.5);
    dealDamage(bolt, foe, ...THUNDERBOLT);
    battle.tick(MOVE_DELAY);
    expect(bolt.checkTerrain()).toBe(Terrains.None);

    pinRandom(battle, 0);
    dealDamage(bolt, foe, ...TACKLE);
    battle.tick(MOVE_DELAY);
    expect(bolt.checkTerrain()).toBe(Terrains.None);

    dealDamage(bolt, foe, ...THUNDERBOLT);
    battle.tick(MOVE_DELAY);
    expect(bolt.checkTerrain()).toBe(Terrains.Electric);
  });
});
