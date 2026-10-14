import { describe, expect, it } from 'vitest';
import {
  AURA_GUARD_SCALE,
  DRAGONIZE_SCALE,
  FIRE_MANE_SCALE,
  PIERCING_DRILL_SCALE,
} from '../../../src/battle/abilities/legends-za';
import type Unit from '../../../src/battle/unit';
import { unitTarget } from '../../../src/battle/unit-checks';
import { Stages, Stats, StatsKind } from '../../../src/data/constants/stats';
import { Types } from '../../../src/data/constants/types';
import Abilities from '../../../src/data/ids/abilities';
import { MoveCategories, Moves } from '../../../src/data/ids/moves';
import { Statuses, Weathers } from '../../../src/data/ids/status';
import { createBattle, createUnit, pinRandom } from '../harness';
import { NONE_CAUSE, dealDamage } from './signature/helpers';

function full(unit: Unit): void {
  unit.setHealth(unit.checkStat(Stats.HP, 0));
}

describe('Mega Sol', () => {
  it('throws its Fire moves as if the sun were out, and its Water moves too', () => {
    const { battle, teamA, teamB } = createBattle();
    const sol = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);

    pinRandom(battle, 1);

    const fire = dealDamage(sol, foe, Moves.Ember, 40, Types.Fire, MoveCategories.Special);
    full(foe);
    const water = dealDamage(sol, foe, Moves.WaterGun, 40, Types.Water, MoveCategories.Special);
    full(foe);

    expect(fire).toBeGreaterThan(0);
    sol.addAbility(Abilities.MegaSol);

    expect(dealDamage(sol, foe, Moves.Ember, 40, Types.Fire, MoveCategories.Special)).toBeCloseTo(
      fire * 1.5,
      0,
    );
    full(foe);
    expect(
      dealDamage(sol, foe, Moves.WaterGun, 40, Types.Water, MoveCategories.Special),
    ).toBeCloseTo(water * 0.5, 0);
  });

  it('fires Solar Beam without its charge', () => {
    const { battle, teamA, teamB } = createBattle();
    const sol = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);
    const at = unitTarget(foe);

    expect(sol.checkMoveSteps(Moves.SolarBeam, at)).toBeGreaterThan(0);

    sol.addAbility(Abilities.MegaSol);

    expect(sol.checkMoveSteps(Moves.SolarBeam, at)).toBe(0);
  });

  it('leaves the sky alone outside its own moves, and the foe the same', () => {
    const { battle, teamA, teamB } = createBattle();
    const sol = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);

    pinRandom(battle, 1);
    sol.addAbility(Abilities.MegaSol);

    expect(sol.checkWeather()).toBe(Weathers.None);

    const bare = dealDamage(foe, sol, Moves.Ember, 40, Types.Fire, MoveCategories.Special);
    full(sol);
    sol.removeAbility(Abilities.MegaSol);

    expect(dealDamage(foe, sol, Moves.Ember, 40, Types.Fire, MoveCategories.Special)).toBe(bare);
  });
});

describe('Dragonize', () => {
  it('sends a Normal move out as Dragon, and harder', () => {
    const { battle, teamA, teamB } = createBattle();
    const gator = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);
    const at = unitTarget(foe);
    const bare = gator.checkMovePower(Moves.Pound, at) ?? 0;

    gator.addAbility(Abilities.Dragonize);

    expect(gator.checkMoveType(Moves.Pound, at)).toBe(Types.Dragon);
    expect(gator.checkMovePower(Moves.Pound, at)).toBeCloseTo(bare * DRAGONIZE_SCALE, 1);
    expect(gator.checkMoveType(Moves.Ember, at)).toBe(Types.Fire);
  });
});

