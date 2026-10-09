import { describe, expect, it } from 'vitest';
import { EventPriority } from '../../../src/core/event-emitter';
import {
  GULP_MISSILE_FRACTION,
  ICE_SCALES_SCALE,
  POWER_SPOT_SCALE,
  PUNK_ROCK_SCALE,
  PUNK_ROCK_TAKEN_SCALE,
} from '../../../src/battle/abilities/gen-8';
import { BattleEvents, EffectType, MoveTargetType } from '../../../src/battle/events';
import turns from '../../../src/battle/turn';
import type Unit from '../../../src/battle/unit';
import { unitTarget } from '../../../src/battle/utils';
import { Stages, Stats } from '../../../src/data/constants/stats';
import { Types } from '../../../src/data/constants/types';
import Abilities from '../../../src/data/ids/abilities';
import { Items } from '../../../src/data/ids/items';
import { MoveCategories, Moves } from '../../../src/data/ids/moves';
import { Species } from '../../../src/data/ids/species';
import { Statuses, Weathers } from '../../../src/data/ids/status';
import { createBattle, createUnit, pinRandom } from '../harness';
import { act, dealDamage } from './signature/helpers';

type Blow = readonly [Moves, number, Types, MoveCategories];

const TACKLE: Blow = [Moves.Tackle, 80, Types.Normal, MoveCategories.Physical];
const SWIFT: Blow = [Moves.Swift, 80, Types.Normal, MoveCategories.Special];
const HYPER_VOICE: Blow = [Moves.HyperVoice, 80, Types.Normal, MoveCategories.Special];

const NONE_TARGET = { type: MoveTargetType.None } as const;

describe('Libero', () => {
  it('takes the type of the move it is about to use', () => {
    const { battle, teamA, teamB } = createBattle();
    const rabbit = createUnit(battle, teamA, [Types.Normal]);
    const foe = createUnit(battle, teamB);

    rabbit.addAbility(Abilities.Libero);
    rabbit.triggerMove(Moves.Ember, unitTarget(foe), 0);

    expect([...rabbit.types]).toEqual([Types.Fire]);
  });
});

describe('Punk Rock', () => {
  it('sings its sound moves 1.3x and hears sound at 0.5x', () => {
    const { battle, teamA, teamB } = createBattle();
    const punk = createUnit(battle, teamA);
    const plain = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);
    const at = unitTarget(foe);

    pinRandom(battle, 1);

    const voice = punk.checkMovePower(Moves.HyperVoice, at) ?? 0;
    const tackle = punk.checkMovePower(Moves.Tackle, at);
    const heard = dealDamage(foe, plain, ...HYPER_VOICE);

    plain.setHealth(plain.checkStat(Stats.HP, 0));
    punk.addAbility(Abilities.PunkRock);
    plain.addAbility(Abilities.PunkRock);

    expect(punk.checkMovePower(Moves.HyperVoice, at)).toBeCloseTo(voice * PUNK_ROCK_SCALE, 5);
    expect(punk.checkMovePower(Moves.Tackle, at)).toBe(tackle);
    expect(dealDamage(foe, plain, ...HYPER_VOICE)).toBeCloseTo(heard * PUNK_ROCK_TAKEN_SCALE, 0);
  });
});

describe('Ice Scales', () => {
  it('halves special blows and leaves physical ones alone', () => {
    const { battle, teamA, teamB } = createBattle();
    const moth = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);
    const max = moth.checkStat(Stats.HP, 0);

    pinRandom(battle, 1);

    const special = dealDamage(foe, moth, ...SWIFT);

    moth.setHealth(max);

    const physical = dealDamage(foe, moth, ...TACKLE);

    moth.setHealth(max);
    moth.addAbility(Abilities.IceScales);

    expect(dealDamage(foe, moth, ...SWIFT)).toBeCloseTo(special * ICE_SCALES_SCALE, 0);
    moth.setHealth(max);
    expect(dealDamage(foe, moth, ...TACKLE)).toBe(physical);
  });
});

