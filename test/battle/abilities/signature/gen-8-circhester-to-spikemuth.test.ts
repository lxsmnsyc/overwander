// Snom through Stonjourner.

import { describe, expect, it } from 'vitest';
import type Battle from '../../../../src/battle/core';
import { type MoveTarget, MoveTargetType } from '../../../../src/battle/events';
import type Unit from '../../../../src/battle/unit';
import { unitTarget } from '../../../../src/battle/utils';
import {
  RANK_AND_FILE_HITS,
  RANK_AND_FILE_SCALE,
  SOLSTICE_DURATION,
  SOLSTICE_INTERVAL,
  SOLSTICE_SCALE,
} from '../../../../src/battle/abilities/signature/snom-to-stonjourner';
import { Stages, Stats } from '../../../../src/data/constants/stats';
import { Types } from '../../../../src/data/constants/types';
import Abilities from '../../../../src/data/ids/abilities';
import { Items } from '../../../../src/data/ids/items';
import { MoveCategories, Moves } from '../../../../src/data/ids/moves';
import { Statuses, Weathers } from '../../../../src/data/ids/status';
import { createBattle, createUnit, pinRandom } from '../../harness';
import { NONE_CAUSE, dealDamage } from './helpers';

type Blow = readonly [Moves, number, Types, MoveCategories];

const TACKLE: Blow = [Moves.Tackle, 40, Types.Normal, MoveCategories.Physical];
const SWIFT: Blow = [Moves.Swift, 60, Types.Normal, MoveCategories.Special];
const EMBER: Blow = [Moves.Ember, 40, Types.Fire, MoveCategories.Special];
const CRUNCH: Blow = [Moves.Crunch, 80, Types.Dark, MoveCategories.Physical];
const METAL_CLAW: Blow = [Moves.MetalClaw, 50, Types.Steel, MoveCategories.Physical];
const DRAGON_CLAW: Blow = [Moves.DragonClaw, 80, Types.Dragon, MoveCategories.Physical];

/** Walk the battle clock forward in frame-sized ticks */
function advance(battle: Battle, duration: number): void {
  const frame = 1000 / 60;

  for (let elapsed = 0; elapsed < duration; elapsed += frame) {
    battle.tick(frame);
  }
}

/** Let a move cast by an ability fly and land */
function land(battle: Battle, source: Unit, move: Moves, target: MoveTarget): void {
  advance(battle, source.checkMoveDelay(move, target) + 100);
}

function heal(unit: Unit): void {
  unit.setHealth(unit.checkStat(Stats.HP, 0));
}

describe('Mirror Scales', () => {
  it('sends a burn and a stat drop back onto whoever threw them', () => {
    const { battle, teamA, teamB } = createBattle();
    const larva = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);

    larva.addAbility(Abilities.MirrorScales);
    // Every added effect rolls in
    pinRandom(battle, 0);

    dealDamage(foe, larva, ...EMBER);

    expect(larva.status[Statuses.Burned]).toBeUndefined();
    expect(foe.status[Statuses.Burned]).toBeDefined();

    dealDamage(foe, larva, ...CRUNCH);

    expect(larva.stages[Stages.Defense]).toBe(0);
    expect(foe.stages[Stages.Defense]).toBe(-1);
  });

  it('leaves a self-boost on the thrower and does nothing without the ability', () => {
    const { battle, teamA, teamB } = createBattle();
    const larva = createUnit(battle, teamA);
    const plain = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);

    larva.addAbility(Abilities.MirrorScales);
    pinRandom(battle, 0);

    dealDamage(foe, larva, ...METAL_CLAW);

    expect(foe.stages[Stages.Attack]).toBe(1);
    expect(larva.stages[Stages.Attack]).toBe(0);

    dealDamage(foe, plain, ...CRUNCH);

    expect(plain.stages[Stages.Defense]).toBe(-1);
    expect(foe.stages[Stages.Defense]).toBe(0);
  });
});

describe('Chipped Ice', () => {
  it('casts Hail when a physical hit lands and the sky is clear', () => {
    const { battle, teamA, teamB } = createBattle();
    const penguin = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);
    const none = { type: MoveTargetType.None } as const;

    penguin.addAbility(Abilities.ChippedIce);
    pinRandom(battle, 1);

    dealDamage(foe, penguin, ...SWIFT);
    land(battle, penguin, Moves.Hail, none);

    expect(battle.weather.current).toBe(Weathers.None);

    dealDamage(foe, penguin, ...TACKLE);
    land(battle, penguin, Moves.Hail, none);

    expect(battle.weather.current).toBe(Weathers.Hail);
  });

  it('leaves a sky that is already up alone', () => {
    const { battle, teamA, teamB } = createBattle();
    const penguin = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);

    penguin.addAbility(Abilities.ChippedIce);
    pinRandom(battle, 1);
    battle.setWeather(Weathers.Rain);

    dealDamage(foe, penguin, ...TACKLE);
    land(battle, penguin, Moves.Hail, { type: MoveTargetType.None });

    expect(battle.weather.current).toBe(Weathers.Rain);
  });
});

describe('Rank and File', () => {
  it('takes the first hits at half, then as hard as anybody', () => {
    const { battle, teamA, teamB } = createBattle();
    const troop = createUnit(battle, teamA);
    const plain = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);

    troop.addAbility(Abilities.RankAndFile);
    pinRandom(battle, 1);

    const base = dealDamage(foe, plain, ...TACKLE);

    for (let hit = 0; hit < RANK_AND_FILE_HITS; hit++) {
      heal(troop);
      expect(dealDamage(foe, troop, ...TACKLE) / base).toBeCloseTo(RANK_AND_FILE_SCALE, 1);
    }

    heal(troop);
    expect(dealDamage(foe, troop, ...TACKLE)).toBe(base);
  });
});

