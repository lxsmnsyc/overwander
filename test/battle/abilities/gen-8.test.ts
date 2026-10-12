import { describe, expect, it } from 'vitest';
import { EventPriority } from '../../../src/core/event-emitter';
import {
  DRAGONS_MAW_SCALE,
  GORILLA_TACTICS_SCALE,
  GULP_MISSILE_FRACTION,
  ICE_SCALES_SCALE,
  POWER_SPOT_SCALE,
  PUNK_ROCK_SCALE,
  PUNK_ROCK_TAKEN_SCALE,
  QUICK_DRAW_CHANCE,
  STEELY_SPIRIT_SCALE,
  TRANSISTOR_SCALE,
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
import { Statuses, TeamStatuses, Weathers } from '../../../src/data/ids/status';
import { createBattle, createUnit, pinRandom } from '../harness';
import { NONE_CAUSE, act, dealDamage } from './signature/helpers';

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

describe('Steely Spirit', () => {
  it("lifts its side's Steel moves, its own included, and nothing else", () => {
    const { battle, teamA, teamB } = createBattle();
    const cat = createUnit(battle, teamA);
    const ally = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);
    const at = unitTarget(foe);
    const head = ally.checkMovePower(Moves.IronHead, at) ?? 0;
    const tackle = ally.checkMovePower(Moves.Tackle, at);

    cat.addAbility(Abilities.SteelySpirit);

    expect(ally.checkMovePower(Moves.IronHead, at)).toBeCloseTo(head * STEELY_SPIRIT_SCALE, 5);
    expect(cat.checkMovePower(Moves.IronHead, at)).toBeCloseTo(head * STEELY_SPIRIT_SCALE, 5);
    expect(ally.checkMovePower(Moves.Tackle, at)).toBe(tackle);
    expect(foe.checkMovePower(Moves.IronHead, unitTarget(ally))).toBe(head);
  });
});

describe('Pastel Veil', () => {
  it('keeps poison off its side and cures a teammate as it gains the veil', () => {
    const { battle, teamA, teamB } = createBattle();
    const pony = createUnit(battle, teamA);
    const ally = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);

    ally.addStatus(Statuses.Poisoned, NONE_CAUSE);
    expect(ally.status[Statuses.Poisoned]).toBeDefined();

    pony.addAbility(Abilities.PastelVeil);

    expect(ally.status[Statuses.Poisoned]).toBeUndefined();

    ally.addStatus(Statuses.BadlyPoisoned, NONE_CAUSE);
    pony.addStatus(Statuses.Poisoned, NONE_CAUSE);
    foe.addStatus(Statuses.Poisoned, NONE_CAUSE);

    expect(ally.status[Statuses.BadlyPoisoned]).toBeUndefined();
    expect(pony.status[Statuses.Poisoned]).toBeUndefined();
    expect(foe.status[Statuses.Poisoned]).toBeDefined();
  });

  it('cures a poisoned teammate when it enters', () => {
    const { battle, teamA } = createBattle();
    const pony = createUnit(battle, teamA);
    const ally = createUnit(battle, teamA);

    pony.addAbility(Abilities.PastelVeil);
    // Out of the fight, it covers nobody
    pony.alive = false;
    ally.addStatus(Statuses.Poisoned, NONE_CAUSE);
    expect(ally.status[Statuses.Poisoned]).toBeDefined();

    pony.alive = true;
    pony.enter();

    expect(ally.status[Statuses.Poisoned]).toBeUndefined();
  });
});

describe('Quick Draw', () => {
  it('sometimes winds an attack up instantly', () => {
    const { battle, teamA, teamB } = createBattle();
    const slowpoke = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);
    const at = unitTarget(foe);

    slowpoke.addAbility(Abilities.QuickDraw);
    slowpoke.addMove(Moves.Tackle);

    pinRandom(battle, 1);
    slowpoke.cast(Moves.Tackle, at);
    expect(slowpoke.casting?.time.duration).toBeGreaterThan(0);
    slowpoke.stopCast();

    pinRandom(battle, QUICK_DRAW_CHANCE - 0.01);
    slowpoke.cast(Moves.Tackle, at);
    expect(slowpoke.casting?.time.duration).toBe(0);
  });

  it('never hurries a status move', () => {
    const { battle, teamA, teamB } = createBattle();
    const slowpoke = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);

    slowpoke.addAbility(Abilities.QuickDraw);
    slowpoke.addMove(Moves.Growl);
    pinRandom(battle, 0);
    slowpoke.cast(Moves.Growl, unitTarget(foe));

    expect(slowpoke.casting?.time.duration).toBeGreaterThan(0);
  });
});

