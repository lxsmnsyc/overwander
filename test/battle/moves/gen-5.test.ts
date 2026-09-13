import { describe, expect, it } from 'vitest';
import {
  BattleEvents,
  type CheckUnitMovePowerEvent,
  EffectType,
  MoveTargetType,
} from '../../../src/battle/events';
import type Battle from '../../../src/battle/core';
import type Unit from '../../../src/battle/unit';
import { EventPriority } from '../../../src/core/event-emitter';
import { Stages, Stats, StatsKind } from '../../../src/data/constants/stats';
import { Types } from '../../../src/data/constants/types';
import Abilities from '../../../src/data/ids/abilities';
import { Items } from '../../../src/data/ids/items';
import { Moves } from '../../../src/data/ids/moves';
import { Statuses, TeamStatuses } from '../../../src/data/ids/status';
import turns from '../../../src/battle/turn';
import { createBattle, createUnit, pinRandom } from '../harness';

/** A plain cause, for the damage these tests stage by hand */
const MOVE_CAUSE = { type: EffectType.None } as const;

const NONE_TARGET = { type: MoveTargetType.None } as const;

/** Long enough for a move with no delay of its own to finish landing */
const LANDED = 300;

function unitTarget(unit: Unit): { readonly type: MoveTargetType.Unit; readonly unit: Unit } {
  return { type: MoveTargetType.Unit, unit } as const;
}

/** What a move is worth against this target right now */
function powerOf(battle: Battle, source: Unit, move: Moves, aim: Unit): number {
  const event: CheckUnitMovePowerEvent = {
    id: 'CheckMovePower',
    disabled: false,
    source,
    move,
    target: unitTarget(aim),
    power: 0,
  };

  battle.emit(BattleEvents.CheckUnitMovePower, event);
  return event.power ?? 0;
}

/** The health a move's effect takes off its target */
function damageOf(source: Unit, move: Moves, target: Unit): number {
  const before = target.health;

  source.triggerMoveEffect(move, unitTarget(target), 0);

  const dealt = before - target.health;

  target.setHealth(before);
  return dealt;
}

