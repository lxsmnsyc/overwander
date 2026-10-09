// Skwovet through Yamper: Postwick, Route 1 and the Wild Area.

import { describe, expect, it } from 'vitest';
import {
  COTTON_CRADLE_SCALE,
  EARLY_WARNING_COOLDOWN,
  STEEL_ESCORT_COOLDOWN,
} from '../../../../src/battle/abilities/signature/skwovet-to-yamper';
import { type EffectCause, EffectType, MoveTargetType } from '../../../../src/battle/events';
import type Unit from '../../../../src/battle/unit';
import { unitTarget } from '../../../../src/battle/utils';
import { Stages, Stats } from '../../../../src/data/constants/stats';
import { Types } from '../../../../src/data/constants/types';
import Abilities from '../../../../src/data/ids/abilities';
import { Items } from '../../../../src/data/ids/items';
import { MoveCategories, Moves } from '../../../../src/data/ids/moves';
import { Statuses, TeamStatuses, Terrains } from '../../../../src/data/ids/status';
import { createBattle, createUnit, pinRandom } from '../../harness';
import { NONE_CAUSE, act, dealDamage } from './helpers';

type Blow = readonly [Moves, number, Types, MoveCategories];

const TACKLE: Blow = [Moves.Tackle, 40, Types.Normal, MoveCategories.Physical];
const EMBER: Blow = [Moves.Ember, 40, Types.Fire, MoveCategories.Special];
const BITE: Blow = [Moves.Bite, 40, Types.Dark, MoveCategories.Physical];
const THIEF: Blow = [Moves.Thief, 10, Types.Dark, MoveCategories.Physical];

/** Long enough for any cast move to have resolved */
const FLIGHT = 1000;

function max(unit: Unit): number {
  return unit.checkStat(Stats.HP, 0);
}

function from(move: Moves, unit: Unit): EffectCause {
  return { type: EffectType.Move, move, unit };
}

describe('Pantry Raid', () => {
  it('eats the healing berry an enemy reaches for', () => {
    const { battle, teamA, teamB } = createBattle();
    const squirrel = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);

    squirrel.addAbility(Abilities.PantryRaid);
    squirrel.setHealth(max(squirrel) / 2);
    foe.addItem(Items.SitrusBerry);

    const raided = squirrel.health;

    foe.setHealth(max(foe) / 4);

    expect(foe.items[Items.SitrusBerry]).toBeUndefined();
    expect(foe.health).toBe(max(foe) / 4);
    expect(squirrel.health).toBeCloseTo(raided + max(squirrel) / 4, 5);
  });

  it("is cured by the cure berry an enemy eats, and leaves its own side's alone", () => {
    const { battle, teamA, teamB } = createBattle();
    const squirrel = createUnit(battle, teamA);
    const mate = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);

    squirrel.addAbility(Abilities.PantryRaid);
    squirrel.addStatus(Statuses.Burned, from(Moves.WillOWisp, foe));
    foe.addItem(Items.RawstBerry);
    foe.addStatus(Statuses.Burned, from(Moves.WillOWisp, squirrel));

    expect(foe.items[Items.RawstBerry]).toBeUndefined();
    expect(foe.status[Statuses.Burned]).toBeDefined();
    expect(squirrel.status[Statuses.Burned]).toBeUndefined();

    // A teammate's berry is its own to eat
    mate.addItem(Items.RawstBerry);
    mate.addStatus(Statuses.Burned, from(Moves.WillOWisp, foe));

    expect(mate.status[Statuses.Burned]).toBeUndefined();
  });

  it('settles between two raiders without passing the berry forever', () => {
    const { battle, teamA, teamB } = createBattle();
    const squirrel = createUnit(battle, teamA);
    const rival = createUnit(battle, teamB);

    squirrel.addAbility(Abilities.PantryRaid);
    rival.addAbility(Abilities.PantryRaid);
    squirrel.setHealth(max(squirrel) / 2);
    rival.addItem(Items.SitrusBerry);

    const raided = squirrel.health;

    rival.setHealth(max(rival) / 4);

    expect(squirrel.health).toBeCloseTo(raided + max(squirrel) / 4, 5);
    expect(rival.health).toBe(max(rival) / 4);
  });
});

