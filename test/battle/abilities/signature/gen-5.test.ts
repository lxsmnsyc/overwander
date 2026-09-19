// Snivy through Oshawott.

import { describe, expect, it } from 'vitest';
import { Stages, Stats } from '../../../../src/data/constants/stats';
import { Types } from '../../../../src/data/constants/types';
import Abilities from '../../../../src/data/ids/abilities';
import { MoveCategories, Moves } from '../../../../src/data/ids/moves';
import { Items } from '../../../../src/data/ids/items';
import { Genders } from '../../../../src/data/ids/species';
import { Statuses } from '../../../../src/data/ids/status';
import { EffectType, MoveTargetType } from '../../../../src/battle/events';
import type Unit from '../../../../src/battle/unit';
import {
  DOZE_SHARE,
  STORM_DASH_STEP,
} from '../../../../src/battle/abilities/signature/munna-to-blitzle';
import {
  AFTERSHOCK_SHARE,
  TORQUE_SCALE,
  TORQUE_WIND_UP,
} from '../../../../src/battle/abilities/signature/roggenrola-to-drilbur';
import {
  GUARD_FACTOR,
  SPOTTER_ACCURACY,
} from '../../../../src/battle/abilities/signature/patrat-to-purrloin';
import turns from '../../../../src/battle/turn';
import { createBattle, createUnit, pinRandom } from '../../harness';
import { dealDamage } from './helpers';

function unitTarget(unit: Unit): { readonly type: MoveTargetType.Unit; readonly unit: Unit } {
  return { type: MoveTargetType.Unit, unit } as const;
}

describe('the Unova starters', () => {
  it('slows what its first landed move hits, and nothing after that', () => {
    const { battle, teamA, teamB } = createBattle();
    const snake = createUnit(battle, teamA);
    const target = createUnit(battle, teamB);

    snake.addAbility(Abilities.LeafOpening);
    snake.enter();
    target.enter();
    battle.tick(1);

    dealDamage(snake, target, Moves.Tackle, 40, Types.Normal, MoveCategories.Physical);

    expect(target.stages[Stages.Speed]).toBe(-1);

    // The opening is spent, so the second blow is an ordinary one
    dealDamage(snake, target, Moves.Tackle, 40, Types.Normal, MoveCategories.Physical);

    expect(target.stages[Stages.Speed]).toBe(-1);
  });

  it('puts half again behind its first landed move only', () => {
    const { battle, teamA, teamB } = createBattle();

    pinRandom(battle, 1);

    const boar = createUnit(battle, teamA);
    const target = createUnit(battle, teamB);

    boar.addAbility(Abilities.EmberOpening);
    boar.enter();
    target.enter();
    battle.tick(1);

    const opened = dealDamage(
      boar,
      target,
      Moves.Tackle,
      40,
      Types.Normal,
      MoveCategories.Physical,
    );
    const ordinary = dealDamage(
      boar,
      target,
      Moves.Tackle,
      40,
      Types.Normal,
      MoveCategories.Physical,
    );

    expect(opened).toBeGreaterThan(ordinary);
    expect(opened / ordinary).toBeCloseTo(1.5, 1);
  });

  it('gets its shell up on its first landed move, once a fight', () => {
    const { battle, teamA, teamB } = createBattle();
    const otter = createUnit(battle, teamA);
    const target = createUnit(battle, teamB);

    otter.addAbility(Abilities.ShellOpening);
    otter.enter();
    target.enter();
    battle.tick(1);

    dealDamage(otter, target, Moves.Tackle, 40, Types.Normal, MoveCategories.Physical);

    expect(otter.stages[Stages.Defense]).toBe(2);

    dealDamage(otter, target, Moves.Tackle, 40, Types.Normal, MoveCategories.Physical);

    expect(otter.stages[Stages.Defense]).toBe(2);
  });
});

