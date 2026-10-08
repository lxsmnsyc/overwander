// Grookey, Scorbunny and Sobble: the Cue frame.

import { describe, expect, it } from 'vitest';
import { CUE_COOLDOWN } from '../../../../src/battle/abilities/signature/__create';
import { MoveTargetType } from '../../../../src/battle/events';
import { unitTarget } from '../../../../src/battle/utils';
import { Stats, StatsKind } from '../../../../src/data/constants/stats';
import { Types } from '../../../../src/data/constants/types';
import Abilities from '../../../../src/data/ids/abilities';
import { MoveCategories, Moves } from '../../../../src/data/ids/moves';
import { Statuses } from '../../../../src/data/ids/status';
import { createBattle, createUnit, pinRandom } from '../../harness';
import { dealDamage } from './helpers';

type Blow = readonly [Moves, number, Types, MoveCategories];

const TACKLE: Blow = [Moves.Tackle, 40, Types.Normal, MoveCategories.Physical];
const VINE_WHIP: Blow = [Moves.VineWhip, 40, Types.Grass, MoveCategories.Physical];
const EMBER: Blow = [Moves.Ember, 40, Types.Fire, MoveCategories.Special];
const WATER_GUN: Blow = [Moves.WaterGun, 40, Types.Water, MoveCategories.Special];

/** Long enough for any cast move to have resolved */
const FLIGHT = 1000;

describe('Drum Cue', () => {
  it('lends a hand to the teammate hitting hardest when a Grass move lands', () => {
    const { battle, teamA, teamB } = createBattle();
    const monkey = createUnit(battle, teamA);
    const soft = createUnit(battle, teamA);
    const hard = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);

    pinRandom(battle, 1);
    hard.setStat(StatsKind.Base, Stats.SpecialAttack, 200);
    monkey.addAbility(Abilities.DrumCue);

    // Only its own type cues the drum
    dealDamage(monkey, foe, ...TACKLE);
    battle.tick(FLIGHT);

    expect(hard.status[Statuses.Helped]).toBeUndefined();

    dealDamage(monkey, foe, ...VINE_WHIP);
    battle.tick(FLIGHT);

    expect(hard.status[Statuses.Helped]).toBeDefined();
    expect(soft.status[Statuses.Helped]).toBeUndefined();
    expect(monkey.status[Statuses.Helped]).toBeUndefined();
  });

  it('plays at most once every 8 seconds', () => {
    const { battle, teamA, teamB } = createBattle();
    const monkey = createUnit(battle, teamA);
    const mate = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);

    pinRandom(battle, 1);
    monkey.addAbility(Abilities.DrumCue);

    dealDamage(monkey, foe, ...VINE_WHIP);
    battle.tick(FLIGHT);

    expect(mate.status[Statuses.Helped]).toBeDefined();

    // The hand is spent on the teammate's next move resolving
    const helped = mate.status[Statuses.Helped];

    if (helped != null) {
      mate.removeStatus(Statuses.Helped, helped);
    }

    dealDamage(monkey, foe, ...VINE_WHIP);
    battle.tick(FLIGHT);

    expect(mate.status[Statuses.Helped]).toBeUndefined();

    battle.tick(CUE_COOLDOWN);
    dealDamage(monkey, foe, ...VINE_WHIP);
    battle.tick(FLIGHT);

    expect(mate.status[Statuses.Helped]).toBeDefined();
  });

  it('is not spent with no teammate to play for', () => {
    const { battle, teamA, teamB } = createBattle();
    const monkey = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);

    pinRandom(battle, 1);
    monkey.addAbility(Abilities.DrumCue);

    dealDamage(monkey, foe, ...VINE_WHIP);
    battle.tick(FLIGHT);

    const mate = createUnit(battle, teamA);

    dealDamage(monkey, foe, ...VINE_WHIP);
    battle.tick(FLIGHT);

    expect(mate.status[Statuses.Helped]).toBeDefined();
  });
});

describe('Kick Cue', () => {
  it("finishes a teammate's wind-up when a Fire move lands", () => {
    const { battle, teamA, teamB } = createBattle();
    const rabbit = createUnit(battle, teamA);
    const mate = createUnit(battle, teamA);
    const idle = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);

    pinRandom(battle, 1);
    rabbit.addAbility(Abilities.KickCue);
    mate.addMove(Moves.Tackle);
    mate.cast(Moves.Tackle, unitTarget(foe));

    expect(mate.casting).toBeDefined();

    const health = foe.health;

    dealDamage(rabbit, foe, ...EMBER);

    const afterEmber = foe.health;

    expect(afterEmber).toBeLessThan(health);

    battle.tick(FLIGHT);

    // The Tackle went off well before its own 1.7 second wind-up
    expect(mate.casting).toBeUndefined();
    expect(mate.moves[Moves.Tackle]?.cooldown).toBeDefined();
    expect(foe.health).toBeLessThan(afterEmber);
    expect(idle.casting).toBeUndefined();
  });

  it('keeps its cue while no teammate is winding up', () => {
    const { battle, teamA, teamB } = createBattle();
    const rabbit = createUnit(battle, teamA);
    const mate = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);

    pinRandom(battle, 1);
    rabbit.addAbility(Abilities.KickCue);
    mate.addMove(Moves.Tackle);

    dealDamage(rabbit, foe, ...EMBER);
    battle.tick(FLIGHT);

    mate.cast(Moves.Tackle, unitTarget(foe));
    dealDamage(rabbit, foe, ...EMBER);
    battle.tick(FLIGHT);

    expect(mate.casting).toBeUndefined();
    expect(mate.moves[Moves.Tackle]?.cooldown).toBeDefined();
  });
});

describe('Scope Cue', () => {
  it('puts the target in the spotlight when a Water move lands', () => {
    const { battle, teamA, teamB } = createBattle();
    const lizard = createUnit(battle, teamA);
    const mate = createUnit(battle, teamA);
    const struck = createUnit(battle, teamB);
    const other = createUnit(battle, teamB);

    pinRandom(battle, 1);
    lizard.addAbility(Abilities.ScopeCue);

    dealDamage(lizard, struck, ...WATER_GUN);
    battle.tick(FLIGHT);

    expect(struck.status[Statuses.Centered]).toBeDefined();
    expect(other.status[Statuses.Centered]).toBeUndefined();

    // A teammate aiming at the other enemy is drawn onto the lit one
    mate.addMove(Moves.Tackle);
    mate.cast(Moves.Tackle, unitTarget(other));

    const aimed = mate.casting?.target;

    expect(aimed?.type === MoveTargetType.Unit ? aimed.unit : undefined).toBe(struck);
  });

  it('lights nothing for a move of another type, or more than once every 8 seconds', () => {
    const { battle, teamA, teamB } = createBattle();
    const lizard = createUnit(battle, teamA);
    const first = createUnit(battle, teamB);
    const second = createUnit(battle, teamB);

    pinRandom(battle, 1);
    lizard.addAbility(Abilities.ScopeCue);

    dealDamage(lizard, first, ...TACKLE);
    battle.tick(FLIGHT);

    expect(first.status[Statuses.Centered]).toBeUndefined();

    dealDamage(lizard, first, ...WATER_GUN);
    battle.tick(FLIGHT);
    dealDamage(lizard, second, ...WATER_GUN);
    battle.tick(FLIGHT);

    expect(second.status[Statuses.Centered]).toBeUndefined();

    battle.tick(CUE_COOLDOWN);
    dealDamage(lizard, second, ...WATER_GUN);
    battle.tick(FLIGHT);

    expect(second.status[Statuses.Centered]).toBeDefined();
  });
});