describe('Steel Escort', () => {
  it('raises Wide Guard when an enemy winds up a spread move', () => {
    const { battle, teamA, teamB } = createBattle();
    const bird = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);

    bird.addAbility(Abilities.SteelEscort);
    foe.addMove(Moves.Tackle);
    foe.addMove(Moves.RockSlide);

    // A move at one pokemon is not what the wall is for
    foe.cast(Moves.Tackle, unitTarget(bird));
    battle.tick(FLIGHT);

    expect(teamA.status[TeamStatuses.WideGuard]).toBeUndefined();

    battle.tick(FLIGHT);
    foe.cast(Moves.RockSlide, { type: MoveTargetType.None });
    battle.tick(FLIGHT);

    expect(teamA.status[TeamStatuses.WideGuard]).toBeDefined();
    expect(teamB.status[TeamStatuses.WideGuard]).toBeUndefined();
  });

  it('walls off at most once every 10 seconds', () => {
    const { battle, teamA, teamB } = createBattle();
    const bird = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);
    const other = createUnit(battle, teamB);
    const third = createUnit(battle, teamB);

    bird.addAbility(Abilities.SteelEscort);
    foe.addMove(Moves.RockSlide);
    other.addMove(Moves.RockSlide);
    third.addMove(Moves.RockSlide);

    foe.cast(Moves.RockSlide, { type: MoveTargetType.None });
    battle.tick(FLIGHT);

    expect(teamA.status[TeamStatuses.WideGuard]).toBeDefined();

    // Long enough for the guard to have dropped
    battle.tick(4000);

    expect(teamA.status[TeamStatuses.WideGuard]).toBeUndefined();

    other.cast(Moves.RockSlide, { type: MoveTargetType.None });
    battle.tick(FLIGHT);

    expect(teamA.status[TeamStatuses.WideGuard]).toBeUndefined();

    // A third, since the second's Rock Slide is still cooling
    battle.tick(STEEL_ESCORT_COOLDOWN);
    third.cast(Moves.RockSlide, { type: MoveTargetType.None });
    battle.tick(FLIGHT);

    expect(teamA.status[TeamStatuses.WideGuard]).toBeDefined();
  });
});

describe('Early Warning', () => {
  it('has a teammate Detect a single-target move wound up at it', () => {
    const { battle, teamA, teamB } = createBattle();
    const bug = createUnit(battle, teamA);
    const mate = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);

    pinRandom(battle, 1);
    bug.addAbility(Abilities.EarlyWarning);
    foe.addMove(Moves.Tackle);
    foe.addMove(Moves.RockSlide);

    // A spread move is aimed at nobody in particular
    foe.cast(Moves.RockSlide, { type: MoveTargetType.None });
    battle.tick(500);

    expect(mate.status[Statuses.Protected]).toBeUndefined();

    battle.tick(3000);

    const health = mate.health;

    foe.cast(Moves.Tackle, unitTarget(mate));
    battle.tick(500);

    expect(mate.status[Statuses.Protected]).toBeDefined();
    expect(bug.status[Statuses.Protected]).toBeUndefined();

    // The guard is up before the Tackle lands
    battle.tick(1500);

    expect(mate.health).toBe(health);
  });

  it('warns nobody of a move at itself, and only once every 10 seconds', () => {
    const { battle, teamA, teamB } = createBattle();
    const bug = createUnit(battle, teamA);
    const mate = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);
    const other = createUnit(battle, teamB);

    pinRandom(battle, 1);
    bug.addAbility(Abilities.EarlyWarning);
    foe.addMove(Moves.Tackle);
    other.addMove(Moves.Tackle);

    foe.cast(Moves.Tackle, unitTarget(bug));
    battle.tick(500);

    expect(bug.status[Statuses.Protected]).toBeUndefined();

    battle.tick(3000);
    other.cast(Moves.Tackle, unitTarget(mate));
    battle.tick(500);

    expect(mate.status[Statuses.Protected]).toBeDefined();

    battle.tick(4000);
    foe.cast(Moves.Tackle, unitTarget(mate));
    battle.tick(500);

    expect(mate.status[Statuses.Protected]).toBeUndefined();

    battle.tick(EARLY_WARNING_COOLDOWN);
    // A guard right after another fails, so something else goes between
    mate.triggerMove(Moves.Growl, unitTarget(foe), 0);
    battle.tick(500);
    other.cast(Moves.Tackle, unitTarget(mate));
    battle.tick(500);

    expect(mate.status[Statuses.Protected]).toBeDefined();
  });
});