describe('Curious Medicine', () => {
  it("resets its teammates' stages as it enters and leaves the foe's", () => {
    const { battle, teamA, teamB } = createBattle();
    const slowking = createUnit(battle, teamA);
    const ally = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);

    slowking.addAbility(Abilities.CuriousMedicine);
    ally.addStage(Stages.Attack, 2, NONE_CAUSE);
    ally.addStage(Stages.Defense, -1, NONE_CAUSE);
    slowking.addStage(Stages.Speed, 1, NONE_CAUSE);
    foe.addStage(Stages.Attack, 2, NONE_CAUSE);
    slowking.enter();

    expect(ally.stages[Stages.Attack]).toBe(0);
    expect(ally.stages[Stages.Defense]).toBe(0);
    expect(slowking.stages[Stages.Speed]).toBe(1);
    expect(foe.stages[Stages.Attack]).toBe(2);
  });
});

describe('Screen Cleaner', () => {
  it('takes every screen down on both sides as it enters', () => {
    const { battle, teamA, teamB } = createBattle();
    const mime = createUnit(battle, teamA);

    createUnit(battle, teamB);
    teamA.addStatus(TeamStatuses.Reflect, NONE_CAUSE);
    teamB.addStatus(TeamStatuses.LightScreen, NONE_CAUSE);
    teamB.addStatus(TeamStatuses.AuroraVeil, NONE_CAUSE);
    mime.addAbility(Abilities.ScreenCleaner);
    mime.enter();

    expect(teamA.status[TeamStatuses.Reflect]).toBeUndefined();
    expect(teamB.status[TeamStatuses.LightScreen]).toBeUndefined();
    expect(teamB.status[TeamStatuses.AuroraVeil]).toBeUndefined();
  });
});

describe('Gorilla Tactics', () => {
  it('pays 1.5x Attack for locking into its first move until it leaves', () => {
    const { battle, teamA, teamB } = createBattle();
    const ape = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);
    const at = unitTarget(foe);
    const attack = ape.checkStat(Stats.Attack, 0);

    ape.addMove(Moves.Tackle);
    ape.addMove(Moves.Ember);
    ape.addAbility(Abilities.GorillaTactics);

    expect(ape.checkStat(Stats.Attack, 0)).toBeCloseTo(attack * GORILLA_TACTICS_SCALE, 5);

    ape.cast(Moves.Tackle, at);
    ape.stopCast();

    expect(ape.checkCanCast(Moves.Ember, at)).toBe(false);
    expect(ape.checkCanCast(Moves.Tackle, at)).toBe(true);

    ape.leave();

    expect(ape.checkCanCast(Moves.Ember, at)).toBe(true);
  });
});

describe('Wandering Spirit', () => {
  it("trades itself for the attacker's ability on a touch, never on a shot", () => {
    const { battle, teamA, teamB } = createBattle();
    const ghost = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);

    pinRandom(battle, 1);
    ghost.addAbility(Abilities.WanderingSpirit);
    foe.addAbility(Abilities.Blaze);

    dealDamage(foe, ghost, ...SWIFT);

    expect(ghost.hasAbility(Abilities.WanderingSpirit)).toBe(true);
    expect(foe.hasAbility(Abilities.Blaze)).toBe(true);

    dealDamage(foe, ghost, ...TACKLE);

    expect(ghost.hasAbility(Abilities.WanderingSpirit)).toBe(false);
    expect(ghost.hasAbility(Abilities.Blaze)).toBe(true);
    expect(foe.hasAbility(Abilities.WanderingSpirit)).toBe(true);
    expect(foe.hasAbility(Abilities.Blaze)).toBe(false);
  });

  it('leaves a Boss as it is', () => {
    const { battle, teamA, teamB } = createBattle();
    const ghost = createUnit(battle, teamA);
    const boss = createUnit(battle, teamB);

    pinRandom(battle, 1);
    ghost.addAbility(Abilities.WanderingSpirit);
    boss.addAbility(Abilities.Boss);

    dealDamage(boss, ghost, ...TACKLE);

    expect(ghost.hasAbility(Abilities.WanderingSpirit)).toBe(true);
    expect(boss.hasAbility(Abilities.Boss)).toBe(true);
    expect(boss.hasAbility(Abilities.WanderingSpirit)).toBe(false);
  });
});

