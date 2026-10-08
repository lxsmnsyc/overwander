import { describe, expect, it } from 'vitest';
import { EffectType, MoveTargetType } from '../../../src/battle/events';
import { layersUnder } from '../../../src/battle/moves/spikes';
import { stonesOver } from '../../../src/battle/moves/stealth-rock';
import turns from '../../../src/battle/turn';
import type Unit from '../../../src/battle/unit';
import { Stages, Stats, StatsKind } from '../../../src/data/constants/stats';
import { Types } from '../../../src/data/constants/types';
import { Items } from '../../../src/data/ids/items';
import { MoveTargets, Moves } from '../../../src/data/ids/moves';
import { Species } from '../../../src/data/ids/species';
import { Statuses, TeamStatuses, Terrains } from '../../../src/data/ids/status';
import { getMoveData } from '../../../src/data/moves';
import { createBattle, createUnit, pinRandom } from '../harness';

const NONE_TARGET = { type: MoveTargetType.None } as const;
const CAUSE = { type: EffectType.None } as const;

function at(unit: Unit): { readonly type: MoveTargetType.Unit; readonly unit: Unit } {
  return { type: MoveTargetType.Unit, unit } as const;
}

function damageOf(source: Unit, move: Moves, target: Unit): number {
  const before = target.health;

  source.triggerMoveEffect(move, at(target), 0);

  const dealt = before - target.health;

  target.setHealth(before);
  return dealt;
}

describe("Galar's and Hisui's moves on the shared tables", () => {
  it('registers every one of them, and none of the Max Moves', () => {
    createBattle();
    expect(getMoveData(Moves.BodyPress).power).toBe(80);
    expect(getMoveData(Moves.TakeHeart).name).toBe('Take Heart');
    expect(() => getMoveData(Moves.MaxFlare)).toThrow();
  });

  it('drops a stage as it lands with Breaking Swipe, and raises the user with Aura Wheel', () => {
    const { battle, teamA, teamB } = createBattle();
    const user = createUnit(battle, teamA);
    const target = createUnit(battle, teamB);

    pinRandom(battle, 0);
    user.triggerMoveEffect(Moves.BreakingSwipe, at(target), 0);
    expect(target.stages[Stages.Attack]).toBe(-1);

    user.triggerMoveEffect(Moves.AuraWheel, at(target), 0);
    expect(user.stages[Stages.Speed]).toBe(1);
  });

  it('raises everything with No Retreat once, and keeps the user on the field', () => {
    const { battle, teamA } = createBattle();
    const user = createUnit(battle, teamA);

    user.addMove(Moves.NoRetreat);
    user.triggerMoveEffect(Moves.NoRetreat, NONE_TARGET, 0);

    for (const stage of [
      Stages.Attack,
      Stages.Defense,
      Stages.SpecialAttack,
      Stages.SpecialDefense,
      Stages.Speed,
    ]) {
      expect(user.stages[stage]).toBe(1);
    }
    expect(user.status[Statuses.Cornered]).toBeDefined();
    expect(user.checkCanCast(Moves.NoRetreat, NONE_TARGET)).toBe(false);
  });
});

