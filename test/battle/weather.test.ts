import { describe, expect, it } from 'vitest';
import { MoveTargetType } from '../../src/battle/events';
import type Unit from '../../src/battle/unit';
import { Stats } from '../../src/data/constants/stats';
import { Types } from '../../src/data/constants/types';
import Abilities from '../../src/data/ids/abilities';
import { Items } from '../../src/data/ids/items';
import { MoveCategories, Moves } from '../../src/data/ids/moves';
import { Statuses, Weathers } from '../../src/data/ids/status';
import { createBattle, createUnit, pinRandom } from './harness';

function unitTarget(unit: Unit): { readonly type: MoveTargetType.Unit; readonly unit: Unit } {
  return { type: MoveTargetType.Unit, unit } as const;
}

/**
 * What one plain Fire blow takes off the target, under whatever sky
 * the attacker is standing under
 */
function burn(weather: Weathers, type: Types = Types.Fire): number {
  const { battle, teamA, teamB } = createBattle();

  pinRandom(battle, 1);

  const attacker = createUnit(battle, teamA);
  const target = createUnit(battle, teamB, [Types.Normal]);

  battle.setWeather(weather);
  attacker.attack(target, Moves.Ember, 40, type, MoveCategories.Special, 0);

  return target.checkStat(Stats.HP, 0) - target.health;
}

describe('weather damage', () => {
  it('lifts what the sky is made of and puts down what it is not', () => {
    const plain = burn(Weathers.None);

    expect(burn(Weathers.Sunny)).toBeCloseTo(plain * 1.5, 5);
    expect(burn(Weathers.Rain)).toBeCloseTo(plain * 0.5, 5);

    const water = burn(Weathers.None, Types.Water);

    expect(burn(Weathers.Rain, Types.Water)).toBeCloseTo(water * 1.5, 5);
    expect(burn(Weathers.Sunny, Types.Water)).toBeCloseTo(water * 0.5, 5);
  });

  it('says nothing about the types it has no opinion on', () => {
    expect(burn(Weathers.Sunny, Types.Normal)).toBeCloseTo(burn(Weathers.None, Types.Normal), 5);
    expect(burn(Weathers.Sandstorm)).toBeCloseTo(burn(Weathers.None), 5);
  });

  it('leaves an umbrella holder under its own sky', () => {
    const { battle, teamA, teamB } = createBattle();

    pinRandom(battle, 1);

    const attacker = createUnit(battle, teamA);
    const target = createUnit(battle, teamB, [Types.Normal]);

    attacker.addItem(Items.UtilityUmbrella);
    battle.setWeather(Weathers.Sunny);
    attacker.attack(target, Moves.Ember, 40, Types.Fire, MoveCategories.Special, 0);

    const dealt = target.checkStat(Stats.HP, 0) - target.health;

    expect(dealt).toBeCloseTo(burn(Weathers.None), 5);
  });

  it('refuses the type a primal sky will not have at all', () => {
    const { battle, teamA, teamB } = createBattle();

    pinRandom(battle, 1);

    const attacker = createUnit(battle, teamA);
    const target = createUnit(battle, teamB, [Types.Normal]);

    battle.setWeather(Weathers.HeavyRain);
    attacker.triggerMoveTarget(Moves.Ember, unitTarget(target), 0);

    expect(target.health).toBe(target.checkStat(Stats.HP, 0));

    // And an umbrella is no answer to it: the rain is the field's, not
    // the caster's
    attacker.addItem(Items.UtilityUmbrella);
    attacker.triggerMoveTarget(Moves.Ember, unitTarget(target), 0);

    expect(target.health).toBe(target.checkStat(Stats.HP, 0));
  });

  it('still lets a status move through that much rain', () => {
    const { battle, teamA, teamB } = createBattle();

    const attacker = createUnit(battle, teamA);
    const target = createUnit(battle, teamB, [Types.Normal]);

    battle.setWeather(Weathers.HeavyRain);
    attacker.triggerMoveTarget(Moves.ThunderWave, unitTarget(target), 0);

    expect(target.status[Statuses.Paralyzed]).toBeDefined();
  });

  it('covers a Rock type in a sandstorm', () => {
    const { battle, teamA, teamB } = createBattle();

    const rock = createUnit(battle, teamA, [Types.Rock]);
    const soft = createUnit(battle, teamB, [Types.Normal]);

    const rockDefense = rock.checkStat(Stats.SpecialDefense, 0);
    const softDefense = soft.checkStat(Stats.SpecialDefense, 0);

    battle.setWeather(Weathers.Sandstorm);

    expect(rock.checkStat(Stats.SpecialDefense, 0)).toBeCloseTo(rockDefense * 1.5, 5);
    expect(soft.checkStat(Stats.SpecialDefense, 0)).toBe(softDefense);

    // And only in a sandstorm, and only Special Defense
    expect(rock.checkStat(Stats.Defense, 0)).toBe(rockDefense);

    battle.setWeather(Weathers.Rain);

    expect(rock.checkStat(Stats.SpecialDefense, 0)).toBe(rockDefense);
  });

  it('will not let anything freeze in the sun', () => {
    const { battle, teamA, teamB } = createBattle();

    const attacker = createUnit(battle, teamA);
    const target = createUnit(battle, teamB, [Types.Normal]);

    battle.setWeather(Weathers.Sunny);
    attacker.triggerMoveTarget(Moves.IceBeam, unitTarget(target), 0);
    target.addStatus(Statuses.Frozen, { type: 0 });

    expect(target.status[Statuses.Frozen]).toBeUndefined();

    battle.setWeather(Weathers.None);
    target.addStatus(Statuses.Frozen, { type: 0 });

    expect(target.status[Statuses.Frozen]).toBeDefined();
  });
});