describe('Piercing Drill', () => {
  it('drives a contact move through a guard for 1/4 of the blow', () => {
    const { battle, teamA, teamB } = createBattle();
    const drill = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);
    const max = foe.checkStat(Stats.HP, 0);

    pinRandom(battle, 1);
    drill.addAbility(Abilities.PiercingDrill);
    drill.triggerMoveTarget(Moves.Tackle, unitTarget(foe), 0);

    const open = max - foe.health;

    full(foe);
    foe.addStatus(Statuses.Protected, NONE_CAUSE);
    drill.triggerMoveTarget(Moves.Tackle, unitTarget(foe), 0);

    expect(open).toBeGreaterThan(0);
    expect(max - foe.health).toBeCloseTo(open * PIERCING_DRILL_SCALE, 0);
    expect(foe.status[Statuses.Protected]).toBeUndefined();

    // With the guard gone the next blow lands whole
    full(foe);
    drill.triggerMoveTarget(Moves.Tackle, unitTarget(foe), 0);

    expect(max - foe.health).toBe(open);
  });

  it('leaves a move that does not touch turned away', () => {
    const { battle, teamA, teamB } = createBattle();
    const drill = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);
    const max = foe.checkStat(Stats.HP, 0);

    pinRandom(battle, 1);
    drill.addAbility(Abilities.PiercingDrill);
    foe.addStatus(Statuses.Protected, NONE_CAUSE);
    drill.triggerMoveTarget(Moves.Swift, unitTarget(foe), 0);

    expect(foe.health).toBe(max);
  });
});

describe('Eelevate', () => {
  it('floats over Ground moves', () => {
    const { battle, teamA, teamB } = createBattle();
    const eel = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);
    const at = unitTarget(eel);

    expect(eel.checkGrounded()).toBe(true);

    eel.addAbility(Abilities.Eelevate);

    expect(eel.checkGrounded()).toBe(false);
    expect(foe.checkMoveImmunity(Moves.Earthquake, at, Types.Ground)).toBe(true);

    eel.addStatus(Statuses.Grounded, NONE_CAUSE);

    expect(eel.checkGrounded()).toBe(true);
  });

  it('raises its highest stat for each foe it knocks out', () => {
    const { battle, teamA, teamB } = createBattle();
    const eel = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);

    pinRandom(battle, 1);
    eel.setStat(StatsKind.Base, Stats.SpecialAttack, 150);
    eel.addAbility(Abilities.Eelevate);
    foe.setHealth(1);
    dealDamage(eel, foe, Moves.Tackle, 40, Types.Normal, MoveCategories.Physical);

    expect(foe.alive).toBe(false);
    expect(eel.stages[Stages.SpecialAttack]).toBe(1);
    expect(eel.stages[Stages.Attack]).toBe(0);
  });
});

describe('Spicy Spray', () => {
  it('burns whoever hurts it with a move, touching or not', () => {
    const { battle, teamA, teamB } = createBattle();
    const pepper = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);

    pinRandom(battle, 1);
    pepper.addAbility(Abilities.SpicySpray);
    dealDamage(foe, pepper, Moves.Swift, 60, Types.Normal, MoveCategories.Special);

    expect(foe.status[Statuses.Burned]).toBeDefined();
  });
});

describe('Aura Guard', () => {
  it('takes a contact move at 1/2 and anything else whole', () => {
    const { battle, teamA, teamB } = createBattle();
    const guard = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);

    pinRandom(battle, 1);

    const touch = dealDamage(foe, guard, Moves.Tackle, 80, Types.Normal, MoveCategories.Physical);
    full(guard);
    const reach = dealDamage(foe, guard, Moves.Swift, 80, Types.Normal, MoveCategories.Special);
    full(guard);

    expect(touch).toBeGreaterThan(0);
    guard.addAbility(Abilities.AuraGuard);

    expect(
      dealDamage(foe, guard, Moves.Tackle, 80, Types.Normal, MoveCategories.Physical),
    ).toBeCloseTo(touch * AURA_GUARD_SCALE, 0);
    full(guard);
    expect(dealDamage(foe, guard, Moves.Swift, 80, Types.Normal, MoveCategories.Special)).toBe(
      reach,
    );
  });
});

describe('Fire Mane', () => {
  it('lifts its Fire moves and nothing else', () => {
    const { battle, teamA, teamB } = createBattle();
    const lion = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);
    const at = unitTarget(foe);
    const fire = lion.checkMovePower(Moves.Flamethrower, at) ?? 0;
    const tackle = lion.checkMovePower(Moves.Tackle, at);

    lion.addAbility(Abilities.FireMane);

    expect(lion.checkMovePower(Moves.Flamethrower, at)).toBeCloseTo(fire * FIRE_MANE_SCALE, 1);
    expect(lion.checkMovePower(Moves.Tackle, at)).toBe(tackle);
  });
});
