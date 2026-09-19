import { describe, expect, it } from 'vitest';
import { BattleEvents, EffectType, MoveTargetType } from '../../../src/battle/events';
import type Battle from '../../../src/battle/core';
import type Unit from '../../../src/battle/unit';
import Abilities from '../../../src/data/ids/abilities';
import { Items } from '../../../src/data/ids/items';
import { Stages, Stats } from '../../../src/data/constants/stats';
import { Types } from '../../../src/data/constants/types';
import { MoveCategories, Moves } from '../../../src/data/ids/moves';
import { Statuses, Terrains } from '../../../src/data/ids/status';
import { BattleModes } from '../../../src/battle/core';
import {
  GRASSY_HEAL_SHARE,
  TERRAIN_BLUNTING,
  TERRAIN_BOOST,
} from '../../../src/battle/mechanics/terrain';
import { TERRAIN_DURATION } from '../../../src/battle/moves/terrain';
import { act } from '../abilities/signature/helpers';
import turns from '../../../src/battle/turn';
import { KINGS_SHIELD_STAGES, SPIKY_SHIELD_SHARE } from '../../../src/battle/moves/protect';
import { STICKY_WEB_STAGES, webOver } from '../../../src/battle/moves/sticky-web';
import { FELL_STINGER_STAGES } from '../../../src/battle/moves/fell-stinger';
import { GEOMANCY_VALUE } from '../../../src/battle/moves/geomancy';
import { POWDER_BLAST_SHARE } from '../../../src/battle/moves/powder';
import { HAPPY_HOUR_FACTOR, PAY_DAY_COINS_PER_LEVEL } from '../../../src/battle/moves/pay-day';
import { MULTI_HIT_MOVES } from '../../../src/data/moves/multi-hit';
import { RECOIL_MOVES } from '../../../src/data/moves/recoil';
import { getMoveData } from '../../../src/data/moves';
import { createBattle, createUnit, pinRandom } from '../harness';

const NONE_TARGET = { type: MoveTargetType.None } as const;

function unitTarget(unit: Unit): { readonly type: MoveTargetType.Unit; readonly unit: Unit } {
  return { type: MoveTargetType.Unit, unit } as const;
}

/** What the chart comes to for a move against every type the target holds */
function effectiveness(
  battle: Battle,
  attacker: Unit,
  target: Unit,
  move: Moves,
  type: Types,
): number {
  let total = 1;

  for (const defending of target.types) {
    const event = {
      id: 'UnitAttackResolveEffectiveness',
      disabled: false,
      parent: {
        id: 'UnitAttack',
        disabled: false,
        source: attacker,
        target,
        move,
        value: 0,
        category: MoveCategories.Physical,
        type,
        flags: 0,
        success: false,
      },
      defendingType: defending,
      multiplier: 1,
    };

    battle.emit(BattleEvents.UnitAttackResolveEffectiveness, event);
    total *= event.multiplier;
  }
  return total;
}