describe('Power Spot', () => {
  it('lifts every move a teammate throws and never its own', () => {
    const { battle, teamA, teamB } = createBattle();
    const stone = createUnit(battle, teamA);
    const ally = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);
    const at = unitTarget(foe);
    const tackle = ally.checkMovePower(Moves.Tackle, at) ?? 0;
    const ember = ally.checkMovePower(Moves.Ember, at) ?? 0;

    stone.addAbility(Abilities.PowerSpot);

    expect(ally.checkMovePower(Moves.Tackle, at)).toBeCloseTo(tackle * POWER_SPOT_SCALE, 5);
    expect(ally.checkMovePower(Moves.Ember, at)).toBeCloseTo(ember * POWER_SPOT_SCALE, 5);
    expect(stone.checkMovePower(Moves.Tackle, at)).toBe(tackle);
    // The other side gets nothing from it
    expect(foe.checkMovePower(Moves.Tackle, unitTarget(ally))).toBe(tackle);
  });
});

describe('Stalwart and Propeller Tail', () => {
  for (const ability of [Abilities.Stalwart, Abilities.PropellerTail]) {
    it(`walks past a rod and a centre (${ability})`, () => {
      const { battle, teamA, teamB } = createBattle();
      const holder = createUnit(battle, teamA);
      const aimed = createUnit(battle, teamB);
      const rod = createUnit(battle, teamB);
      const guard = createUnit(battle, teamB);

      rod.addAbility(Abilities.LightningRod);
      holder.addMove(Moves.ThunderShock);

      // Without the ability, the rod draws it and then the centre does
      expect(holder.checkMoveRedirect(Moves.ThunderShock, unitTarget(aimed))).toEqual(
        unitTarget(rod),
      );
      guard.triggerMoveEffect(Moves.FollowMe, NONE_TARGET, 0);
      holder.cast(Moves.ThunderShock, unitTarget(aimed));
      expect(holder.casting?.target).toEqual(unitTarget(guard));
      holder.stopCast();

      holder.addAbility(ability);
      holder.cast(Moves.ThunderShock, unitTarget(aimed));

      expect(holder.casting?.target).toEqual(unitTarget(aimed));
      expect(holder.checkMoveRedirect(Moves.ThunderShock, unitTarget(aimed))).toEqual(
        unitTarget(aimed),
      );
    });
  }
});

describe('Cotton Down', () => {
  it('slows every other pokemon on the field when a blow lands on it', () => {
    const { battle, teamA, teamB } = createBattle();
    const cotton = createUnit(battle, teamA);
    const ally = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);

    pinRandom(battle, 1);
    cotton.addAbility(Abilities.CottonDown);
    dealDamage(foe, cotton, ...TACKLE);

    expect(foe.stages[Stages.Speed]).toBe(-1);
    expect(ally.stages[Stages.Speed]).toBe(-1);
    expect(cotton.stages[Stages.Speed]).toBe(0);
  });
});

describe('Ball Fetch', () => {
  it('catches the first item flung and nothing after', () => {
    const { battle, teamA, teamB } = createBattle();
    const dog = createUnit(battle, teamA);
    const thrower = createUnit(battle, teamB);

    dog.addAbility(Abilities.BallFetch);
    thrower.enter();
    dog.enter();

    thrower.addItem(Items.OranBerry);
    thrower.attack(dog, Moves.Fling, 1, Types.Dark, 0, 0);
    battle.tick(1);

    expect(thrower.items[Items.OranBerry]).toBeUndefined();
    expect(dog.items[Items.OranBerry]).toBe(true);

    // Once a fight: a second throw falls where it lands
    dog.removeItem(Items.OranBerry, { type: EffectType.None });
    thrower.addItem(Items.SitrusBerry);
    thrower.attack(dog, Moves.Fling, 1, Types.Dark, 0, 0);
    battle.tick(1);

    expect(dog.items[Items.SitrusBerry]).toBeUndefined();
  });
});

