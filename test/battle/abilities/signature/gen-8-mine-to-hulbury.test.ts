// Applin through Pincurchin.

import { describe, expect, it } from 'vitest';
import { EventPriority } from '../../../../src/core/event-emitter';
import { Stages, Stats } from '../../../../src/data/constants/stats';
import { Types } from '../../../../src/data/constants/types';
import Abilities from '../../../../src/data/ids/abilities';
import { Items } from '../../../../src/data/ids/items';
import { MoveCategories, MoveTargets, Moves } from '../../../../src/data/ids/moves';
import { Statuses, Weathers } from '../../../../src/data/ids/status';
import type Battle from '../../../../src/battle/core';
import { BattleEvents, EffectType } from '../../../../src/battle/events';
import turns from '../../../../src/battle/turn';
import { unitTarget } from '../../../../src/battle/utils';
import {
  SPEARHEAD_COOLDOWN,
  VENOM_CHARGE_COOLDOWN,
} from '../../../../src/battle/abilities/signature/applin-to-pincurchin';
import { createBattle, createUnit, pinRandom } from '../../harness';
import { NONE_CAUSE, dealDamage } from './helpers';

/** Long enough for a cast move to land, short of any wind-up */
const FLIGHT = 500;

/** How many times the ability's cue has fired */
function countCues(battle: Battle, ability: Abilities): () => number {
  let count = 0;

  battle.on(BattleEvents.UnitTriggerAbility, EventPriority.Post, (event) => {
    if (event.ability === ability) {
      count += 1;
    }
  });

  return () => count;
}

describe('Shared Harvest', () => {
  it('heals its worst-hurt teammate with the berry it eats', () => {
    const { battle, teamA, teamB } = createBattle();
    const applin = createUnit(battle, teamA);
    const scratched = createUnit(battle, teamA);
    const hurt = createUnit(battle, teamA);
    createUnit(battle, teamB);
    const max = applin.checkStat(Stats.HP, 0);

    applin.addAbility(Abilities.SharedHarvest);
    applin.addItem(Items.SitrusBerry);
    scratched.setHealth(max * 0.9);
    hurt.setHealth(max * 0.3);

    // Into the Sitrus's pinch
    applin.setHealth(max * 0.4);

    expect(applin.items[Items.SitrusBerry]).toBeUndefined();
    expect(applin.health).toBeGreaterThan(max * 0.4);
    expect(hurt.health).toBeCloseTo(max * 0.3 + (applin.health - max * 0.4), 5);
    expect(scratched.health).toBeCloseTo(max * 0.9, 5);
  });

  it('passes a cure on too', () => {
    const { battle, teamA, teamB } = createBattle();
    const applin = createUnit(battle, teamA);
    const mate = createUnit(battle, teamA);
    createUnit(battle, teamB);

    applin.addAbility(Abilities.SharedHarvest);
    applin.addItem(Items.CheriBerry);
    mate.setHealth(mate.health / 2);
    mate.addStatus(Statuses.Paralyzed, NONE_CAUSE);

    expect(mate.status[Statuses.Paralyzed]).not.toBeUndefined();

    applin.addStatus(Statuses.Paralyzed, NONE_CAUSE);

    expect(applin.status[Statuses.Paralyzed]).toBeUndefined();
    expect(mate.status[Statuses.Paralyzed]).toBeUndefined();
  });

  it('does nothing for a berry eaten by somebody without it', () => {
    const { battle, teamA, teamB } = createBattle();
    const eater = createUnit(battle, teamA);
    const mate = createUnit(battle, teamA);
    createUnit(battle, teamB);
    const max = eater.checkStat(Stats.HP, 0);

    eater.addItem(Items.SitrusBerry);
    mate.setHealth(max * 0.3);
    eater.setHealth(max * 0.4);

    expect(eater.items[Items.SitrusBerry]).toBeUndefined();
    expect(mate.health).toBeCloseTo(max * 0.3, 5);
  });
});