describe("Unova's moves", () => {
  describe('the windows', () => {
    it('climbs an Echoed Voice while the echo is still going', () => {
      const { battle, teamA, teamB } = createBattle();
      const voice = createUnit(battle, teamA);
      const target = createUnit(battle, teamB);

      voice.enter();
      target.enter();

      expect(powerOf(battle, voice, Moves.EchoedVoice, target)).toBe(40);

      voice.triggerMove(Moves.EchoedVoice, unitTarget(target), 0);
      battle.tick(LANDED);
      expect(powerOf(battle, voice, Moves.EchoedVoice, target)).toBe(80);

      // The echo dies away once nobody keeps it going
      battle.tick(turns(1));
      expect(powerOf(battle, voice, Moves.EchoedVoice, target)).toBe(40);
    });

    it("doubles a Round after a teammate's, not after the user's own", () => {
      const { battle, teamA, teamB } = createBattle();
      const first = createUnit(battle, teamA);
      const second = createUnit(battle, teamA);
      const target = createUnit(battle, teamB);

      for (const unit of [first, second, target]) {
        unit.enter();
      }

      first.triggerMove(Moves.Round, unitTarget(target), 0);
      battle.tick(LANDED);

      expect(powerOf(battle, second, Moves.Round, target)).toBe(120);
      expect(powerOf(battle, first, Moves.Round, target)).toBe(60);
    });

    it('doubles a Retaliate for a teammate that just fainted', () => {
      const { battle, teamA, teamB } = createBattle();
      const avenger = createUnit(battle, teamA);
      const fallen = createUnit(battle, teamA);
      const enemy = createUnit(battle, teamB);

      for (const unit of [avenger, fallen, enemy]) {
        unit.enter();
      }

      fallen.damage(MOVE_CAUSE, fallen, 1000, 0);
      expect(fallen.alive).toBe(false);

      expect(powerOf(battle, avenger, Moves.Retaliate, enemy)).toBe(140);
      // Somebody else's loss is nothing to the far side
      expect(powerOf(battle, enemy, Moves.Retaliate, avenger)).toBe(70);

      battle.tick(turns(1) + 1);
      expect(powerOf(battle, avenger, Moves.Retaliate, enemy)).toBe(70);
    });

    it('doubles a Fusion Bolt that follows a Fusion Flare', () => {
      const { battle, teamA, teamB } = createBattle();
      const flare = createUnit(battle, teamA);
      const bolt = createUnit(battle, teamB);

      flare.enter();
      bolt.enter();

      flare.triggerMove(Moves.FusionFlare, unitTarget(bolt), 0);
      battle.tick(600);

      expect(powerOf(battle, bolt, Moves.FusionBolt, flare)).toBe(200);
    });

    it('combines two Pledges into a sea of fire under the far side', () => {
      const { battle, teamA, teamB } = createBattle();
      const fire = createUnit(battle, teamA);
      const grass = createUnit(battle, teamA);
      const enemy = createUnit(battle, teamB);

      for (const unit of [fire, grass, enemy]) {
        unit.enter();
      }

      fire.triggerMove(Moves.FirePledge, unitTarget(enemy), 0);
      battle.tick(LANDED);

      expect(powerOf(battle, grass, Moves.GrassPledge, enemy)).toBe(150);
      expect(grass.checkMoveType(Moves.GrassPledge, unitTarget(enemy))).toBe(Types.Fire);

      grass.triggerMove(Moves.GrassPledge, unitTarget(enemy), 0);
      battle.tick(LANDED);

      expect(teamB.status[TeamStatuses.SeaOfFire]).toBeDefined();
      // Spent: the pair does not combine a third time
      expect(powerOf(battle, grass, Moves.GrassPledge, enemy)).toBe(80);

      // Each time something in it acts, the fire takes 1/8 of its HP
      const standing = enemy.health;

      enemy.addMove(Moves.Tackle);
      enemy.cast(Moves.Tackle, unitTarget(fire));
      expect(standing - enemy.health).toBe(20);

      battle.tick(turns(4));
      expect(teamB.status[TeamStatuses.SeaOfFire]).toBeUndefined();
    });
  });

  describe('what a blow is worked out from', () => {
    it('doubles Acrobatics for empty hands', () => {
      const { battle, teamA, teamB } = createBattle();
      const flier = createUnit(battle, teamA);
      const target = createUnit(battle, teamB);

      expect(powerOf(battle, flier, Moves.Acrobatics, target)).toBe(110);

      flier.addItem(Items.Leftovers);
      expect(powerOf(battle, flier, Moves.Acrobatics, target)).toBe(55);
    });

    it('doubles Hex on a burn and Venoshock on a poison', () => {
      const { battle, teamA, teamB } = createBattle();
      const caster = createUnit(battle, teamA);
      const target = createUnit(battle, teamB);

      expect(powerOf(battle, caster, Moves.Hex, target)).toBe(65);

      target.addStatus(Statuses.Burned, MOVE_CAUSE);
      expect(powerOf(battle, caster, Moves.Hex, target)).toBe(130);
      expect(powerOf(battle, caster, Moves.Venoshock, target)).toBe(65);
    });

    it('adds 20 to Stored Power for each stage raised', () => {
      const { battle, teamA, teamB } = createBattle();
      const caster = createUnit(battle, teamA);
      const target = createUnit(battle, teamB);

      caster.addStage(Stages.Attack, 2, MOVE_CAUSE);
      caster.addStage(Stages.Speed, 1, MOVE_CAUSE);
      caster.addStage(Stages.Defense, -1, MOVE_CAUSE);

      expect(powerOf(battle, caster, Moves.StoredPower, target)).toBe(80);
    });

    it('reads Electro Ball off Speed and Heavy Slam off weight', () => {
      const { battle, teamA, teamB } = createBattle();
      const caster = createUnit(battle, teamA);
      const target = createUnit(battle, teamB);

      expect(powerOf(battle, caster, Moves.ElectroBall, target)).toBe(60);
      target.setStat(StatsKind.Base, Stats.Speed, 10);
      expect(powerOf(battle, caster, Moves.ElectroBall, target)).toBe(150);

      caster.setWeight(50);
      target.setWeight(50);
      expect(powerOf(battle, caster, Moves.HeavySlam, target)).toBe(40);
      caster.setWeight(300);
      expect(powerOf(battle, caster, Moves.HeatCrash, target)).toBe(120);
    });

    it("swings Foul Play with the target's Attack", () => {
      const { battle, teamA, teamB } = createBattle();
      pinRandom(battle, 1);
      const caster = createUnit(battle, teamA);
      const target = createUnit(battle, teamB);

      const plain = damageOf(caster, Moves.FoulPlay, target);

      target.addStage(Stages.Attack, 6, MOVE_CAUSE);
      expect(damageOf(caster, Moves.FoulPlay, target)).toBeGreaterThan(plain);
    });

    it('lands Psyshock against Defense and Chip Away through stages', () => {
      const { battle, teamA, teamB } = createBattle();
      pinRandom(battle, 1);
      const caster = createUnit(battle, teamA);
      const target = createUnit(battle, teamB);

      const shock = damageOf(caster, Moves.Psyshock, target);
      const chip = damageOf(caster, Moves.ChipAway, target);

      target.addStage(Stages.SpecialDefense, 6, MOVE_CAUSE);
      expect(damageOf(caster, Moves.Psyshock, target)).toBe(shock);

      target.addStage(Stages.Defense, 6, MOVE_CAUSE);
      expect(damageOf(caster, Moves.Psyshock, target)).toBeLessThan(shock);
      expect(damageOf(caster, Moves.ChipAway, target)).toBe(chip);
    });

    it('always lands Storm Throw as a critical', () => {
      const { battle, teamA, teamB } = createBattle();
      pinRandom(battle, 1);
      const caster = createUnit(battle, teamA);
      const target = createUnit(battle, teamB);
      const criticals: boolean[] = [];

      battle.on(BattleEvents.UnitAttackResolveCriticalHit, EventPriority.Post, (event) => {
        criticals.push(event.critical);
      });

      caster.triggerMoveEffect(Moves.LowSweep, unitTarget(target), 0);
      caster.triggerMoveEffect(Moves.StormThrow, unitTarget(target), 0);

      expect(criticals).toEqual([false, true]);
    });

    it('takes Techno Blast off the Drive in hand', () => {
      const { battle, teamA, teamB } = createBattle();
      const caster = createUnit(battle, teamA);
      const target = createUnit(battle, teamB);

      expect(caster.checkMoveType(Moves.TechnoBlast, unitTarget(target))).toBe(Types.Normal);

      caster.addItem(Items.BurnDrive);
      expect(caster.checkMoveType(Moves.TechnoBlast, unitTarget(target))).toBe(Types.Fire);
    });

    it('passes Synchronoise through a target that shares no type', () => {
      const { battle, teamA, teamB } = createBattle();
      const caster = createUnit(battle, teamA, [Types.Psychic]);
      const stranger = createUnit(battle, teamB, [Types.Fire]);
      const kin = createUnit(battle, teamB, [Types.Psychic]);

      const immune = (unit: Unit): boolean =>
        caster.checkMoveImmunity(Moves.Synchronoise, unitTarget(unit), Types.Psychic);

      expect(immune(stranger)).toBe(true);
      expect(immune(kin)).toBe(false);
    });
  });

  describe('the air and the ground', () => {
    it('pulls a flyer down with Smack Down and keeps it there', () => {
      const { battle, teamA, teamB } = createBattle();
      const thrower = createUnit(battle, teamA);
      const bird = createUnit(battle, teamB, [Types.Flying]);

      thrower.enter();
      bird.enter();
      expect(bird.checkGrounded()).toBe(false);

      thrower.triggerMoveEffect(Moves.SmackDown, unitTarget(bird), 0);

      expect(bird.status[Statuses.Grounded]).toBeDefined();
      expect(bird.checkGrounded()).toBe(true);
    });

    it('holds a Telekinesis target up where nothing misses it', () => {
      const { battle, teamA, teamB } = createBattle();
      const caster = createUnit(battle, teamA);
      const target = createUnit(battle, teamB);

      caster.enter();
      target.enter();
      caster.triggerMoveEffect(Moves.Telekinesis, unitTarget(target), 0);

      expect(target.checkGrounded()).toBe(false);
      expect(caster.checkMoveAccuracy(Moves.Inferno, unitTarget(target))).toBeUndefined();

      battle.tick(turns(3) + 1);
      expect(target.status[Statuses.Telekinetic]).toBeUndefined();
      expect(caster.checkMoveAccuracy(Moves.Inferno, unitTarget(target))).toBe(50);
    });

    it('carries a Sky Drop target up, where it cannot act, then drops it', () => {
      const { battle, teamA, teamB } = createBattle();
      pinRandom(battle, 1);
      const carrier = createUnit(battle, teamA);
      const carried = createUnit(battle, teamB);

      carrier.enter();
      carried.enter();
      carried.setWeight(50);
      carried.addMove(Moves.Tackle);

      carrier.triggerMoveEffect(Moves.SkyDrop, unitTarget(carried), 1);

      expect(carried.status[Statuses.SkyDropped]).toBeDefined();
      expect(carried.checkCanCast(Moves.Tackle, unitTarget(carrier))).toBe(false);

      const whole = carried.health;

      carrier.triggerMoveTarget(Moves.SkyDrop, unitTarget(carried), 0);

      expect(carried.status[Statuses.SkyDropped]).toBeUndefined();
      expect(carried.status[Statuses.Invulnerable]).toBeUndefined();
      expect(carried.health).toBeLessThan(whole);
    });

    it('cannot lift a target of 200 kg or more', () => {
      const { battle, teamA, teamB } = createBattle();
      const carrier = createUnit(battle, teamA);
      const heavy = createUnit(battle, teamB);

      heavy.setWeight(250);
      carrier.triggerMoveEffect(Moves.SkyDrop, unitTarget(heavy), 1);

      expect(heavy.status[Statuses.SkyDropped]).toBeUndefined();
    });
  });

  describe('the guards', () => {
    it('turns spread moves away from a Wide Guard, for 2 seconds', () => {
      const { battle, teamA, teamB } = createBattle();
      const guard = createUnit(battle, teamA);
      const mate = createUnit(battle, teamA);
      const enemy = createUnit(battle, teamB);

      guard.triggerMoveEffect(Moves.WideGuard, NONE_TARGET, 0);

      expect(enemy.checkMoveImmunity(Moves.Bulldoze, unitTarget(mate), Types.Ground)).toBe(true);
      expect(enemy.checkMoveImmunity(Moves.Tackle, unitTarget(mate), Types.Normal)).toBe(false);

      battle.tick(turns(1) + 1);
      expect(enemy.checkMoveImmunity(Moves.Bulldoze, unitTarget(mate), Types.Ground)).toBe(false);
    });

    it('turns quick moves away from a Quick Guard', () => {
      const { battle, teamA, teamB } = createBattle();
      const guard = createUnit(battle, teamA);
      const enemy = createUnit(battle, teamB);

      guard.triggerMoveEffect(Moves.QuickGuard, NONE_TARGET, 0);

      expect(enemy.checkMoveImmunity(Moves.AquaJet, unitTarget(guard), Types.Water)).toBe(true);
      expect(enemy.checkMoveImmunity(Moves.Tackle, unitTarget(guard), Types.Normal)).toBe(false);
    });

    it('draws casts to Rage Powder, except from a Grass type', () => {
      const { battle, teamA, teamB } = createBattle();
      const powder = createUnit(battle, teamA);
      const mate = createUnit(battle, teamA);
      const enemy = createUnit(battle, teamB);
      const grass = createUnit(battle, teamB, [Types.Grass]);

      for (const unit of [powder, mate, enemy, grass]) {
        unit.enter();
        unit.addMove(Moves.Tackle);
      }

      enemy.cast(Moves.Tackle, unitTarget(mate));
      grass.cast(Moves.Tackle, unitTarget(mate));
      powder.triggerMoveEffect(Moves.RagePowder, NONE_TARGET, 0);

      // Compared by identity: two fresh harness units look alike
      const aimedAt = (unit: Unit): Unit | undefined => {
        const target = unit.casting?.target;

        return target?.type === MoveTargetType.Unit ? target.unit : undefined;
      };

      expect(aimedAt(enemy)).toBe(powder);
      expect(aimedAt(grass)).toBe(mate);
    });
  });

  describe('wind-ups and places', () => {
    it("fires a teammate's wind-up at once with After You", () => {
      const { battle, teamA, teamB } = createBattle();
      const polite = createUnit(battle, teamA);
      const mate = createUnit(battle, teamA);
      const enemy = createUnit(battle, teamB);

      for (const unit of [polite, mate, enemy]) {
        unit.enter();
      }
      mate.addMove(Moves.Tackle);
      mate.cast(Moves.Tackle, unitTarget(enemy));

      const whole = enemy.health;

      polite.triggerMoveEffect(Moves.AfterYou, unitTarget(mate), 0);
      expect(mate.casting).toBeUndefined();

      battle.tick(LANDED);
      expect(enemy.health).toBeLessThan(whole);
    });

    it("sends a target's wind-up back to the start with Quash", () => {
      const { battle, teamA, teamB } = createBattle();
      const quasher = createUnit(battle, teamA);
      const enemy = createUnit(battle, teamB);

      quasher.enter();
      enemy.enter();
      enemy.addMove(Moves.Tackle);
      enemy.cast(Moves.Tackle, unitTarget(quasher));
      battle.tick(500);

      expect(enemy.casting?.time.progress).toBe(500);

      quasher.triggerMoveEffect(Moves.Quash, unitTarget(enemy), 0);
      expect(enemy.casting?.time.progress).toBe(0);
    });

    it('trades places with a teammate on Ally Switch', () => {
      const { battle, teamA } = createBattle();
      const user = createUnit(battle, teamA);
      const mate = createUnit(battle, teamA);

      user.enter();
      mate.enter();
      user.triggerMoveEffect(Moves.AllySwitch, unitTarget(mate), 0);

      expect(user.status[Statuses.Switching]).toBeDefined();
      expect(mate.status[Statuses.Switching]).toBeDefined();
    });

    it('drags a teammate in behind a Circle Throw', () => {
      const { battle, teamA, teamB } = createBattle();
      pinRandom(battle, 1);
      const thrower = createUnit(battle, teamA);
      const target = createUnit(battle, teamB);

      createUnit(battle, teamB).enter();
      thrower.enter();
      target.enter();
      thrower.triggerMoveEffect(Moves.CircleThrow, unitTarget(target), 0);

      expect(target.status[Statuses.Switching]).toBeDefined();
    });

    it('lands a Volt Switch before walking off', () => {
      const { battle, teamA, teamB } = createBattle();
      const leaver = createUnit(battle, teamA);
      const target = createUnit(battle, teamB);

      createUnit(battle, teamA).enter();
      leaver.enter();
      target.enter();

      const whole = target.health;

      leaver.triggerMoveEffect(Moves.VoltSwitch, unitTarget(target), 1);
      expect(target.health).toBeLessThan(whole);
      expect(leaver.status[Statuses.Switching]).toBeUndefined();

      leaver.triggerMoveEffect(Moves.VoltSwitch, unitTarget(target), 0);
      expect(leaver.status[Statuses.Switching]).toBeDefined();
    });
  });

  describe('what a pokemon is and carries', () => {
    it('hands the held item to a teammate with Bestow', () => {
      const { battle, teamA } = createBattle();
      const giver = createUnit(battle, teamA);
      const mate = createUnit(battle, teamA);

      giver.addItem(Items.Leftovers);
      giver.triggerMoveEffect(Moves.Bestow, unitTarget(mate), 0);

      expect(mate.hasItem(Items.Leftovers)).toBe(true);
      expect(giver.hasItem(Items.Leftovers)).toBe(false);
    });

    it('burns up a gem with Incinerate', () => {
      const { battle, teamA, teamB } = createBattle();
      pinRandom(battle, 0);
      const caster = createUnit(battle, teamA);
      const target = createUnit(battle, teamB);

      target.addItem(Items.FireGem);
      caster.triggerMoveEffect(Moves.Incinerate, unitTarget(target), 0);

      expect(target.items[Items.FireGem]).toBeUndefined();
    });

    it('rewrites abilities with Entrainment and Simple Beam', () => {
      const { battle, teamA, teamB } = createBattle();
      const caster = createUnit(battle, teamA);
      const target = createUnit(battle, teamB);

      caster.addAbility(Abilities.Overgrow);
      target.addAbility(Abilities.Blaze);
      caster.triggerMoveEffect(Moves.Entrainment, unitTarget(target), 0);

      expect(target.hasAbility(Abilities.Overgrow)).toBe(true);
      expect(target.hasAbility(Abilities.Blaze)).toBe(false);

      caster.triggerMoveEffect(Moves.SimpleBeam, unitTarget(target), 0);
      expect(target.hasAbility(Abilities.Simple)).toBe(true);
      expect(target.hasAbility(Abilities.Overgrow)).toBe(false);
    });

    it('soaks a target through and copies types with Reflect Type', () => {
      const { battle, teamA, teamB } = createBattle();
      const caster = createUnit(battle, teamA);
      const target = createUnit(battle, teamB, [Types.Grass, Types.Poison]);

      caster.triggerMoveEffect(Moves.ReflectType, unitTarget(target), 0);
      expect([...caster.types]).toEqual([Types.Grass, Types.Poison]);

      caster.triggerMoveEffect(Moves.Soak, unitTarget(target), 0);
      expect([...target.types]).toEqual([Types.Water]);
    });

    it('averages Defense between the two on Guard Split', () => {
      const { battle, teamA, teamB } = createBattle();
      const caster = createUnit(battle, teamA);
      const target = createUnit(battle, teamB);

      target.setStat(StatsKind.Base, Stats.Defense, 200);

      const average = Math.floor(
        (caster.checkStat(Stats.Defense, 0) + target.checkStat(Stats.Defense, 0)) / 2,
      );

      caster.triggerMoveEffect(Moves.GuardSplit, unitTarget(target), 0);

      expect(caster.checkStat(Stats.Defense, 0)).toBe(average);
      expect(target.checkStat(Stats.Defense, 0)).toBe(average);
    });

    it('sheds 100 kg with Autotomize', () => {
      const { battle, teamA } = createBattle();
      const unit = createUnit(battle, teamA);

      unit.setWeight(150);
      unit.triggerMoveEffect(Moves.Autotomize, NONE_TARGET, 0);

      expect(unit.checkWeight()).toBe(50);
      expect(unit.stages[Stages.Speed]).toBe(2);
    });

    it('trades Defense and Special Defense in a Wonder Room until a second one', () => {
      const { battle, teamA } = createBattle();
      const unit = createUnit(battle, teamA);

      unit.setStat(StatsKind.Base, Stats.Defense, 200);

      const defense = unit.checkStat(Stats.Defense, 0);
      const special = unit.checkStat(Stats.SpecialDefense, 0);

      unit.triggerMoveEffect(Moves.WonderRoom, NONE_TARGET, 0);
      expect(unit.checkStat(Stats.Defense, 0)).toBe(special);
      expect(unit.checkStat(Stats.SpecialDefense, 0)).toBe(defense);

      unit.triggerMoveEffect(Moves.WonderRoom, NONE_TARGET, 0);
      expect(unit.checkStat(Stats.Defense, 0)).toBe(defense);
    });

    it('shuts every held item off for 10 seconds in a Magic Room', () => {
      const { battle, teamA } = createBattle();
      const unit = createUnit(battle, teamA);

      unit.addItem(Items.Leftovers);
      unit.triggerMoveEffect(Moves.MagicRoom, NONE_TARGET, 0);
      expect(unit.hasItem(Items.Leftovers)).toBe(false);

      battle.tick(turns(5) + 1);
      expect(unit.hasItem(Items.Leftovers)).toBe(true);
    });
  });

  describe('the rest', () => {
    it("throws the user's HP with Final Gambit and spends the user", () => {
      const { battle, teamA, teamB } = createBattle();
      pinRandom(battle, 1);
      const gambler = createUnit(battle, teamA);
      const target = createUnit(battle, teamB);

      gambler.enter();
      target.enter();
      gambler.damage(MOVE_CAUSE, gambler, 60, 0);
      gambler.triggerMoveEffect(Moves.FinalGambit, unitTarget(target), 0);

      expect(target.health).toBe(target.checkStat(Stats.HP, 0) - 100);
      expect(gambler.alive).toBe(false);
    });

    it('clears the target of its stages with Clear Smog', () => {
      const { battle, teamA, teamB } = createBattle();
      pinRandom(battle, 0);
      const caster = createUnit(battle, teamA);
      const target = createUnit(battle, teamB);

      target.addStage(Stages.Defense, 2, MOVE_CAUSE);
      caster.triggerMoveEffect(Moves.ClearSmog, unitTarget(target), 0);

      expect(target.stages[Stages.Defense]).toBe(0);
    });

    it("splashes the target's teammates with Flame Burst", () => {
      const { battle, teamA, teamB } = createBattle();
      pinRandom(battle, 1);
      const caster = createUnit(battle, teamA);
      const target = createUnit(battle, teamB);
      const beside = createUnit(battle, teamB);

      caster.triggerMoveEffect(Moves.FlameBurst, unitTarget(target), 0);

      expect(beside.health).toBe(beside.checkStat(Stats.HP, 0) * (15 / 16));
    });

    it('thaws its target with Scald', () => {
      const { battle, teamA, teamB } = createBattle();
      pinRandom(battle, 1);
      const caster = createUnit(battle, teamA);
      const target = createUnit(battle, teamB);

      target.addStatus(Statuses.Frozen, MOVE_CAUSE);
      caster.triggerMoveEffect(Moves.Scald, unitTarget(target), 0);

      expect(target.status[Statuses.Frozen]).toBeUndefined();
    });

    it('heals a teammate half its HP with Heal Pulse', () => {
      const { battle, teamA } = createBattle();
      const healer = createUnit(battle, teamA);
      const mate = createUnit(battle, teamA);

      mate.damage(MOVE_CAUSE, mate, 80, 0);
      healer.triggerMoveEffect(Moves.HealPulse, unitTarget(mate), 0);

      expect(mate.health).toBe(mate.checkStat(Stats.HP, 0));
    });
  });
});