describe('the three a walk out of the first town meets', () => {
  it('calls the shot for its whole team, against a target mid-move', () => {
    const { battle, teamA, teamB } = createBattle();
    const scout = createUnit(battle, teamA);
    const ally = createUnit(battle, teamA);
    const target = createUnit(battle, teamB);
    const aim = unitTarget(target);

    scout.enter();
    ally.enter();
    target.enter();
    target.addMove(Moves.Tackle);

    const bare = ally.checkMoveAccuracy(Moves.Thunderbolt, aim) ?? 0;

    scout.addAbility(Abilities.Spotter);

    // Nothing is called while the target is doing nothing
    expect(ally.checkMoveAccuracy(Moves.Thunderbolt, aim)).toBe(bare);

    target.cast(Moves.Tackle, unitTarget(ally));
    battle.tick(1);

    expect(ally.checkMoveAccuracy(Moves.Thunderbolt, aim)).toBeCloseTo(bare * SPOTTER_ACCURACY, 5);
    // And the scout's own throws are called too
    expect(scout.checkMoveAccuracy(Moves.Thunderbolt, aim)).toBeCloseTo(bare * SPOTTER_ACCURACY, 5);
  });

  it('stands over a hurt teammate, and stands down once it is well', () => {
    const { battle, teamA, teamB } = createBattle();
    const dog = createUnit(battle, teamA);
    const ally = createUnit(battle, teamA);

    createUnit(battle, teamB).enter();
    dog.enter();
    ally.enter();
    dog.addAbility(Abilities.LoyalGuard);

    const defense = dog.checkStat(Stats.Defense, 0);
    const special = dog.checkStat(Stats.SpecialDefense, 0);

    ally.setHealth(Math.floor(ally.checkStat(Stats.HP, 0) / 4));

    expect(dog.checkStat(Stats.Defense, 0)).toBe(defense * GUARD_FACTOR);
    expect(dog.checkStat(Stats.SpecialDefense, 0)).toBe(special * GUARD_FACTOR);

    // Its own health is not what it is watching
    ally.setHealth(ally.checkStat(Stats.HP, 0));

    expect(dog.checkStat(Stats.Defense, 0)).toBe(defense);
  });

  it('takes an item with the first move it lands, once a fight', () => {
    const { battle, teamA, teamB } = createBattle();
    const cat = createUnit(battle, teamA);
    const target = createUnit(battle, teamB);
    const other = createUnit(battle, teamB);

    cat.enter();
    target.enter();
    other.enter();
    cat.addAbility(Abilities.CatBurglar);
    target.addItem(Items.Leftovers);
    other.addItem(Items.ShellBell);

    dealDamage(cat, target, Moves.Tackle, 40, Types.Normal, MoveCategories.Physical);

    expect(cat.hasItem(Items.Leftovers)).toBe(true);
    expect(target.hasItem(Items.Leftovers)).toBe(false);

    // One theft a fight: the second pokemon keeps what it is holding
    dealDamage(cat, other, Moves.Tackle, 40, Types.Normal, MoveCategories.Physical);

    expect(other.hasItem(Items.ShellBell)).toBe(true);
  });
});

