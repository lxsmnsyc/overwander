import { describe, expect, it } from 'vitest';
import {
  AFTERIMAGE_SCALE,
  AFTERIMAGE_WINDOW,
  ICE_PACK_HEAL,
  IRON_GRIP_DURATION,
  SAND_GENERATOR_COOLDOWN,
  TERRAIN_EDGE_BOOST,
  TRACK_LAYING_COOLDOWN,
} from '../../../../src/battle/abilities/signature/gen-9/future-paradox';
import { EventPriority } from '../../../../src/core/event-emitter';
import type Battle from '../../../../src/battle/battle';
import { BattleEvents, MoveTargetType } from '../../../../src/battle/events';
import { clearStealthRock, stonesOver } from '../../../../src/battle/moves/stealth-rock';
import { unitTarget } from '../../../../src/battle/unit-checks';
import { Stats } from '../../../../src/data/constants/stats';
import { Types } from '../../../../src/data/constants/types';
import Abilities from '../../../../src/data/ids/abilities';
import { MoveCategories, Moves } from '../../../../src/data/ids/moves';
import { Statuses, Terrains, Weathers } from '../../../../src/data/ids/status';
import { createBattle, createUnit, pinRandom } from '../../harness';
import { act } from './helpers';

const NONE = { type: MoveTargetType.None } as const;

/** How many times an ability's cue has gone off */
function countCues(battle: Battle, ability: Abilities): { count: number } {
  const seen = { count: 0 };

  battle.on(BattleEvents.UnitTriggerAbility, EventPriority.Post, (event) => {
    if (event.ability === ability) {
      seen.count += 1;
    }
  });
  return seen;
}

describe('Track Laying', () => {
  it('lays Stealth Rock under the side of whatever its Ground move lands on', () => {
    const { battle, teamA, teamB } = createBattle();
    const treads = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);

    treads.addAbility(Abilities.TrackLaying);
    treads.attack(foe, Moves.Earthquake, 100, Types.Ground, MoveCategories.Physical, 0);
    battle.tick(5000);

    expect(stonesOver(teamB)).toBe(true);
    expect(stonesOver(teamA)).toBe(false);
  });

  it('lays nothing for a move of another type', () => {
    const { battle, teamA, teamB } = createBattle();
    const treads = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);

    treads.addAbility(Abilities.TrackLaying);
    treads.attack(foe, Moves.Tackle, 40, Types.Normal, MoveCategories.Physical, 0);
    battle.tick(5000);

    expect(stonesOver(teamB)).toBe(false);
  });

  it('rests 15 seconds between the stones it lays', () => {
    const { battle, teamA, teamB } = createBattle();
    const treads = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);

    treads.addAbility(Abilities.TrackLaying);
    treads.attack(foe, Moves.Earthquake, 100, Types.Ground, MoveCategories.Physical, 0);
    battle.tick(5000);
    clearStealthRock(teamB);
    treads.attack(foe, Moves.Earthquake, 100, Types.Ground, MoveCategories.Physical, 0);
    battle.tick(5000);

    expect(stonesOver(teamB)).toBe(false);

    battle.tick(TRACK_LAYING_COOLDOWN);
    treads.attack(foe, Moves.Earthquake, 100, Types.Ground, MoveCategories.Physical, 0);
    battle.tick(5000);

    expect(stonesOver(teamB)).toBe(true);
  });
});

describe('Ice Pack', () => {
  it('heals a teammate its Ice move is aimed at 1/4 of their HP', () => {
    const { battle, teamA, teamB } = createBattle();
    const bundle = createUnit(battle, teamA);
    const mate = createUnit(battle, teamA);

    createUnit(battle, teamB);
    pinRandom(battle, 0);
    bundle.addAbility(Abilities.IcePack);
    mate.setHealth(40);
    bundle.triggerMove(Moves.IceBeam, unitTarget(mate), 0);
    battle.tick(5000);

    expect(mate.health).toBeCloseTo(40 + mate.checkStat(Stats.HP, 0) * ICE_PACK_HEAL, 5);
    expect(mate.status[Statuses.Frozen]).toBeUndefined();
  });

  it('still hurts an enemy', () => {
    const { battle, teamA, teamB } = createBattle();
    const bundle = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);
    const before = foe.health;

    pinRandom(battle, 0.5);
    bundle.addAbility(Abilities.IcePack);
    bundle.triggerMove(Moves.IceBeam, unitTarget(foe), 0);
    battle.tick(5000);

    expect(foe.health).toBeLessThan(before);
  });
});

describe('Iron Grip', () => {
  it('keeps a target it punches from protecting for 4 seconds', () => {
    const { battle, teamA, teamB } = createBattle();
    const hands = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);

    foe.addMove(Moves.Protect);
    foe.addMove(Moves.Endure);
    hands.addAbility(Abilities.IronGrip);

    expect(foe.checkCanCast(Moves.Protect, NONE)).toBe(true);

    pinRandom(battle, 0.99);
    hands.attack(foe, Moves.ThunderPunch, 75, Types.Electric, MoveCategories.Physical, 0);

    expect(foe.checkCanCast(Moves.Protect, NONE)).toBe(false);
    // Endure only holds on, so it is not a guard the grip stops
    expect(foe.checkCanCast(Moves.Endure, NONE)).toBe(true);

    battle.tick(IRON_GRIP_DURATION);

    expect(foe.checkCanCast(Moves.Protect, NONE)).toBe(true);
  });

  it('holds nothing after a blow that is not a punch', () => {
    const { battle, teamA, teamB } = createBattle();
    const hands = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);

    foe.addMove(Moves.Protect);
    hands.addAbility(Abilities.IronGrip);
    hands.attack(foe, Moves.Tackle, 40, Types.Normal, MoveCategories.Physical, 0);

    expect(foe.checkCanCast(Moves.Protect, NONE)).toBe(true);
  });
});