describe('Coil Burrow', () => {
  it('spreads its Ground moves over every enemy while the sand blows', () => {
    const { battle, teamA, teamB } = createBattle();
    const snake = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);

    snake.addAbility(Abilities.CoilBurrow);

    expect(snake.checkMoveTargeting(Moves.MudSlap).target).toBe(MoveTargets.Unit);

    battle.setWeather(Weathers.Sandstorm);

    expect(snake.checkMoveTargeting(Moves.MudSlap).target).toBe(MoveTargets.None);
    // Only Ground moves, and only its own
    expect(snake.checkMoveTargeting(Moves.Tackle).target).toBe(MoveTargets.Unit);
    expect(enemy.checkMoveTargeting(Moves.MudSlap).target).toBe(MoveTargets.Unit);
  });

  it('lands a widened Ground move on each enemy', () => {
    const { battle, teamA, teamB } = createBattle();
    pinRandom(battle, 0);
    const snake = createUnit(battle, teamA);
    const first = createUnit(battle, teamB);
    const second = createUnit(battle, teamB);

    snake.addAbility(Abilities.CoilBurrow);
    battle.setWeather(Weathers.Sandstorm);
    snake.triggerMove(Moves.MudSlap, unitTarget(first), 0);
    battle.tick(turns(1));

    expect(first.health).toBeLessThan(first.checkStat(Stats.HP, 0));
    expect(second.health).toBeLessThan(second.checkStat(Stats.HP, 0));
  });
});

describe('Throat Pouch', () => {
  it('casts Stockpile on itself for each Water move it lands', () => {
    const { battle, teamA, teamB } = createBattle();
    const bird = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);

    bird.addAbility(Abilities.ThroatPouch);

    dealDamage(bird, foe, Moves.Ember, 20, Types.Fire, MoveCategories.Special);
    battle.tick(turns(1));

    expect(bird.stages[Stages.Defense]).toBe(0);

    dealDamage(bird, foe, Moves.WaterGun, 20, Types.Water, MoveCategories.Special);
    battle.tick(turns(1));

    expect(bird.stages[Stages.Defense]).toBe(1);
    expect(bird.stages[Stages.SpecialDefense]).toBe(1);
  });
});

describe('Spearhead', () => {
  it('casts Aqua Jet at an enemy winding up a move at it, once every 6 seconds', () => {
    const { battle, teamA, teamB } = createBattle();
    pinRandom(battle, 0);
    const fish = createUnit(battle, teamA);
    const first = createUnit(battle, teamB);
    const second = createUnit(battle, teamB);
    const cues = countCues(battle, Abilities.Spearhead);

    fish.addAbility(Abilities.Spearhead);
    first.addMove(Moves.Tackle);
    second.addMove(Moves.Tackle);

    first.cast(Moves.Tackle, unitTarget(fish));
    // The wind-up is longer than the jet's flight, so it lands first
    battle.tick(FLIGHT);

    expect(cues()).toBe(1);

    const struck = first.health;

    expect(struck).toBeLessThan(first.checkStat(Stats.HP, 0));

    // Still waiting on the spear
    second.cast(Moves.Tackle, unitTarget(fish));
    battle.tick(FLIGHT);

    expect(cues()).toBe(1);
    expect(second.health).toBe(second.checkStat(Stats.HP, 0));

    battle.tick(SPEARHEAD_COOLDOWN);
    second.stopCast();
    second.finishCooldown(Moves.Tackle);
    second.cast(Moves.Tackle, unitTarget(fish));
    battle.tick(FLIGHT);

    expect(cues()).toBe(2);
  });

  it('ignores a move aimed at somebody else', () => {
    const { battle, teamA, teamB } = createBattle();
    const fish = createUnit(battle, teamA);
    const mate = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);
    const cues = countCues(battle, Abilities.Spearhead);

    fish.addAbility(Abilities.Spearhead);
    foe.addMove(Moves.Tackle);
    foe.cast(Moves.Tackle, unitTarget(mate));

    expect(cues()).toBe(0);
  });
});

