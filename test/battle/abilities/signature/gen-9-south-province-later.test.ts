import { describe, expect, it } from 'vitest';
import {
  BRINE_REBOUND_COOLDOWN,
  FRESH_BATCH_INTERVAL,
  KINDLING_SCALE,
} from '../../../../src/battle/abilities/signature/gen-9/fidough-to-charcadet';
import { EffectType } from '../../../../src/battle/events';
import { unitTarget } from '../../../../src/battle/utils';
import { Stats } from '../../../../src/data/constants/stats';
import { Types } from '../../../../src/data/constants/types';
import Abilities from '../../../../src/data/ids/abilities';
import { Items } from '../../../../src/data/ids/items';
import { MoveCategories, Moves } from '../../../../src/data/ids/moves';
import { Statuses } from '../../../../src/data/ids/status';
import turns from '../../../../src/battle/turn';
import { createBattle, createUnit, pinRandom } from '../../harness';
import { NONE_CAUSE, act, dealDamage } from './helpers';

type Blow = readonly [Moves, number, Types, MoveCategories];

const TACKLE: Blow = [Moves.Tackle, 40, Types.Normal, MoveCategories.Physical];
const EMBER: Blow = [Moves.Ember, 40, Types.Fire, MoveCategories.Special];
const WATER_GUN: Blow = [Moves.WaterGun, 40, Types.Water, MoveCategories.Special];

describe('Fresh Batch', () => {
  it('hands a Sitrus Berry to the empty-handed teammate lowest on HP every 20 seconds', () => {
    const { battle, teamA } = createBattle();
    const dog = createUnit(battle, teamA);
    const worn = createUnit(battle, teamA);
    const hale = createUnit(battle, teamA);
    const full = createUnit(battle, teamA);

    // Above half, so the berry is held rather than eaten on arrival
    worn.setHealth(Math.floor(worn.health * 0.7));
    full.setHealth(Math.floor(full.health * 0.6));
    full.addItem(Items.Leftovers);
    dog.setHealth(Math.floor(dog.health * 0.55));
    dog.addAbility(Abilities.FreshBatch);

    battle.tick(FRESH_BATCH_INTERVAL - 100);
    expect(worn.items[Items.SitrusBerry]).toBeUndefined();

    battle.tick(100);
    expect(worn.items[Items.SitrusBerry]).toBe(true);
    expect(hale.items[Items.SitrusBerry]).toBeUndefined();
    expect(full.items[Items.SitrusBerry]).toBeUndefined();
    expect(dog.items[Items.SitrusBerry]).toBeUndefined();

    // The worn one's hands are full now, so the next batch goes on
    battle.tick(FRESH_BATCH_INTERVAL);
    expect(hale.items[Items.SitrusBerry]).toBe(true);
  });

  it('bakes nothing while every teammate has full hands', () => {
    const { battle, teamA } = createBattle();
    const dog = createUnit(battle, teamA);
    const mate = createUnit(battle, teamA);

    mate.addItem(Items.Leftovers);
    dog.addAbility(Abilities.FreshBatch);
    battle.tick(FRESH_BATCH_INTERVAL);

    expect(mate.items[Items.SitrusBerry]).toBeUndefined();
    expect(dog.items[Items.SitrusBerry]).toBeUndefined();
  });
});

describe('Anoint', () => {
  it("cures a teammate's major status when it heals that teammate", () => {
    const { battle, teamA } = createBattle();
    const olive = createUnit(battle, teamA);
    const mate = createUnit(battle, teamA);
    const cause = { type: EffectType.Ability, ability: Abilities.Anoint, unit: olive } as const;

    olive.addAbility(Abilities.Anoint);
    mate.addStatus(Statuses.Poisoned, NONE_CAUSE);
    mate.setHealth(mate.health - 40);
    expect(mate.status[Statuses.Poisoned]).toBeDefined();

    const before = mate.health;

    olive.heal(cause, mate, 20, 0);

    expect(mate.health).toBeGreaterThan(before);
    expect(mate.status[Statuses.Poisoned]).toBeUndefined();
  });

  it('leaves its own status, and a heal from somebody else, alone', () => {
    const { battle, teamA } = createBattle();
    const olive = createUnit(battle, teamA);
    const mate = createUnit(battle, teamA);
    const cause = { type: EffectType.None } as const;

    olive.addAbility(Abilities.Anoint);
    olive.addStatus(Statuses.Burned, NONE_CAUSE);
    mate.addStatus(Statuses.Burned, NONE_CAUSE);
    olive.setHealth(olive.health - 40);
    mate.setHealth(mate.health - 40);

    olive.heal(cause, olive, 20, 0);
    mate.heal(cause, mate, 20, 0);

    expect(olive.status[Statuses.Burned]).toBeDefined();
    expect(mate.status[Statuses.Burned]).toBeDefined();
  });
});

describe('Brine Rebound', () => {
  it('casts Salt Cure at whoever lands a Water move on it, once every 10 seconds', () => {
    const { battle, teamA, teamB } = createBattle();
    const salt = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);

    pinRandom(battle, 0.5);
    salt.addAbility(Abilities.BrineRebound);

    // Not for a blow of any other type
    dealDamage(foe, salt, ...TACKLE);
    battle.tick(turns(2));
    expect(foe.health).toBe(foe.checkStat(Stats.HP, 0));

    dealDamage(foe, salt, ...WATER_GUN);
    battle.tick(turns(2));

    const salted = foe.health;

    expect(salted).toBeLessThan(foe.checkStat(Stats.HP, 0));

    // Salt Cure's residual is paid as the salted one acts
    act(battle, foe);
    expect(foe.health).toBeLessThan(salted);

    // Still resting: a second splash gets nothing back
    const rested = foe.health;

    dealDamage(foe, salt, ...WATER_GUN);
    battle.tick(turns(2));
    expect(foe.health).toBe(rested);

    battle.tick(BRINE_REBOUND_COOLDOWN);
    dealDamage(foe, salt, ...WATER_GUN);
    battle.tick(turns(2));
    expect(foe.health).toBeLessThan(rested);
  });
});

describe('Kindling', () => {
  it('makes the next move wind up 25% faster after a Fire move lands', () => {
    const { battle, teamA, teamB } = createBattle();
    const coal = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);
    const at = unitTarget(foe);

    pinRandom(battle, 0.5);
    coal.addAbility(Abilities.Kindling);

    const plain = coal.checkMoveCastTime(Moves.Tackle, at);

    dealDamage(coal, foe, ...TACKLE);
    expect(coal.checkMoveCastTime(Moves.Tackle, at)).toBeCloseTo(plain, 5);

    dealDamage(coal, foe, ...EMBER);
    expect(coal.checkMoveCastTime(Moves.Tackle, at)).toBeCloseTo(plain * KINDLING_SCALE, 5);

    // Spent on the next cast, and it does not stack
    dealDamage(coal, foe, ...EMBER);
    expect(coal.checkMoveCastTime(Moves.Tackle, at)).toBeCloseTo(plain * KINDLING_SCALE, 5);
    act(battle, coal);
    expect(coal.checkMoveCastTime(Moves.Tackle, at)).toBeCloseTo(plain, 5);
  });
});