describe('Attendant', () => {
  it('casts Heal Pulse on a teammate struck super effectively, then rests', () => {
    const { battle, teamA, teamB } = createBattle();
    const attendant = createUnit(battle, teamA);
    const mate = createUnit(battle, teamA, [Types.Grass]);
    const foe = createUnit(battle, teamB);
    const at = unitTarget(mate);

    attendant.addAbility(Abilities.Attendant);
    pinRandom(battle, 1);

    dealDamage(foe, mate, ...TACKLE);
    const neutral = mate.health;

    land(battle, attendant, Moves.HealPulse, at);
    expect(mate.health).toBe(neutral);

    dealDamage(foe, mate, ...EMBER);
    const struck = mate.health;

    land(battle, attendant, Moves.HealPulse, at);
    expect(mate.health).toBeGreaterThan(struck);

    // Still resting
    dealDamage(foe, mate, ...EMBER);
    const again = mate.health;

    land(battle, attendant, Moves.HealPulse, at);
    expect(mate.health).toBe(again);
  });
});

describe('Hangry Spark', () => {
  it('casts Nuzzle at an enemy that eats a Berry', () => {
    const { battle, teamA, teamB } = createBattle();
    const hamster = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);
    const at = unitTarget(foe);

    hamster.addAbility(Abilities.HangrySpark);
    pinRandom(battle, 1);
    foe.addItem(Items.SitrusBerry);

    foe.damage(NONE_CAUSE, foe, Math.ceil(foe.health * 0.6), 0);

    expect(foe.hasItem(Items.SitrusBerry)).toBe(false);

    const fed = foe.health;

    land(battle, hamster, Moves.Nuzzle, at);

    expect(foe.health).toBeLessThan(fed);
    expect(foe.status[Statuses.Paralyzed]).toBeDefined();
  });

  it('lets its own side eat in peace', () => {
    const { battle, teamA, teamB } = createBattle();
    const hamster = createUnit(battle, teamA);
    const mate = createUnit(battle, teamA);
    createUnit(battle, teamB);

    hamster.addAbility(Abilities.HangrySpark);
    pinRandom(battle, 1);
    mate.addItem(Items.SitrusBerry);

    mate.damage(NONE_CAUSE, mate, Math.ceil(mate.health * 0.6), 0);

    const fed = mate.health;

    land(battle, hamster, Moves.Nuzzle, unitTarget(mate));

    expect(mate.health).toBe(fed);
    expect(mate.status[Statuses.Paralyzed]).toBeUndefined();
  });
});

describe('Overhang', () => {
  it('takes an enemy spread move alone, sparing its party', () => {
    const { battle, teamA, teamB } = createBattle();
    const tower = createUnit(battle, teamA);
    const mate = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);
    const none = { type: MoveTargetType.None } as const;

    tower.addAbility(Abilities.Overhang);
    pinRandom(battle, 1);

    foe.triggerMove(Moves.Surf, none, 0);
    land(battle, foe, Moves.Surf, none);

    expect(tower.health).toBeLessThan(tower.checkStat(Stats.HP, 0));
    expect(mate.health).toBe(mate.checkStat(Stats.HP, 0));
  });

  it('lets a spread move through when nobody holds it', () => {
    const { battle, teamA, teamB } = createBattle();
    createUnit(battle, teamA);
    const mate = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);
    const none = { type: MoveTargetType.None } as const;

    pinRandom(battle, 1);

    foe.triggerMove(Moves.Surf, none, 0);
    land(battle, foe, Moves.Surf, none);

    expect(mate.health).toBeLessThan(mate.checkStat(Stats.HP, 0));
  });
});

describe('Dreepy Launch', () => {
  it('casts Dragon Darts at a second enemy after a Dragon move lands, then waits', () => {
    const { battle, teamA, teamB } = createBattle();
    const dragon = createUnit(battle, teamA);
    const first = createUnit(battle, teamB);
    const second = createUnit(battle, teamB);
    const at = unitTarget(second);

    dragon.addAbility(Abilities.DreepyLaunch);
    pinRandom(battle, 1);

    dealDamage(dragon, first, ...TACKLE);
    land(battle, dragon, Moves.DragonDarts, at);

    expect(second.health).toBe(second.checkStat(Stats.HP, 0));

    dealDamage(dragon, first, ...DRAGON_CLAW);
    land(battle, dragon, Moves.DragonDarts, at);

    expect(second.health).toBeLessThan(second.checkStat(Stats.HP, 0));

    // Every dart of the first launch home before counting again
    advance(battle, 2000);
    heal(second);
    heal(first);
    dealDamage(dragon, first, ...DRAGON_CLAW);
    land(battle, dragon, Moves.DragonDarts, at);

    expect(second.health).toBe(second.checkStat(Stats.HP, 0));
  });
});

describe('Solstice', () => {
  it('lifts its whole team for a window every interval', () => {
    const { battle, teamA, teamB } = createBattle();
    const circle = createUnit(battle, teamA);
    const mate = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);

    circle.addAbility(Abilities.Solstice);
    pinRandom(battle, 1);

    const base = dealDamage(mate, foe, ...TACKLE);

    heal(foe);
    battle.tick(SOLSTICE_INTERVAL);

    expect(dealDamage(mate, foe, ...TACKLE) / base).toBeCloseTo(SOLSTICE_SCALE, 1);

    heal(foe);
    expect(dealDamage(foe, mate, ...TACKLE)).toBe(base);

    heal(foe);
    battle.tick(SOLSTICE_DURATION);

    expect(dealDamage(mate, foe, ...TACKLE)).toBe(base);
  });
});