describe('Fence', () => {
  it('hands what it steals to the neediest teammate with empty hands', () => {
    const { battle, teamA, teamB } = createBattle();
    const fox = createUnit(battle, teamA);
    const full = createUnit(battle, teamA);
    const hurt = createUnit(battle, teamA);
    const fine = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);

    pinRandom(battle, 1);
    fox.addAbility(Abilities.Fence);
    full.addItem(Items.Leftovers);
    full.setHealth(1);
    hurt.setHealth(max(hurt) / 2);
    foe.addItem(Items.SitrusBerry);

    dealDamage(fox, foe, ...THIEF);

    expect(foe.items[Items.SitrusBerry]).toBeUndefined();
    expect(fox.items[Items.SitrusBerry]).toBeUndefined();
    expect(hurt.items[Items.SitrusBerry]).toBe(true);
    expect(fine.items[Items.SitrusBerry]).toBeUndefined();

    // Its own hands stayed free, so it can steal again
    foe.addItem(Items.Leftovers);
    dealDamage(fox, foe, ...THIEF);

    expect(fine.items[Items.Leftovers]).toBe(true);
  });

  it('keeps what it steals when nobody has empty hands', () => {
    const { battle, teamA, teamB } = createBattle();
    const fox = createUnit(battle, teamA);
    const mate = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);

    pinRandom(battle, 1);
    fox.addAbility(Abilities.Fence);
    mate.addItem(Items.Leftovers);
    foe.addItem(Items.SitrusBerry);

    dealDamage(fox, foe, ...THIEF);

    expect(fox.items[Items.SitrusBerry]).toBe(true);
  });
});

describe('Cotton Cradle', () => {
  it("lifts its team's Ingrain, Leech Seed and Grassy Terrain heals by half", () => {
    const { battle, teamA, teamB } = createBattle();
    const cotton = createUnit(battle, teamA);
    const mate = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);
    const share = max(mate) / 16;

    cotton.addAbility(Abilities.CottonCradle);

    // Roots
    mate.setHealth(max(mate) / 2);
    mate.addStatus(Statuses.Rooted, from(Moves.Ingrain, mate));
    act(battle, mate);

    expect(mate.health).toBeCloseTo(max(mate) / 2 + share * COTTON_CRADLE_SCALE, 5);

    mate.removeStatus(Statuses.Rooted, NONE_CAUSE);

    // A seed draining for its planter
    mate.setHealth(max(mate) / 2);
    foe.addStatus(Statuses.Seeding, from(Moves.LeechSeed, mate));
    battle.tick(2000);

    expect(mate.health).toBeCloseTo(max(mate) / 2 + (max(foe) / 8) * COTTON_CRADLE_SCALE, 5);

    foe.removeStatus(Statuses.Seeding, NONE_CAUSE);

    // Grass underfoot
    mate.setHealth(max(mate) / 2);
    mate.setTerrain(Terrains.Grassy);
    act(battle, mate);

    expect(mate.health).toBeCloseTo(max(mate) / 2 + share * COTTON_CRADLE_SCALE, 5);
  });

  it('leaves other heals, and the other side, alone', () => {
    const { battle, teamA, teamB } = createBattle();
    const cotton = createUnit(battle, teamA);
    const mate = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);

    cotton.addAbility(Abilities.CottonCradle);

    mate.setHealth(max(mate) / 2);
    mate.heal(from(Moves.Recover, mate), mate, 10, 0);

    expect(mate.health).toBe(max(mate) / 2 + 10);

    foe.setHealth(max(foe) / 2);
    foe.addStatus(Statuses.Rooted, from(Moves.Ingrain, foe));
    act(battle, foe);

    expect(foe.health).toBeCloseTo(max(foe) / 2 + max(foe) / 16, 5);
  });
});