describe('what Magic Guard does and does not get out of', () => {
  it('spares the holder its own confusion', () => {
    const { battle, teamA } = createBattle();

    const holder = createUnit(battle, teamA);

    holder.addAbility(Abilities.MagicGuard);
    holder.addStatus(Statuses.Confused, { type: 0 });
    holder.triggerStatus(Statuses.Confused, { type: 0 });

    expect(holder.health).toBe(holder.checkStat(Stats.HP, 0));
  });

  it('leaves the same hit on anybody else', () => {
    const { battle, teamA } = createBattle();

    const unit = createUnit(battle, teamA);

    unit.addStatus(Statuses.Confused, { type: 0 });
    unit.triggerStatus(Statuses.Confused, { type: 0 });

    expect(unit.health).toBeLessThan(unit.checkStat(Stats.HP, 0));
  });

  it('pays for a Struggle like everyone else', () => {
    const { battle, teamA, teamB } = createBattle();

    const holder = createUnit(battle, teamA);
    const target = createUnit(battle, teamB);

    // Neither the ability that shrugs off indirect damage nor the one
    // that shrugs off recoil gets out of what Struggle costs
    holder.addAbility(Abilities.MagicGuard);
    holder.addAbility(Abilities.RockHead);
    holder.triggerMoveEffect(Moves.Struggle, unitTarget(target), 0);

    expect(holder.health).toBe(holder.checkStat(Stats.HP, 0) * (3 / 4));
  });
});

describe('Sheer Force and a Life Orb', () => {
  it('takes nothing back for a move it emptied out', () => {
    const { battle, teamA, teamB } = createBattle();

    pinRandom(battle, 1);

    const holder = createUnit(battle, teamA);
    const target = createUnit(battle, teamB);

    holder.addAbility(Abilities.SheerForce);
    holder.addItem(Items.LifeOrb);
    holder.attack(target, Moves.Ember, 40, Types.Fire, MoveCategories.Special, 0);

    expect(holder.health).toBe(holder.checkStat(Stats.HP, 0));
  });

  it('still takes its tenth for a move that had nothing to take', () => {
    const { battle, teamA, teamB } = createBattle();

    pinRandom(battle, 1);

    const holder = createUnit(battle, teamA);
    const target = createUnit(battle, teamB);

    // A Tackle has no added effect, so Sheer Force took nothing from
    // it and buys nothing back
    holder.addAbility(Abilities.SheerForce);
    holder.addItem(Items.LifeOrb);
    holder.attack(target, Moves.Tackle, 40, Types.Normal, MoveCategories.Physical, 0);

    expect(holder.health).toBeLessThan(holder.checkStat(Stats.HP, 0));
  });

  it('leaves the orb alone for anybody without the ability', () => {
    const { battle, teamA, teamB } = createBattle();

    pinRandom(battle, 1);

    const holder = createUnit(battle, teamA);
    const target = createUnit(battle, teamB);

    holder.addItem(Items.LifeOrb);
    holder.attack(target, Moves.Ember, 40, Types.Fire, MoveCategories.Special, 0);

    expect(holder.health).toBeLessThan(holder.checkStat(Stats.HP, 0));
  });
});