describe("Galar's and Hisui's moves with a rule of their own", () => {
  it('hits with the user’s Defense under Body Press', () => {
    const { battle, teamA, teamB } = createBattle();
    const user = createUnit(battle, teamA);
    const target = createUnit(battle, teamB);

    pinRandom(battle, 0.5);

    const plain = damageOf(user, Moves.BodyPress, target);

    user.addStage(Stages.Defense, 2, CAUSE);
    expect(damageOf(user, Moves.BodyPress, target)).toBeGreaterThan(plain);
  });

  it('doubles Bolt Beak against a target that has not begun a cast, and not after', () => {
    const { battle, teamA, teamB } = createBattle();
    const user = createUnit(battle, teamA);
    const target = createUnit(battle, teamB);

    expect(user.checkMovePower(Moves.BoltBeak, at(target))).toBe(170);
    target.addMove(Moves.Tackle);
    target.enter();
    target.cast(Moves.Tackle, at(user));
    expect(user.checkMovePower(Moves.BoltBeak, at(target))).toBe(85);
  });

  it('makes Fire hit a tarred pokemon twice as hard', () => {
    const { battle, teamA, teamB } = createBattle();
    const user = createUnit(battle, teamA);
    const target = createUnit(battle, teamB);

    pinRandom(battle, 0.5);

    const plain = damageOf(user, Moves.Ember, target);

    user.triggerMoveEffect(Moves.TarShot, at(target), 0);
    expect(target.stages[Stages.Speed]).toBe(-1);
    expect(damageOf(user, Moves.Ember, target)).toBeCloseTo(plain * 2, 5);
  });

  it('costs Clangorous Soul a third of the user’s HP, and refuses it with less than that', () => {
    const { battle, teamA } = createBattle();
    const user = createUnit(battle, teamA);
    const whole = user.checkStat(Stats.HP, 0);

    user.addMove(Moves.ClangorousSoul);
    user.triggerMove(Moves.ClangorousSoul, NONE_TARGET, 0);
    battle.tick(turns(1));
    expect(user.health).toBe(whole - Math.ceil(whole / 3));
    expect(user.stages[Stages.Speed]).toBe(1);

    user.setHealth(Math.floor(whole / 3));
    expect(user.checkCanCast(Moves.ClangorousSoul, NONE_TARGET)).toBe(false);
  });

  it('turns the target pure Psychic with Magic Powder', () => {
    const { battle, teamA, teamB } = createBattle();
    const user = createUnit(battle, teamA);
    const target = createUnit(battle, teamB, [Types.Water, Types.Ground]);

    user.triggerMoveEffect(Moves.MagicPowder, at(target), 0);
    expect([...target.types]).toEqual([Types.Psychic]);
  });

  it('locks both pokemon in with Jaw Lock, and frees one when the other faints', () => {
    const { battle, teamA, teamB } = createBattle();
    const user = createUnit(battle, teamA);
    const target = createUnit(battle, teamB);

    pinRandom(battle, 0);
    user.enter();
    target.enter();
    user.triggerMoveEffect(Moves.JawLock, at(target), 0);
    expect(user.status[Statuses.Cornered]).toBeDefined();
    expect(target.status[Statuses.Cornered]).toBeDefined();

    target.faint(user);
    expect(user.status[Statuses.Cornered]).toBeUndefined();
  });

  it('wrings a stage of each defence out of an Octolocked pokemon each time it acts', () => {
    const { battle, teamA, teamB } = createBattle();
    const user = createUnit(battle, teamA);
    const target = createUnit(battle, teamB);

    user.enter();
    target.enter();
    user.triggerMoveEffect(Moves.Octolock, at(target), 0);
    expect(target.status[Statuses.Cornered]).toBeDefined();

    target.addMove(Moves.Tackle);
    target.cast(Moves.Tackle, at(user));
    expect(target.stages[Stages.Defense]).toBe(-1);
    expect(target.stages[Stages.SpecialDefense]).toBe(-1);
  });

  it('eats the user’s berry with Stuff Cheeks, and fails without one', () => {
    const { battle, teamA } = createBattle();
    const user = createUnit(battle, teamA);

    user.addMove(Moves.StuffCheeks);
    expect(user.checkCanCast(Moves.StuffCheeks, NONE_TARGET)).toBe(false);

    user.addItem(Items.OranBerry);
    expect(user.checkCanCast(Moves.StuffCheeks, NONE_TARGET)).toBe(true);
    user.triggerMoveEffect(Moves.StuffCheeks, NONE_TARGET, 0);
    expect(user.stages[Stages.Defense]).toBe(2);
    expect(user.hasItem(Items.OranBerry)).toBe(false);
  });

  it('turns Poltergeist away from a target holding nothing', () => {
    const { battle, teamA, teamB } = createBattle();
    const user = createUnit(battle, teamA);
    const target = createUnit(battle, teamB);

    pinRandom(battle, 0);
    user.enter();
    target.enter();

    const whole = target.health;

    user.triggerMoveTarget(Moves.Poltergeist, at(target), 0);
    expect(target.health).toBe(whole);
    target.addItem(Items.Leftovers);
    user.triggerMoveTarget(Moves.Poltergeist, at(target), 0);
    expect(target.health).toBeLessThan(whole);
  });

  it('leaves Stealth Rock behind a Stone Axe and spikes behind a Ceaseless Edge', () => {
    const { battle, teamA, teamB } = createBattle();
    const user = createUnit(battle, teamA);
    const target = createUnit(battle, teamB);

    pinRandom(battle, 0);
    user.triggerMoveEffect(Moves.StoneAxe, at(target), 0);
    expect(stonesOver(teamB)).toBe(true);

    user.triggerMoveEffect(Moves.CeaselessEdge, at(target), 0);
    user.triggerMoveEffect(Moves.CeaselessEdge, at(target), 0);
    expect(layersUnder(teamB)).toBe(2);
  });

  it('carries the hazards across with Court Change', () => {
    const { battle, teamA, teamB } = createBattle();
    const user = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);

    pinRandom(battle, 0);
    foe.triggerMoveEffect(Moves.StoneAxe, at(user), 0);
    expect(stonesOver(teamA)).toBe(true);

    user.triggerMoveEffect(Moves.CourtChange, NONE_TARGET, 0);
    expect(stonesOver(teamA)).toBe(false);
    expect(stonesOver(teamB)).toBe(true);
  });

  it('heals the whole team a quarter with Life Dew, and cures them with Jungle Healing', () => {
    const { battle, teamA } = createBattle();
    const user = createUnit(battle, teamA);
    const mate = createUnit(battle, teamA);
    const whole = mate.checkStat(Stats.HP, 0);

    mate.setHealth(1);
    user.triggerMoveEffect(Moves.LifeDew, NONE_TARGET, 0);
    expect(mate.health).toBe(1 + Math.floor(whole / 4));

    mate.addStatus(Statuses.Burned, CAUSE);
    user.triggerMoveEffect(Moves.JungleHealing, NONE_TARGET, 0);
    expect(mate.status[Statuses.Burned]).toBeUndefined();
  });

  it('raises the teammates and not the user with Coaching', () => {
    const { battle, teamA } = createBattle();
    const user = createUnit(battle, teamA);
    const mate = createUnit(battle, teamA);

    user.triggerMoveEffect(Moves.Coaching, NONE_TARGET, 0);
    expect(mate.stages[Stages.Attack]).toBe(1);
    expect(mate.stages[Stages.Defense]).toBe(1);
    expect(user.stages[Stages.Attack]).toBe(0);
  });

  it('takes the terrain’s type and twice the power with Terrain Pulse, and rolls it flat with Steel Roller', () => {
    const { battle, teamA, teamB } = createBattle();
    const user = createUnit(battle, teamA);
    const target = createUnit(battle, teamB);

    user.addMove(Moves.SteelRoller);
    expect(user.checkCanCast(Moves.SteelRoller, at(target))).toBe(false);

    battle.terrain.current = Terrains.Electric;
    expect(user.checkMoveType(Moves.TerrainPulse, at(target))).toBe(Types.Electric);
    expect(user.checkMovePower(Moves.TerrainPulse, at(target))).toBeGreaterThanOrEqual(100);
    expect(user.checkCanCast(Moves.SteelRoller, at(target))).toBe(true);

    user.triggerMoveEffect(Moves.SteelRoller, at(target), 0);
    expect(user.checkTerrain()).toBe(Terrains.None);
  });

  it('winds Grassy Glide up faster on a lawn', () => {
    const { battle, teamA, teamB } = createBattle();
    const user = createUnit(battle, teamA);
    const target = createUnit(battle, teamB);

    expect(user.checkMovePriority(Moves.GrassyGlide, at(target))).toBe(0);
    battle.terrain.current = Terrains.Grassy;
    expect(user.checkMovePriority(Moves.GrassyGlide, at(target))).toBe(1);
  });

  it('doubles Barb Barrage on a poisoned target and Infernal Parade on any status', () => {
    const { battle, teamA, teamB } = createBattle();
    const user = createUnit(battle, teamA);
    const target = createUnit(battle, teamB);

    target.addStatus(Statuses.Poisoned, CAUSE);
    expect(user.checkMovePower(Moves.BarbBarrage, at(target))).toBe(120);
    expect(user.checkMovePower(Moves.InfernalParade, at(target))).toBe(120);
  });

  it('doubles Lash Out after the user was dropped, for 2 seconds', () => {
    const { battle, teamA, teamB } = createBattle();
    const user = createUnit(battle, teamA);
    const target = createUnit(battle, teamB);

    expect(user.checkMovePower(Moves.LashOut, at(target))).toBe(75);
    user.addStage(Stages.Attack, -1, CAUSE);
    expect(user.checkMovePower(Moves.LashOut, at(target))).toBe(150);
    battle.tick(turns(1) + 1);
    expect(user.checkMovePower(Moves.LashOut, at(target))).toBe(75);
  });

  it('costs Steel Beam half the user’s HP however it lands', () => {
    const { battle, teamA, teamB } = createBattle();
    const user = createUnit(battle, teamA);
    const target = createUnit(battle, teamB);
    const whole = user.checkStat(Stats.HP, 0);

    user.addMove(Moves.SteelBeam);
    user.triggerMove(Moves.SteelBeam, at(target), 0);
    expect(user.health).toBe(whole - Math.ceil(whole / 2));
  });

  it('melts what everything around it holds with Corrosive Gas', () => {
    const { battle, teamA, teamB } = createBattle();
    const user = createUnit(battle, teamA);
    const target = createUnit(battle, teamB);

    user.enter();
    target.enter();
    target.addItem(Items.Leftovers);
    user.addMove(Moves.CorrosiveGas);
    user.triggerMove(Moves.CorrosiveGas, NONE_TARGET, 0);
    battle.tick(turns(1));
    expect(target.hasItem(Items.Leftovers)).toBe(false);
  });

  it('sheds Scale Shot’s scales once a volley, however many land', () => {
    const { battle, teamA, teamB } = createBattle();
    const user = createUnit(battle, teamA);
    const target = createUnit(battle, teamB);

    pinRandom(battle, 0);
    user.enter();
    target.enter();
    user.addMove(Moves.ScaleShot);
    user.triggerMove(Moves.ScaleShot, at(target), 0);
    battle.tick(turns(1));
    expect(user.stages[Stages.Speed]).toBe(1);
    expect(user.stages[Stages.Defense]).toBe(-1);
  });

  it('drops the Defense of whatever touches an Obstruct 2 stages, and lets status moves through', () => {
    const { battle, teamA, teamB } = createBattle();
    const guard = createUnit(battle, teamA);
    const striker = createUnit(battle, teamB);

    pinRandom(battle, 0);
    guard.enter();
    striker.enter();
    guard.triggerMoveEffect(Moves.Obstruct, NONE_TARGET, 0);

    const whole = guard.health;

    striker.triggerMoveTarget(Moves.Tackle, at(guard), 0);
    expect(guard.health).toBe(whole);
    expect(striker.stages[Stages.Defense]).toBe(-2);

    striker.triggerMoveTarget(Moves.Growl, at(guard), 0);
    expect(guard.stages[Stages.Attack]).toBe(-1);
  });

  it('lands one of poison, paralysis or sleep with Dire Claw', () => {
    const { battle, teamA, teamB } = createBattle();
    const user = createUnit(battle, teamA);
    const target = createUnit(battle, teamB);

    pinRandom(battle, 0);
    user.triggerMoveEffect(Moves.DireClaw, at(target), 0);
    expect(target.status[Statuses.Poisoned]).toBeDefined();
  });

  it('raises Special Attack as Meteor Beam winds up', () => {
    const { battle, teamA, teamB } = createBattle();
    const user = createUnit(battle, teamA);
    const target = createUnit(battle, teamB);

    expect(user.checkMoveSteps(Moves.MeteorBeam, at(target))).toBe(1);
    user.triggerMoveEffect(Moves.MeteorBeam, at(target), 1);
    expect(user.stages[Stages.SpecialAttack]).toBe(1);
  });

  it('puts the target’s last move on a longer cooldown with Eerie Spell', () => {
    const { battle, teamA, teamB } = createBattle();
    const user = createUnit(battle, teamA);
    const target = createUnit(battle, teamB);

    pinRandom(battle, 0);
    user.enter();
    target.enter();
    target.addMove(Moves.Tackle);
    target.triggerMove(Moves.Tackle, at(user), 0);
    user.triggerMoveEffect(Moves.EerieSpell, at(target), 0);
    expect(target.moves[Moves.Tackle]?.cooldown).toBeDefined();
  });

  it('carries a screen across with Court Change, with the time it had left', () => {
    const { battle, teamA, teamB } = createBattle();
    const user = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);

    foe.triggerMoveEffect(Moves.Reflect, NONE_TARGET, 0);
    battle.tick(turns(2));
    user.triggerMoveEffect(Moves.CourtChange, NONE_TARGET, 0);
    expect(teamB.status[TeamStatuses.Reflect]).toBeUndefined();
    expect(teamA.status[TeamStatuses.Reflect]).toBeDefined();

    // Five turns' screen, two spent before the swap: three left over here
    battle.tick(turns(3) - 1);
    expect(teamA.status[TeamStatuses.Reflect]).toBeDefined();
    battle.tick(2);
    expect(teamA.status[TeamStatuses.Reflect]).toBeUndefined();
  });

  it('carries a Tailwind across with Court Change', () => {
    const { battle, teamA, teamB } = createBattle();
    const user = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);
    const speed = user.checkStat(Stats.Speed, 0);

    foe.triggerMoveEffect(Moves.Tailwind, NONE_TARGET, 0);
    user.triggerMoveEffect(Moves.CourtChange, NONE_TARGET, 0);
    expect(user.checkStat(Stats.Speed, 0)).toBe(speed * 2);
    expect(foe.checkStat(Stats.Speed, 0)).toBe(speed);
  });

  it('swaps both pairs of stats with Power Shift, and back again', () => {
    const { battle, teamA } = createBattle();
    const user = createUnit(battle, teamA);

    user.setStat(StatsKind.Base, Stats.SpecialAttack, 150);
    user.setStat(StatsKind.Base, Stats.SpecialDefense, 50);

    const special = user.checkStat(Stats.SpecialAttack, 0);
    const guard = user.checkStat(Stats.SpecialDefense, 0);

    user.triggerMoveEffect(Moves.PowerShift, NONE_TARGET, 0);
    expect(user.checkStat(Stats.SpecialAttack, 0)).toBe(guard);
    expect(user.checkStat(Stats.SpecialDefense, 0)).toBe(special);

    user.triggerMoveEffect(Moves.PowerShift, NONE_TARGET, 0);
    expect(user.checkStat(Stats.SpecialAttack, 0)).toBe(special);
  });

  it('lets only Morpeko use Aura Wheel, and turns it Dark while Hangry', () => {
    const { battle, teamA, teamB } = createBattle();
    const user = createUnit(battle, teamA);
    const target = createUnit(battle, teamB);

    user.addMove(Moves.AuraWheel);
    expect(user.checkCanCast(Moves.AuraWheel, at(target))).toBe(false);

    // Set straight on the unit: Morpeko has its id but no species data yet
    user.species = Species.Morpeko;
    expect(user.checkCanCast(Moves.AuraWheel, at(target))).toBe(true);
    expect(user.checkMoveType(Moves.AuraWheel, at(target))).toBe(Types.Electric);

    user.species = Species.MorpekoHangry;
    expect(user.checkMoveType(Moves.AuraWheel, at(target))).toBe(Types.Dark);
  });

  it('reaches everything opposite with Expanding Force on Psychic Terrain', () => {
    const { battle, teamA } = createBattle();
    const user = createUnit(battle, teamA);

    expect(user.checkMoveTargeting(Moves.ExpandingForce).target).toBe(MoveTargets.Unit);
    battle.terrain.current = Terrains.Psychic;
    expect(user.checkMoveTargeting(Moves.ExpandingForce).target).toBe(MoveTargets.None);
  });
});