describe('Intrepid Sword and Dauntless Shield', () => {
  for (const [ability, stage] of [
    [Abilities.IntrepidSword, Stages.Attack],
    [Abilities.DauntlessShield, Stages.Defense],
  ] as const) {
    it(`raises its stage on the first entry only (${ability})`, () => {
      const { battle, teamA } = createBattle();
      const wolf = createUnit(battle, teamA);

      wolf.addAbility(ability);
      wolf.enter();

      expect(wolf.stages[stage]).toBe(1);

      wolf.leave();
      wolf.resetStages(NONE_CAUSE);
      wolf.enter();

      expect(wolf.stages[stage]).toBe(0);
    });
  }
});

describe('Unseen Fist', () => {
  it('walks its contact moves through a guard and nothing else', () => {
    const { battle, teamA, teamB } = createBattle();
    const bear = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);
    const at = unitTarget(foe);

    foe.addStatus(Statuses.Protected, NONE_CAUSE);

    expect(bear.checkMoveImmunity(Moves.Tackle, at, Types.Normal)).toBe(true);

    bear.addAbility(Abilities.UnseenFist);

    expect(bear.checkMoveImmunity(Moves.Ember, at, Types.Fire)).toBe(true);
    expect(bear.checkMoveImmunity(Moves.Tackle, at, Types.Normal)).toBe(false);
    expect(foe.status[Statuses.Protected]).toBeUndefined();
  });
});

describe("Transistor and Dragon's Maw", () => {
  for (const [ability, move, scale] of [
    [Abilities.Transistor, Moves.Thunderbolt, TRANSISTOR_SCALE],
    [Abilities.DragonsMaw, Moves.DragonPulse, DRAGONS_MAW_SCALE],
  ] as const) {
    it(`lifts its own type and nothing else (${ability})`, () => {
      const { battle, teamA, teamB } = createBattle();
      const regi = createUnit(battle, teamA);
      const foe = createUnit(battle, teamB);
      const at = unitTarget(foe);
      const typed = regi.checkMovePower(move, at) ?? 0;
      const tackle = regi.checkMovePower(Moves.Tackle, at);

      regi.addAbility(ability);

      expect(regi.checkMovePower(move, at)).toBeCloseTo(typed * scale, 5);
      expect(regi.checkMovePower(Moves.Tackle, at)).toBe(tackle);
    });
  }
});

describe('Chilling Neigh and Grim Neigh', () => {
  for (const [ability, stage] of [
    [Abilities.ChillingNeigh, Stages.Attack],
    [Abilities.GrimNeigh, Stages.SpecialAttack],
  ] as const) {
    it(`rises on a knockout and not on a blow that leaves it standing (${ability})`, () => {
      const { battle, teamA, teamB } = createBattle();
      const horse = createUnit(battle, teamA);
      const foe = createUnit(battle, teamB);

      pinRandom(battle, 1);
      horse.addAbility(ability);

      dealDamage(horse, foe, ...TACKLE);
      expect(foe.alive).toBe(true);
      expect(horse.stages[stage]).toBe(0);

      foe.setHealth(1);
      dealDamage(horse, foe, ...TACKLE);

      expect(foe.alive).toBe(false);
      expect(horse.stages[stage]).toBe(1);
    });
  }
});