describe('Toxic Exhaust', () => {
  it('poisons the target of a Fire move on a roll under 20%', () => {
    const { battle, teamA, teamB } = createBattle();
    const moth = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);

    moth.addAbility(Abilities.ToxicExhaust);
    pinRandom(battle, 0.19);
    moth.attack(foe, Moves.Ember, 40, Types.Fire, MoveCategories.Special, 0);

    expect(foe.status[Statuses.Poisoned]).toBeDefined();
  });

  it('misses on a roll of 20% or more, and never rides another type', () => {
    const { battle, teamA, teamB } = createBattle();
    const moth = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);
    const other = createUnit(battle, teamB);

    moth.addAbility(Abilities.ToxicExhaust);
    pinRandom(battle, 0.2);
    moth.attack(foe, Moves.Ember, 40, Types.Fire, MoveCategories.Special, 0);
    pinRandom(battle, 0);
    moth.attack(other, Moves.Tackle, 40, Types.Normal, MoveCategories.Physical, 0);

    expect(foe.status[Statuses.Poisoned]).toBeUndefined();
    expect(other.status[Statuses.Poisoned]).toBeUndefined();
  });
});

describe('Sand Generator', () => {
  it('whips up a sandstorm when an Electric move lands on it', () => {
    const { battle, teamA, teamB } = createBattle();
    const thorns = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);

    thorns.addAbility(Abilities.SandGenerator);
    foe.attack(thorns, Moves.ThunderShock, 40, Types.Electric, MoveCategories.Special, 0);
    battle.tick(5000);

    expect(thorns.checkWeather()).toBe(Weathers.Sandstorm);
  });

  it('raises nothing from another type, and rests 15 seconds between storms', () => {
    const { battle, teamA, teamB } = createBattle();
    const thorns = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);
    const cues = countCues(battle, Abilities.SandGenerator);

    thorns.addAbility(Abilities.SandGenerator);
    foe.attack(thorns, Moves.Tackle, 40, Types.Normal, MoveCategories.Physical, 0);

    expect(cues.count).toBe(0);

    foe.attack(thorns, Moves.ThunderShock, 40, Types.Electric, MoveCategories.Special, 0);
    battle.tick(1000);
    foe.attack(thorns, Moves.ThunderShock, 40, Types.Electric, MoveCategories.Special, 0);

    expect(cues.count).toBe(1);

    battle.tick(SAND_GENERATOR_COOLDOWN);
    foe.attack(thorns, Moves.ThunderShock, 40, Types.Electric, MoveCategories.Special, 0);

    expect(cues.count).toBe(2);
  });
});

describe('Afterimage', () => {
  it('winds its next move up 40% faster just after it is hit', () => {
    const { battle, teamA, teamB } = createBattle();
    const valiant = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);
    const at = unitTarget(foe);

    valiant.addAbility(Abilities.Afterimage);

    const plain = valiant.checkMoveCastTime(Moves.Tackle, at);

    foe.attack(valiant, Moves.Tackle, 40, Types.Normal, MoveCategories.Physical, 0);

    expect(valiant.checkMoveCastTime(Moves.Tackle, at)).toBeCloseTo(plain * AFTERIMAGE_SCALE, 5);

    act(battle, valiant);

    expect(valiant.checkMoveCastTime(Moves.Tackle, at)).toBe(plain);
  });

  it('loses the quicker wind-up once the second has passed', () => {
    const { battle, teamA, teamB } = createBattle();
    const valiant = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);
    const at = unitTarget(foe);

    valiant.addAbility(Abilities.Afterimage);

    const plain = valiant.checkMoveCastTime(Moves.Tackle, at);

    foe.attack(valiant, Moves.Tackle, 40, Types.Normal, MoveCategories.Physical, 0);
    battle.tick(AFTERIMAGE_WINDOW);

    expect(valiant.checkMoveCastTime(Moves.Tackle, at)).toBe(plain);
  });
});

describe('Terrain Edge', () => {
  it('hits 1.3x with a slicing move while any terrain is up', () => {
    const { battle, teamA, teamB } = createBattle();
    const leaves = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);
    const at = unitTarget(foe);

    leaves.addAbility(Abilities.TerrainEdge);

    const plain = leaves.checkMovePower(Moves.LeafBlade, at) ?? 0;

    expect(plain).toBeGreaterThan(0);

    // Misty Terrain strengthens no type of its own, so the rise is the ability's
    battle.setTerrain(Terrains.Misty);

    expect(leaves.checkMovePower(Moves.LeafBlade, at)).toBeCloseTo(plain * TERRAIN_EDGE_BOOST, 5);
    expect(leaves.checkMovePower(Moves.Tackle, at)).toBe(
      createUnit(battle, teamA).checkMovePower(Moves.Tackle, at),
    );
  });
});