describe('the three the second road holds', () => {
  it('banks the seconds it dozes and spends them as it acts', () => {
    const { battle, teamA, teamB } = createBattle();
    const dreamer = createUnit(battle, teamA);
    const target = createUnit(battle, teamB);

    dreamer.enter();
    target.enter();
    dreamer.addAbility(Abilities.Doze);
    dreamer.addMove(Moves.Tackle);
    dreamer.setHealth(1);

    // Three idle seconds are banked, and nothing is paid until it acts
    battle.tick(3000);

    expect(dreamer.health).toBe(1);

    dreamer.cast(Moves.Tackle, unitTarget(target));
    battle.tick(1);

    const banked = Math.floor(dreamer.checkStat(Stats.HP, 0) * DOZE_SHARE * 3);

    expect(dreamer.health).toBe(1 + banked);
  });

  it('cannot miss anybody it has already landed a move on', () => {
    const { battle, teamA, teamB } = createBattle();
    const bird = createUnit(battle, teamA);
    const target = createUnit(battle, teamB);
    const other = createUnit(battle, teamB);

    bird.enter();
    target.enter();
    other.enter();
    bird.addAbility(Abilities.Homing);

    // The first throw at each of them is rolled for like anybody's
    expect(bird.checkMoveAccuracy(Moves.AirSlash, unitTarget(target))).toBeGreaterThan(0);

    dealDamage(bird, target, Moves.Tackle, 40, Types.Normal, MoveCategories.Physical);

    expect(bird.checkMoveAccuracy(Moves.AirSlash, unitTarget(target))).toBeUndefined();
    // Whoever it has not found yet is still a roll
    expect(bird.checkMoveAccuracy(Moves.AirSlash, unitTarget(other))).toBeGreaterThan(0);
  });

  it('hits harder for each stage of Speed it is running on', () => {
    const { battle, teamA, teamB } = createBattle();
    const zebra = createUnit(battle, teamA);
    const target = createUnit(battle, teamB);

    zebra.enter();
    target.enter();
    zebra.addAbility(Abilities.StormDash);

    const bare = zebra.checkMovePower(Moves.Tackle, unitTarget(target)) ?? 0;

    zebra.addStage(Stages.Speed, 2, { type: EffectType.None });

    expect(zebra.checkMovePower(Moves.Tackle, unitTarget(target))).toBeCloseTo(
      bare * (1 + STORM_DASH_STEP * 2),
      5,
    );

    // A lost stage is not a cost: it only ever reads what it has gained
    zebra.addStage(Stages.Speed, -4, { type: EffectType.None });

    expect(zebra.checkMovePower(Moves.Tackle, unitTarget(target))).toBeCloseTo(bare, 5);
  });
});

describe('the three the first cave holds', () => {
  it('shocks whoever leaves it standing on 1 HP', () => {
    const { battle, teamA, teamB } = createBattle();
    const ore = createUnit(battle, teamA);
    const attacker = createUnit(battle, teamB);

    ore.enter();
    attacker.enter();
    // Sturdy is what usually leaves it on 1 HP, and is in its own
    // pool. It is worn rather than added, so it costs no slot
    ore.wearAbility(Abilities.Sturdy);
    ore.addAbility(Abilities.Aftershock);

    const full = attacker.checkStat(Stats.HP, 0);

    dealDamage(attacker, ore, Moves.Tackle, 999, Types.Normal, MoveCategories.Physical);

    expect(ore.health).toBe(1);
    expect(full - attacker.health).toBe(Math.floor(full * AFTERSHOCK_SHARE));
  });

  it('leaves the mark of its nose on an enemy as it arrives', () => {
    const { battle, teamA, teamB } = createBattle();
    const bat = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);

    bat.setGender(Genders.Female);
    enemy.setGender(Genders.Male);
    bat.addAbility(Abilities.HeartMark);
    enemy.enter();
    bat.enter();
    battle.tick(turns(1));

    expect(enemy.status[Statuses.Infatuated]).toBeDefined();
  });

  it('spins the drill up: harder blows for a longer wind-up', () => {
    const { battle, teamA, teamB } = createBattle();
    const mole = createUnit(battle, teamA);
    const target = createUnit(battle, teamB);
    const aim = unitTarget(target);

    mole.enter();
    target.enter();

    const power = mole.checkMovePower(Moves.DrillRun, aim) ?? 0;
    const wind = mole.checkMoveCastTime(Moves.DrillRun, aim);

    mole.addAbility(Abilities.Torque);

    expect(mole.checkMovePower(Moves.DrillRun, aim)).toBeCloseTo(power * TORQUE_SCALE, 5);
    expect(mole.checkMoveCastTime(Moves.DrillRun, aim)).toBeCloseTo(wind * TORQUE_WIND_UP, 5);
  });
});