describe('Gulp Missile', () => {
  function cramorant(): {
    battle: ReturnType<typeof createBattle>['battle'];
    bird: Unit;
    foe: Unit;
  } {
    const { battle, teamA, teamB } = createBattle();
    const bird = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);

    pinRandom(battle, 1);
    bird.setSpecies(Species.Cramorant);
    bird.setHealth(bird.checkStat(Stats.HP, 0));
    bird.addAbility(Abilities.GulpMissile);
    return { battle, bird, foe };
  }

  it('comes up from a Surf with the small catch and spits it for Defense', () => {
    const { bird, foe } = cramorant();
    const max = foe.checkStat(Stats.HP, 0);

    bird.triggerMove(Moves.Surf, unitTarget(foe), 0);
    expect(bird.species).toBe(Species.CramorantGulping);

    foe.setHealth(max);
    dealDamage(foe, bird, ...TACKLE);

    expect(bird.species).toBe(Species.Cramorant);
    expect(foe.health).toBeCloseTo(max - max * GULP_MISSILE_FRACTION, 5);
    expect(foe.stages[Stages.Defense]).toBe(-1);
  });

  it('comes up from a Dive at 1/2 HP with the big catch and paralyses with it', () => {
    const { bird, foe } = cramorant();

    bird.setHealth(bird.checkStat(Stats.HP, 0) / 2);
    bird.triggerMove(Moves.Dive, unitTarget(foe), 0);
    expect(bird.species).toBe(Species.CramorantGorging);

    dealDamage(foe, bird, ...TACKLE);

    expect(bird.species).toBe(Species.Cramorant);
    expect(foe.status[Statuses.Paralyzed]).toBeDefined();
  });
});

describe('Ice Face', () => {
  it('takes the first physical blow, and the hail freezes it back over', () => {
    const { battle, teamA, teamB } = createBattle();
    const penguin = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);

    pinRandom(battle, 1);
    penguin.setSpecies(Species.Eiscue);
    penguin.setHealth(penguin.checkStat(Stats.HP, 0));
    penguin.addAbility(Abilities.IceFace);

    // Special blows go straight through the ice
    expect(dealDamage(foe, penguin, ...SWIFT)).toBeGreaterThan(0);
    expect(penguin.species).toBe(Species.Eiscue);

    expect(dealDamage(foe, penguin, ...TACKLE)).toBe(0);
    expect(penguin.species).toBe(Species.EiscueNoice);
    expect(dealDamage(foe, penguin, ...TACKLE)).toBeGreaterThan(0);

    battle.setWeather(Weathers.Hail);

    expect(penguin.species).toBe(Species.Eiscue);
    expect(dealDamage(foe, penguin, ...TACKLE)).toBe(0);
  });
});

describe('Hunger Switch', () => {
  it('swings its mood each time it acts', () => {
    const { battle, teamA, teamB } = createBattle();
    const morpeko = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);
    const at = unitTarget(foe);

    morpeko.setSpecies(Species.Morpeko);
    morpeko.addAbility(Abilities.HungerSwitch);

    expect(morpeko.checkMoveType(Moves.AuraWheel, at)).toBe(Types.Electric);

    act(battle, morpeko);

    expect(morpeko.species).toBe(Species.MorpekoHangry);
    expect(morpeko.checkMoveType(Moves.AuraWheel, at)).toBe(Types.Dark);

    act(battle, morpeko);

    expect(morpeko.species).toBe(Species.Morpeko);
  });

  it('leaves anybody but a Morpeko as it is', () => {
    const { battle, teamA } = createBattle();
    const other = createUnit(battle, teamA);
    const species = other.species;
    let cued = 0;

    other.addAbility(Abilities.HungerSwitch);
    battle.on(BattleEvents.UnitTriggerAbility, EventPriority.Post, () => {
      cued += 1;
    });
    act(battle, other);
    battle.tick(turns(1));

    expect(other.species).toBe(species);
    expect(cued).toBe(0);
  });
});