describe("Kalos's moves", () => {
  describe('the ones that ride what was already there', () => {
    it('drops two stats with Noble Roar and one with Play Nice', () => {
      const { battle, teamA, teamB } = createBattle();
      const roar = createUnit(battle, teamA);
      const target = createUnit(battle, teamB);

      pinRandom(battle, 0);
      roar.enter();
      target.enter();

      roar.triggerMoveEffect(Moves.NobleRoar, unitTarget(target), 0);
      expect(target.stages[Stages.Attack]).toBe(-1);
      expect(target.stages[Stages.SpecialAttack]).toBe(-1);

      roar.triggerMoveEffect(Moves.PlayNice, unitTarget(target), 0);
      expect(target.stages[Stages.Attack]).toBe(-2);
    });

    it('takes two stages with Eerie Impulse and lends one with Aromatic Mist', () => {
      const { battle, teamA, teamB } = createBattle();
      const caster = createUnit(battle, teamA);
      const mate = createUnit(battle, teamA);
      const target = createUnit(battle, teamB);

      pinRandom(battle, 0);
      caster.enter();
      mate.enter();
      target.enter();

      caster.triggerMoveEffect(Moves.EerieImpulse, unitTarget(target), 0);
      expect(target.stages[Stages.SpecialAttack]).toBe(-2);

      caster.triggerMoveEffect(Moves.AromaticMist, unitTarget(mate), 0);
      expect(mate.stages[Stages.SpecialDefense]).toBe(1);
    });

    it('lands the secondary stages on the side each one names', () => {
      const { battle, teamA, teamB } = createBattle();
      const striker = createUnit(battle, teamA);
      const target = createUnit(battle, teamB);

      pinRandom(battle, 0);
      striker.enter();
      target.enter();

      striker.triggerMoveEffect(Moves.MysticalFire, unitTarget(target), 0);
      expect(target.stages[Stages.SpecialAttack]).toBe(-1);

      striker.triggerMoveEffect(Moves.PowerUpPunch, unitTarget(target), 0);
      expect(striker.stages[Stages.Attack]).toBe(1);

      // A fresh target: three blows in a row fell the first one, and a
      // move that lands on nothing pays nothing
      const second = createUnit(battle, teamB);

      second.enter();
      striker.triggerMoveEffect(Moves.DragonAscent, unitTarget(second), 0);
      expect(striker.stages[Stages.Defense]).toBe(-1);
      expect(striker.stages[Stages.SpecialDefense]).toBe(-1);
    });

    it('paralyses with every Nuzzle', () => {
      const { battle, teamA, teamB } = createBattle();
      const mouse = createUnit(battle, teamA);
      const target = createUnit(battle, teamB);

      pinRandom(battle, 0.99);
      mouse.enter();
      target.enter();

      mouse.triggerMoveEffect(Moves.Nuzzle, unitTarget(target), 0);
      expect(target.status[Statuses.Paralyzed]).toBeDefined();
    });

    it('binds with Infestation and holds everything opposite with Thousand Waves', () => {
      const { battle, teamA, teamB } = createBattle();
      const caster = createUnit(battle, teamA);
      const target = createUnit(battle, teamB);

      pinRandom(battle, 0.99);
      caster.enter();
      target.enter();

      caster.triggerMoveEffect(Moves.Infestation, unitTarget(target), 0);
      expect(target.status[Statuses.Trapped]).toBeDefined();

      caster.triggerMoveEffect(Moves.ThousandWaves, unitTarget(target), 0);
      expect(target.status[Statuses.Cornered]).toBeDefined();
    });

    it('drains three quarters with Draining Kiss and half with Parabolic Charge', () => {
      const { battle, teamA, teamB } = createBattle();
      const drainer = createUnit(battle, teamA);
      const target = createUnit(battle, teamB);

      pinRandom(battle, 1);
      drainer.enter();
      target.enter();

      const cause = { type: EffectType.Move, move: Moves.DrainingKiss, unit: drainer } as const;
      const max = drainer.checkStat(Stats.HP, 0);

      drainer.setHealth(max / 2);
      drainer.damage(cause, target, 40, 0);
      expect(drainer.health).toBe(max / 2 + 30);

      drainer.setHealth(max / 2);
      drainer.damage(
        { type: EffectType.Move, move: Moves.ParabolicCharge, unit: drainer },
        target,
        40,
        0,
      );
      expect(drainer.health).toBe(max / 2 + 20);
    });

    it('never finishes anything off with Hold Back', () => {
      const { battle, teamA, teamB } = createBattle();
      const holder = createUnit(battle, teamA);
      const target = createUnit(battle, teamB);

      holder.enter();
      target.enter();

      holder.damage(
        { type: EffectType.Move, move: Moves.HoldBack, unit: holder },
        target,
        target.health * 2,
        0,
      );
      expect(target.health).toBe(1);
    });

    it('walks Hyperspace Hole through a guard and leaves no guard behind', () => {
      const { battle, teamA, teamB } = createBattle();
      const hoopa = createUnit(battle, teamA);
      const guard = createUnit(battle, teamB);

      pinRandom(battle, 1);
      hoopa.enter();
      guard.enter();

      guard.triggerMoveEffect(Moves.Protect, NONE_TARGET, 0);
      expect(guard.status[Statuses.Protected]).toBeDefined();

      const whole = guard.health;

      hoopa.triggerMoveTarget(Moves.HyperspaceHole, unitTarget(guard), 0);
      expect(guard.health).toBeLessThan(whole);
      expect(guard.status[Statuses.Protected]).toBeUndefined();
    });

    it('steps off the field on the first step of Phantom Force', () => {
      const { battle, teamA, teamB } = createBattle();
      const ghost = createUnit(battle, teamA);
      const target = createUnit(battle, teamB);

      pinRandom(battle, 1);
      ghost.enter();
      target.enter();

      ghost.triggerMoveEffect(Moves.PhantomForce, unitTarget(target), 1);
      expect(ghost.status[Statuses.Invulnerable]).toBeDefined();
    });

    it('keeps the numbers each table is read by', () => {
      expect(RECOIL_MOVES[Moves.LightOfRuin]).toBe(1 / 2);
      expect(MULTI_HIT_MOVES[Moves.WaterShuriken]).toEqual({ min: 2, max: 5 });
      expect(getMoveData(Moves.WaterShuriken).priority).toBe(1);
      expect(getMoveData(Moves.BabyDollEyes).priority).toBe(1);

      // Never missing is written as having no accuracy at all
      expect(getMoveData(Moves.DisarmingVoice).accuracy).toBeUndefined();
      expect(getMoveData(Moves.HyperspaceHole).accuracy).toBeUndefined();
    });
  });

  describe('the guards and the field', () => {
    it('costs whatever touches a Spiky Shield an eighth of its HP', () => {
      const { battle, teamA, teamB } = createBattle();
      const guard = createUnit(battle, teamA);
      const striker = createUnit(battle, teamB);

      pinRandom(battle, 1);
      guard.enter();
      striker.enter();

      guard.triggerMoveEffect(Moves.SpikyShield, NONE_TARGET, 0);

      const whole = guard.health;
      const max = striker.checkStat(Stats.HP, 0);

      striker.triggerMoveTarget(Moves.Tackle, unitTarget(guard), 0);
      expect(guard.health).toBe(whole);
      expect(striker.health).toBe(max - Math.floor(max * SPIKY_SHIELD_SHARE));
    });

    it("drops the Attack of whatever touches a King's Shield, and lets status moves by", () => {
      const { battle, teamA, teamB } = createBattle();
      const guard = createUnit(battle, teamA);
      const striker = createUnit(battle, teamB);

      pinRandom(battle, 1);
      guard.enter();
      striker.enter();

      guard.triggerMoveEffect(Moves.KingsShield, NONE_TARGET, 0);

      const whole = guard.health;

      striker.triggerMoveTarget(Moves.Tackle, unitTarget(guard), 0);
      expect(guard.health).toBe(whole);
      expect(striker.stages[Stages.Attack]).toBe(-KINGS_SHIELD_STAGES);

      // Raised against blows, so a status move walks past and keeps it up
      expect(striker.checkMoveImmunity(Moves.Growl, unitTarget(guard), Types.Normal)).toBe(false);
      expect(guard.status[Statuses.Protected]).toBeDefined();
    });

    it('turns blows away from the whole team with Mat Block, and only on arrival', () => {
      const { battle, teamA, teamB } = createBattle();
      const guard = createUnit(battle, teamA);
      const mate = createUnit(battle, teamA);
      const enemy = createUnit(battle, teamB);

      guard.addMove(Moves.MatBlock);
      guard.addMove(Moves.FakeOut);
      guard.enter();
      mate.enter();
      enemy.enter();

      expect(guard.checkCanCast(Moves.MatBlock, NONE_TARGET)).toBe(true);
      guard.triggerMove(Moves.MatBlock, { type: MoveTargetType.Team, team: teamA }, 0);
      guard.triggerMoveEffect(Moves.MatBlock, { type: MoveTargetType.Team, team: teamA }, 0);

      expect(enemy.checkMoveImmunity(Moves.Tackle, unitTarget(mate), Types.Normal)).toBe(true);
      expect(enemy.checkMoveImmunity(Moves.Growl, unitTarget(mate), Types.Normal)).toBe(false);

      // The surprise is spent, and Fake Out shares it
      expect(guard.checkCanCast(Moves.MatBlock, NONE_TARGET)).toBe(false);
      expect(guard.checkCanCast(Moves.FakeOut, unitTarget(enemy))).toBe(false);

      battle.tick(turns(1) + 1);
      expect(enemy.checkMoveImmunity(Moves.Tackle, unitTarget(mate), Types.Normal)).toBe(false);
    });

    it('turns status moves away from the whole team with Crafty Shield', () => {
      const { battle, teamA, teamB } = createBattle();
      const guard = createUnit(battle, teamA);
      const mate = createUnit(battle, teamA);
      const enemy = createUnit(battle, teamB);

      guard.triggerMoveEffect(Moves.CraftyShield, { type: MoveTargetType.Team, team: teamA }, 0);

      expect(enemy.checkMoveImmunity(Moves.Growl, unitTarget(mate), Types.Normal)).toBe(true);
      expect(enemy.checkMoveImmunity(Moves.Tackle, unitTarget(mate), Types.Normal)).toBe(false);
    });

    it('slows what walks onto a Sticky Web, spares what flies, and blows away in a Defog', () => {
      const { battle, teamA, teamB } = createBattle();
      const weaver = createUnit(battle, teamA);
      const walker = createUnit(battle, teamB);
      const bird = createUnit(battle, teamB, [Types.Flying]);

      weaver.enter();
      weaver.triggerMoveEffect(Moves.StickyWeb, { type: MoveTargetType.Team, team: teamB }, 0);
      expect(webOver(teamB)).toBe(true);

      walker.enter();
      bird.enter();
      expect(walker.stages[Stages.Speed]).toBe(-STICKY_WEB_STAGES);
      expect(bird.stages[Stages.Speed]).toBe(0);

      weaver.triggerMoveEffect(Moves.Defog, unitTarget(walker), 0);
      expect(webOver(teamB)).toBe(false);
    });

    it('drops two stats once with Parting Shot, then walks off', () => {
      const { battle, teamA, teamB } = createBattle();
      const leaver = createUnit(battle, teamA);
      const target = createUnit(battle, teamB);

      createUnit(battle, teamA).enter();
      leaver.enter();
      target.enter();

      leaver.triggerMoveEffect(Moves.PartingShot, unitTarget(target), 1);
      expect(target.stages[Stages.Attack]).toBe(-1);
      expect(target.stages[Stages.SpecialAttack]).toBe(-1);
      expect(leaver.status[Statuses.Switching]).toBeUndefined();

      leaver.triggerMoveEffect(Moves.PartingShot, unitTarget(target), 0);
      expect(target.stages[Stages.Attack]).toBe(-1);
      expect(leaver.status[Statuses.Switching]).toBeDefined();
    });

    it('holds everybody on the field for a turn with Fairy Lock, except a Ghost', () => {
      const { battle, teamA, teamB } = createBattle();
      const fairy = createUnit(battle, teamA);
      const enemy = createUnit(battle, teamB);
      const ghost = createUnit(battle, teamB, [Types.Ghost]);

      fairy.enter();
      enemy.enter();
      ghost.enter();

      expect(enemy.checkEscape()).toBe(true);
      fairy.triggerMoveEffect(Moves.FairyLock, NONE_TARGET, 0);
      expect(enemy.checkEscape()).toBe(false);
      expect(fairy.checkEscape()).toBe(false);
      expect(ghost.checkEscape()).toBe(true);

      battle.tick(turns(1) + 1);
      expect(enemy.checkEscape()).toBe(true);
    });
  });

  describe('the ones with rules of their own', () => {
    it('lands Flying Press as both of its types', () => {
      const { battle, teamA, teamB } = createBattle();
      const presser = createUnit(battle, teamA);
      // Fighting is 2x on Normal and Flying is 2x on Grass
      const target = createUnit(battle, teamB, [Types.Normal, Types.Grass]);

      expect(effectiveness(battle, presser, target, Moves.FlyingPress, Types.Fighting)).toBe(4);
      expect(effectiveness(battle, presser, target, Moves.CloseCombat, Types.Fighting)).toBe(2);
    });

    it('lands Freeze-Dry at 2x on Water', () => {
      const { battle, teamA, teamB } = createBattle();
      const freezer = createUnit(battle, teamA);
      const water = createUnit(battle, teamB, [Types.Water]);

      expect(effectiveness(battle, freezer, water, Moves.FreezeDry, Types.Ice)).toBe(2);
      expect(effectiveness(battle, freezer, water, Moves.IceBeam, Types.Ice)).toBe(0.5);
    });

    it('reaches a flyer with Thousand Arrows and brings it down', () => {
      const { battle, teamA, teamB } = createBattle();
      const archer = createUnit(battle, teamA);
      const bird = createUnit(battle, teamB, [Types.Flying]);

      pinRandom(battle, 1);
      archer.enter();
      bird.enter();

      expect(archer.checkMoveImmunity(Moves.ThousandArrows, unitTarget(bird), Types.Ground)).toBe(
        false,
      );
      expect(archer.checkMoveImmunity(Moves.Earthquake, unitTarget(bird), Types.Ground)).toBe(true);
      expect(effectiveness(battle, archer, bird, Moves.ThousandArrows, Types.Ground)).toBe(1);

      const whole = bird.health;

      archer.triggerMoveEffect(Moves.ThousandArrows, unitTarget(bird), 0);
      expect(bird.health).toBeLessThan(whole);
      expect(bird.status[Statuses.Grounded]).toBeDefined();
    });

    it('lands a Ground move on a flyer once Smack Down has brought it down', () => {
      const { battle, teamA, teamB } = createBattle();
      const striker = createUnit(battle, teamA);
      const bird = createUnit(battle, teamB, [Types.Flying]);

      pinRandom(battle, 1);
      striker.enter();
      bird.enter();

      // Up in the air, the chart's immunity stands
      expect(effectiveness(battle, striker, bird, Moves.Earthquake, Types.Ground)).toBe(0);

      striker.triggerMoveEffect(Moves.SmackDown, unitTarget(bird), 0);
      expect(bird.status[Statuses.Grounded]).toBeDefined();
      expect(effectiveness(battle, striker, bird, Moves.Earthquake, Types.Ground)).toBe(1);

      const whole = bird.health;

      striker.triggerMoveEffect(Moves.Earthquake, unitTarget(bird), 0);
      expect(bird.health).toBeLessThan(whole);
    });

    it('sharpens the user when Fell Stinger finishes something', () => {
      const { battle, teamA, teamB } = createBattle();
      const bee = createUnit(battle, teamA);
      const target = createUnit(battle, teamB);

      bee.enter();
      target.enter();

      const cause = { type: EffectType.Move, move: Moves.FellStinger, unit: bee } as const;

      bee.damage(cause, target, 1, 0);
      expect(bee.stages[Stages.Attack]).toBe(0);

      bee.damage(cause, target, target.health, 0);
      expect(target.alive).toBe(false);
      expect(bee.stages[Stages.Attack]).toBe(FELL_STINGER_STAGES);
    });

    it('holds Belch back until a berry has been eaten', () => {
      const { battle, teamA, teamB } = createBattle();
      const glutton = createUnit(battle, teamA);
      const target = createUnit(battle, teamB);

      glutton.addMove(Moves.Belch);
      glutton.enter();
      target.enter();
      expect(glutton.checkCanCast(Moves.Belch, unitTarget(target))).toBe(false);

      glutton.addItem(Items.OranBerry);
      glutton.triggerItem(Items.OranBerry);
      expect(glutton.checkCanCast(Moves.Belch, unitTarget(target))).toBe(true);
    });

    it('blows a Fire move up in the hands of a Powdered target', () => {
      const { battle, teamA, teamB } = createBattle();
      const bug = createUnit(battle, teamA);
      const target = createUnit(battle, teamB);

      bug.enter();
      target.enter();

      bug.triggerMoveEffect(Moves.Powder, unitTarget(target), 0);

      const max = target.checkStat(Stats.HP, 0);
      const whole = bug.health;

      target.triggerMove(Moves.Ember, unitTarget(bug), 0);
      battle.tick(1000);

      expect(bug.health).toBe(whole);
      expect(target.health).toBe(max - Math.floor(max * POWDER_BLAST_SHARE));
    });

    it('turns every stage upside down with Topsy-Turvy', () => {
      const { battle, teamA, teamB } = createBattle();
      const flipper = createUnit(battle, teamA);
      const target = createUnit(battle, teamB);

      flipper.enter();
      target.enter();

      target.addStage(Stages.Attack, 2, { type: EffectType.None });
      target.addStage(Stages.Speed, -1, { type: EffectType.None });
      flipper.triggerMoveEffect(Moves.TopsyTurvy, unitTarget(target), 0);

      expect(target.stages[Stages.Attack]).toBe(-2);
      expect(target.stages[Stages.Speed]).toBe(1);
    });

    it('turns moves Electric with Electrify on one target and Ion Deluge on the field', () => {
      const { battle, teamA, teamB } = createBattle();
      const caster = createUnit(battle, teamA);
      const target = createUnit(battle, teamB);

      caster.enter();
      target.enter();

      caster.triggerMoveEffect(Moves.Electrify, unitTarget(target), 0);
      expect(target.checkMoveType(Moves.Ember, unitTarget(caster))).toBe(Types.Electric);
      expect(caster.checkMoveType(Moves.Ember, unitTarget(target))).toBe(Types.Fire);

      battle.tick(turns(1) + 1);
      expect(target.checkMoveType(Moves.Ember, unitTarget(caster))).toBe(Types.Fire);

      caster.triggerMoveEffect(Moves.IonDeluge, NONE_TARGET, 0);
      expect(target.checkMoveType(Moves.Tackle, unitTarget(caster))).toBe(Types.Electric);
      expect(target.checkMoveType(Moves.Ember, unitTarget(caster))).toBe(Types.Fire);
    });

    it("adds a type with Trick-or-Treat, and Forest's Curse takes its place", () => {
      const { battle, teamA, teamB } = createBattle();
      const caster = createUnit(battle, teamA);
      const target = createUnit(battle, teamB, [Types.Water]);

      caster.triggerMoveEffect(Moves.TrickOrTreat, unitTarget(target), 0);
      expect([...target.types].sort()).toEqual([Types.Water, Types.Ghost].sort());

      caster.triggerMoveEffect(Moves.ForestsCurse, unitTarget(target), 0);
      expect([...target.types].sort()).toEqual([Types.Water, Types.Grass].sort());
    });

    it('reaches only what each field stat move is about', () => {
      const { battle, teamA, teamB } = createBattle();
      const gardener = createUnit(battle, teamA, [Types.Grass]);
      const plain = createUnit(battle, teamA, [Types.Normal]);
      const magnet = createUnit(battle, teamA);
      const foe = createUnit(battle, teamB);

      magnet.addAbility(Abilities.Plus);
      for (const unit of [gardener, plain, magnet, foe]) {
        unit.enter();
      }

      gardener.triggerMoveEffect(Moves.Rototiller, NONE_TARGET, 0);
      expect(gardener.stages[Stages.Attack]).toBe(1);
      expect(plain.stages[Stages.Attack]).toBe(0);

      gardener.triggerMoveEffect(Moves.FlowerShield, NONE_TARGET, 0);
      expect(gardener.stages[Stages.Defense]).toBe(1);

      gardener.triggerMoveEffect(Moves.MagneticFlux, NONE_TARGET, 0);
      expect(magnet.stages[Stages.SpecialDefense]).toBe(1);
      expect(gardener.stages[Stages.SpecialDefense]).toBe(0);

      // Venom Drench reaches only a target that is already poisoned
      gardener.triggerMoveEffect(Moves.VenomDrench, unitTarget(foe), 0);
      expect(foe.stages[Stages.Speed]).toBe(0);
      foe.addStatus(Statuses.Poisoned, { type: EffectType.None });
      gardener.triggerMoveEffect(Moves.VenomDrench, unitTarget(foe), 0);
      expect(foe.stages[Stages.Speed]).toBe(-1);
      expect(foe.stages[Stages.Attack]).toBe(-1);
    });

    it('raises three stats on the landing of Geomancy, not the wind-up', () => {
      const { battle, teamA } = createBattle();
      const fairy = createUnit(battle, teamA);

      fairy.enter();
      fairy.triggerMoveEffect(Moves.Geomancy, NONE_TARGET, 1);
      expect(fairy.stages[Stages.SpecialAttack]).toBe(0);

      fairy.triggerMoveEffect(Moves.Geomancy, NONE_TARGET, 0);
      expect(fairy.stages[Stages.SpecialAttack]).toBe(GEOMANCY_VALUE);
      expect(fairy.stages[Stages.SpecialDefense]).toBe(GEOMANCY_VALUE);
      expect(fairy.stages[Stages.Speed]).toBe(GEOMANCY_VALUE);
    });

    it("doubles the team's Pay Day coins once with Happy Hour", () => {
      const { battle, teamA, teamB } = createBattle();
      const cat = createUnit(battle, teamA);
      const target = createUnit(battle, teamB);

      pinRandom(battle, 1);
      cat.enter();
      target.enter();

      cat.triggerMoveEffect(Moves.PayDay, unitTarget(target), 0);
      const one = PAY_DAY_COINS_PER_LEVEL * cat.level;

      expect(cat.coins).toBe(one);

      cat.triggerMoveEffect(Moves.HappyHour, NONE_TARGET, 0);
      expect(cat.coins).toBe(one * HAPPY_HOUR_FACTOR);

      // Once only, however often it is thrown
      cat.triggerMoveEffect(Moves.HappyHour, NONE_TARGET, 0);
      expect(cat.coins).toBe(one * HAPPY_HOUR_FACTOR);

      cat.triggerMoveEffect(Moves.PayDay, unitTarget(target), 0);
      expect(cat.coins).toBe(one * HAPPY_HOUR_FACTOR * 2);
    });
  });

  describe('the terrains', () => {
    /** The power a move comes to, thrown by `source` at `target` */
    function powerOf(source: Unit, move: Moves, target: Unit): number {
      return source.checkMovePower(move, unitTarget(target)) ?? 0;
    }

    it('keeps the grounded awake and charges their Electric moves', () => {
      const { battle, teamA, teamB } = createBattle('terrain', BattleModes.PvP);
      const layer = createUnit(battle, teamA);
      const bird = createUnit(battle, teamB, [Types.Flying]);

      layer.enter();
      bird.enter();

      const plain = powerOf(layer, Moves.Thunderbolt, bird);

      layer.triggerMoveEffect(Moves.ElectricTerrain, NONE_TARGET, 0);
      expect(layer.checkTerrain()).toBe(Terrains.Electric);

      // In the air, the terrain does not reach it
      expect(bird.checkTerrain()).toBe(Terrains.None);
      expect(powerOf(layer, Moves.Thunderbolt, bird)).toBeCloseTo(plain * TERRAIN_BOOST, 5);

      layer.addStatus(Statuses.Sleeping, { type: EffectType.None });
      bird.addStatus(Statuses.Sleeping, { type: EffectType.None });
      expect(layer.status[Statuses.Sleeping]).toBeUndefined();
      expect(bird.status[Statuses.Sleeping]).toBeDefined();
    });

    it('heals on the lawn and takes the force out of a quake', () => {
      const { battle, teamA, teamB } = createBattle('terrain', BattleModes.PvP);
      const layer = createUnit(battle, teamA);
      const target = createUnit(battle, teamB);

      layer.enter();
      target.enter();

      const quake = powerOf(layer, Moves.Earthquake, target);

      layer.triggerMoveEffect(Moves.GrassyTerrain, NONE_TARGET, 0);
      expect(powerOf(layer, Moves.Earthquake, target)).toBeCloseTo(quake * TERRAIN_BLUNTING, 5);

      const max = target.checkStat(Stats.HP, 0);

      target.setHealth(max / 2);
      act(battle, target);
      expect(target.health).toBe(max / 2 + Math.floor(max * GRASSY_HEAL_SHARE));
    });

    it('keeps statuses and confusion off the grounded and blunts Dragon moves at them', () => {
      const { battle, teamA, teamB } = createBattle('terrain', BattleModes.PvP);
      const layer = createUnit(battle, teamA);
      const target = createUnit(battle, teamB);

      layer.enter();
      target.enter();

      const dragon = powerOf(layer, Moves.DragonPulse, target);

      layer.triggerMoveEffect(Moves.MistyTerrain, NONE_TARGET, 0);
      expect(powerOf(layer, Moves.DragonPulse, target)).toBeCloseTo(dragon * TERRAIN_BLUNTING, 5);

      target.addStatus(Statuses.Burned, { type: EffectType.None });
      target.addStatus(Statuses.Confused, { type: EffectType.None });
      expect(target.status[Statuses.Burned]).toBeUndefined();
      expect(target.status[Statuses.Confused]).toBeUndefined();
    });

    it('runs out after five turns, and a new terrain takes the place of the old', () => {
      const { battle, teamA, teamB } = createBattle('terrain', BattleModes.PvP);
      const layer = createUnit(battle, teamA);
      const other = createUnit(battle, teamB);

      layer.enter();
      other.enter();

      layer.triggerMoveEffect(Moves.GrassyTerrain, NONE_TARGET, 0);
      other.triggerMoveEffect(Moves.MistyTerrain, NONE_TARGET, 0);
      expect(layer.checkTerrain()).toBe(Terrains.Misty);

      battle.tick(TERRAIN_DURATION + 1);
      expect(layer.checkTerrain()).toBe(Terrains.None);
    });

    it("lays a raid's terrain under the layer's own team only", () => {
      const { battle, teamA, teamB } = createBattle('terrain', BattleModes.Raid);
      const layer = createUnit(battle, teamA);
      const other = createUnit(battle, teamB);

      layer.enter();
      other.enter();

      layer.triggerMoveEffect(Moves.ElectricTerrain, NONE_TARGET, 0);
      expect(layer.checkTerrain()).toBe(Terrains.Electric);
      expect(other.checkTerrain()).toBe(Terrains.None);
    });
  });
});