describe('Shorn', () => {
  it('sheds its burn and casts Agility on the first Fire move to land', () => {
    const { battle, teamA, teamB } = createBattle();
    const sheep = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);

    pinRandom(battle, 1);
    sheep.addAbility(Abilities.Shorn);
    sheep.addStatus(Statuses.Burned, from(Moves.WillOWisp, foe));

    dealDamage(foe, sheep, ...TACKLE);
    battle.tick(FLIGHT);

    expect(sheep.status[Statuses.Burned]).toBeDefined();
    expect(sheep.stages[Stages.Speed]).toBe(0);

    dealDamage(foe, sheep, ...EMBER);
    battle.tick(FLIGHT);

    expect(sheep.status[Statuses.Burned]).toBeUndefined();
    expect(sheep.stages[Stages.Speed]).toBe(2);
  });

  it('singes only once a fight', () => {
    const { battle, teamA, teamB } = createBattle();
    const sheep = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);

    pinRandom(battle, 1);
    sheep.addAbility(Abilities.Shorn);

    dealDamage(foe, sheep, ...EMBER);
    battle.tick(FLIGHT);

    expect(sheep.stages[Stages.Speed]).toBe(2);

    sheep.addStatus(Statuses.Burned, from(Moves.WillOWisp, foe));
    dealDamage(foe, sheep, ...EMBER);
    battle.tick(FLIGHT);

    expect(sheep.status[Statuses.Burned]).toBeDefined();
    expect(sheep.stages[Stages.Speed]).toBe(2);
  });
});

describe('Shell Snap', () => {
  it("bites through the screens on the target's side", () => {
    const { battle, teamA, teamB } = createBattle();
    const turtle = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);
    const cause = from(Moves.Reflect, foe);

    pinRandom(battle, 1);
    turtle.addAbility(Abilities.ShellSnap);
    teamB.addStatus(TeamStatuses.Reflect, cause);
    teamB.addStatus(TeamStatuses.LightScreen, cause);
    teamB.addStatus(TeamStatuses.AuroraVeil, cause);
    teamA.addStatus(TeamStatuses.Reflect, from(Moves.Reflect, turtle));

    dealDamage(turtle, foe, ...TACKLE);

    expect(teamB.status[TeamStatuses.Reflect]).toBeDefined();

    dealDamage(turtle, foe, ...BITE);

    expect(teamB.status[TeamStatuses.Reflect]).toBeUndefined();
    expect(teamB.status[TeamStatuses.LightScreen]).toBeUndefined();
    expect(teamB.status[TeamStatuses.AuroraVeil]).toBeUndefined();
    expect(teamA.status[TeamStatuses.Reflect]).toBeDefined();
  });
});

describe('Zoomies', () => {
  it('casts Charge each time its Speed rises', () => {
    const { battle, teamA } = createBattle();
    const pup = createUnit(battle, teamA);

    pup.addAbility(Abilities.Zoomies);

    pup.addStage(Stages.Speed, -1, NONE_CAUSE);
    pup.addStage(Stages.Attack, 1, NONE_CAUSE);
    battle.tick(FLIGHT);

    expect(pup.stages[Stages.SpecialDefense]).toBe(0);

    pup.addStage(Stages.Speed, 1, NONE_CAUSE);
    battle.tick(FLIGHT);
    pup.addStage(Stages.Speed, 2, NONE_CAUSE);
    battle.tick(FLIGHT);

    expect(pup.stages[Stages.SpecialDefense]).toBe(2);
  });
});