describe('Venom Charge', () => {
  it('casts Charge each time poison bites an enemy, once every 6 seconds', () => {
    const { battle, teamA, teamB } = createBattle();
    const toxel = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);
    const cues = countCues(battle, Abilities.VenomCharge);

    toxel.addAbility(Abilities.VenomCharge);
    foe.addStatus(Statuses.Poisoned, {
      type: EffectType.Move,
      move: Moves.PoisonPowder,
      unit: toxel,
    });
    battle.tick(turns(1));
    battle.tick(FLIGHT);

    expect(foe.health).toBeLessThan(foe.checkStat(Stats.HP, 0));
    expect(cues()).toBe(1);
    expect(toxel.stages[Stages.SpecialDefense]).toBe(1);

    // The next bite falls inside the wait
    battle.tick(turns(1));

    expect(cues()).toBe(1);

    // One bite a turn, until the wait has run out
    for (let waited = 0; waited < VENOM_CHARGE_COOLDOWN; waited += turns(1)) {
      battle.tick(turns(1));
    }

    expect(cues()).toBe(2);
  });

  it('pays nothing for its own side being poisoned', () => {
    const { battle, teamA, teamB } = createBattle();
    const toxel = createUnit(battle, teamA);
    const mate = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);
    const cues = countCues(battle, Abilities.VenomCharge);

    toxel.addAbility(Abilities.VenomCharge);
    mate.addStatus(Statuses.Poisoned, {
      type: EffectType.Move,
      move: Moves.PoisonPowder,
      unit: foe,
    });
    battle.tick(turns(1));

    expect(mate.health).toBeLessThan(mate.checkStat(Stats.HP, 0));
    expect(cues()).toBe(0);
  });
});

describe('Cinder Coils', () => {
  it("burns up the target's berry with each Fire move it lands", () => {
    const { battle, teamA, teamB } = createBattle();
    const centipede = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);

    centipede.addAbility(Abilities.CinderCoils);
    foe.addItem(Items.OranBerry);

    dealDamage(centipede, foe, Moves.Tackle, 20, Types.Normal, MoveCategories.Physical);

    expect(foe.items[Items.OranBerry]).not.toBeUndefined();

    dealDamage(centipede, foe, Moves.Ember, 20, Types.Fire, MoveCategories.Special);

    expect(foe.items[Items.OranBerry]).toBeUndefined();
    expect(centipede.items[Items.OranBerry]).toBeUndefined();
  });

  it('leaves an item that is not a berry alone', () => {
    const { battle, teamA, teamB } = createBattle();
    const centipede = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);

    centipede.addAbility(Abilities.CinderCoils);
    foe.addItem(Items.Leftovers);

    dealDamage(centipede, foe, Moves.Ember, 20, Types.Fire, MoveCategories.Special);

    expect(foe.items[Items.Leftovers]).not.toBeUndefined();
  });
});

describe('Arm Lock', () => {
  it('catches whatever its contact move lands on in Octolock, one at a time', () => {
    const { battle, teamA, teamB } = createBattle();
    pinRandom(battle, 0);
    const octopus = createUnit(battle, teamA);
    const first = createUnit(battle, teamB);
    const second = createUnit(battle, teamB);

    octopus.addAbility(Abilities.ArmLock);

    // Not a touch
    dealDamage(octopus, first, Moves.Ember, 20, Types.Fire, MoveCategories.Special);
    battle.tick(turns(1));

    expect(first.status[Statuses.Cornered]).toBeUndefined();

    dealDamage(octopus, first, Moves.Tackle, 20, Types.Normal, MoveCategories.Physical);
    battle.tick(turns(1));

    expect(first.status[Statuses.Cornered]).toMatchObject({
      type: EffectType.Move,
      move: Moves.Octolock,
      unit: octopus,
    });

    // Already holding the first
    dealDamage(octopus, second, Moves.Tackle, 20, Types.Normal, MoveCategories.Physical);
    battle.tick(turns(1));

    expect(second.status[Statuses.Cornered]).toBeUndefined();
  });
});

describe('Live Spines', () => {
  it('casts Thunder Shock at whoever lands a contact move on it', () => {
    const { battle, teamA, teamB } = createBattle();
    pinRandom(battle, 0.99);
    const urchin = createUnit(battle, teamA);
    const toucher = createUnit(battle, teamB);
    const shooter = createUnit(battle, teamB);

    urchin.addAbility(Abilities.LiveSpines);

    dealDamage(shooter, urchin, Moves.Ember, 20, Types.Fire, MoveCategories.Special);
    dealDamage(toucher, urchin, Moves.Tackle, 20, Types.Normal, MoveCategories.Physical);
    battle.tick(turns(1));

    expect(toucher.health).toBeLessThan(toucher.checkStat(Stats.HP, 0));
    expect(shooter.health).toBe(shooter.checkStat(Stats.HP, 0));
  });
});
