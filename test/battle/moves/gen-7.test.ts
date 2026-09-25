import { describe, expect, it } from 'vitest';
import { AttackPriority, EventPriority } from '../../../src/core/event-emitter';
import { BattleEvents, EffectType, MoveTargetType } from '../../../src/battle/events';
import type Unit from '../../../src/battle/unit';
import { Stages, Stats, StatsKind } from '../../../src/data/constants/stats';
import { Types } from '../../../src/data/constants/types';
import Abilities from '../../../src/data/ids/abilities';
import { Items } from '../../../src/data/ids/items';
import { MoveCategories, Moves } from '../../../src/data/ids/moves';
import { Statuses, TeamStatuses, Terrains, Weathers } from '../../../src/data/ids/status';
import turns from '../../../src/battle/turn';
import { createBattle, createUnit, pinRandom } from '../harness';

const NONE_TARGET = { type: MoveTargetType.None } as const;
const MOVE_CAUSE = { type: EffectType.None } as const;

function damageOf(source: Unit, move: Moves, target: Unit): number {
  const before = target.health;

  source.triggerMoveEffect(move, unitTarget(target), 0);

  const dealt = before - target.health;

  target.setHealth(before);
  return dealt;
}

function unitTarget(unit: Unit): { readonly type: MoveTargetType.Unit; readonly unit: Unit } {
  return { type: MoveTargetType.Unit, unit } as const;
}

describe("Alola's moves that ride what was already there", () => {
  it('drops both attacking stats with Tearful Look, and poisons and slows with Toxic Thread', () => {
    const { battle, teamA, teamB } = createBattle();
    const caster = createUnit(battle, teamA);
    const target = createUnit(battle, teamB);

    pinRandom(battle, 0);
    caster.triggerMoveEffect(Moves.TearfulLook, unitTarget(target), 0);
    expect(target.stages[Stages.Attack]).toBe(-1);
    expect(target.stages[Stages.SpecialAttack]).toBe(-1);

    caster.triggerMoveEffect(Moves.ToxicThread, unitTarget(target), 0);
    expect(target.status[Statuses.Poisoned]).toBeDefined();
    expect(target.stages[Stages.Speed]).toBe(-1);
  });

  it('breaks the screens with Psychic Fangs the way Brick Break does', () => {
    const { battle, teamA, teamB } = createBattle();
    pinRandom(battle, 0);
    const biter = createUnit(battle, teamA);
    const target = createUnit(battle, teamB);

    target.triggerMoveEffect(Moves.Reflect, NONE_TARGET, 0);
    biter.triggerMove(Moves.PsychicFangs, unitTarget(target), 0);
    battle.tick(turns(1));

    expect(target.team.status[TeamStatuses.Reflect]).toBeUndefined();
  });

  it('spends one entrance on First Impression, shared with Fake Out', () => {
    const { battle, teamA, teamB } = createBattle();
    const bug = createUnit(battle, teamA);
    const target = createUnit(battle, teamB);

    bug.addMove(Moves.FirstImpression);
    bug.addMove(Moves.FakeOut);
    bug.enter();
    expect(bug.checkCanCast(Moves.FirstImpression, NONE_TARGET)).toBe(true);

    bug.triggerMove(Moves.FirstImpression, unitTarget(target), 0);
    expect(bug.checkCanCast(Moves.FirstImpression, NONE_TARGET)).toBe(false);
    expect(bug.checkCanCast(Moves.FakeOut, NONE_TARGET)).toBe(false);
  });

  it('adds 20 to Power Trip for each stage raised, and winds Solar Blade up out of the sun', () => {
    const { battle, teamA, teamB } = createBattle();
    const caster = createUnit(battle, teamA);
    const target = createUnit(battle, teamB);

    caster.addStage(Stages.Attack, 2, MOVE_CAUSE);
    caster.addStage(Stages.Speed, 1, MOVE_CAUSE);
    expect(caster.checkMovePower(Moves.PowerTrip, unitTarget(target))).toBe(80);

    expect(caster.checkMoveSteps(Moves.SolarBlade, unitTarget(target))).toBe(1);
    teamA.weather.current = Weathers.Sunny;
    expect(caster.checkMoveSteps(Moves.SolarBlade, unitTarget(target))).toBe(0);
  });
});

describe("Alola's guards and field moves", () => {
  it('poisons whatever touches a Baneful Bunker', () => {
    const { battle, teamA, teamB } = createBattle();
    const guard = createUnit(battle, teamA);
    const striker = createUnit(battle, teamB);

    pinRandom(battle, 1);
    guard.enter();
    striker.enter();
    guard.triggerMoveEffect(Moves.BanefulBunker, NONE_TARGET, 0);

    const whole = guard.health;

    striker.triggerMoveTarget(Moves.Tackle, unitTarget(guard), 0);
    expect(guard.health).toBe(whole);
    expect(striker.status[Statuses.Poisoned]).toBeDefined();
  });

  it('raises Aurora Veil only in hail or snow, and cuts both kinds of damage once', () => {
    const { battle, teamA, teamB } = createBattle();
    const veil = createUnit(battle, teamA);
    const striker = createUnit(battle, teamB);

    pinRandom(battle, 1);
    veil.enter();
    striker.enter();
    veil.addMove(Moves.AuroraVeil);
    expect(veil.checkCanCast(Moves.AuroraVeil, NONE_TARGET)).toBe(false);
    teamA.weather.current = Weathers.Snow;
    expect(veil.checkCanCast(Moves.AuroraVeil, NONE_TARGET)).toBe(true);

    const plain = damageOf(striker, Moves.Tackle, veil);
    const special = damageOf(striker, Moves.Swift, veil);

    veil.triggerMoveEffect(Moves.AuroraVeil, NONE_TARGET, 0);
    expect(teamA.status[TeamStatuses.AuroraVeil]).toBeDefined();

    const veiled = damageOf(striker, Moves.Tackle, veil);

    expect(veiled).toBeLessThan(plain);
    expect(damageOf(striker, Moves.Swift, veil)).toBeLessThan(special);

    // Reflect under it does not cut the same blow twice
    veil.triggerMoveEffect(Moves.Reflect, NONE_TARGET, 0);
    expect(damageOf(striker, Moves.Tackle, veil)).toBe(veiled);
  });

  it('turns quick moves from the other side away from a grounded unit on Psychic Terrain', () => {
    const { battle, teamA, teamB } = createBattle();
    const layer = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);

    layer.enter();
    enemy.enter();
    layer.triggerMoveEffect(Moves.PsychicTerrain, NONE_TARGET, 0);
    expect(layer.checkTerrain()).toBe(Terrains.Psychic);

    expect(enemy.checkMoveImmunity(Moves.QuickAttack, unitTarget(layer), Types.Normal)).toBe(true);
    expect(enemy.checkMoveImmunity(Moves.Tackle, unitTarget(layer), Types.Normal)).toBe(false);
  });

  it('puts up a screen behind Glitzy Glow and Baddy Bad, and centres the target of a Spotlight', () => {
    const { battle, teamA, teamB } = createBattle();
    const caster = createUnit(battle, teamA);
    const target = createUnit(battle, teamB);

    pinRandom(battle, 1);
    caster.enter();
    target.enter();
    caster.triggerMoveEffect(Moves.GlitzyGlow, unitTarget(target), 0);
    expect(teamA.status[TeamStatuses.LightScreen]).toBeDefined();
    caster.triggerMoveEffect(Moves.BaddyBad, unitTarget(target), 0);
    expect(teamA.status[TeamStatuses.Reflect]).toBeDefined();

    caster.triggerMoveEffect(Moves.Spotlight, unitTarget(target), 0);
    expect(target.status[Statuses.Centered]).toBeDefined();
  });
});

describe("Alola's moves with rules of their own", () => {
  it('heals more with Shore Up in a sandstorm, and hands a teammate Floral Healing', () => {
    const { battle, teamA } = createBattle();
    const unit = createUnit(battle, teamA);
    const mate = createUnit(battle, teamA);

    unit.setHealth(1);
    unit.triggerMoveEffect(Moves.ShoreUp, NONE_TARGET, 0);
    const plain = unit.health - 1;

    unit.setHealth(1);
    teamA.weather.current = Weathers.Sandstorm;
    unit.triggerMoveEffect(Moves.ShoreUp, NONE_TARGET, 0);
    expect(unit.health - 1).toBeGreaterThan(plain);

    mate.setHealth(1);
    unit.triggerMoveEffect(Moves.FloralHealing, unitTarget(mate), 0);
    expect(mate.health - 1).toBe(plain);
  });

  it("drains the target's Attack with Strength Sap, and fails at the floor", () => {
    const { battle, teamA, teamB } = createBattle();
    const sapper = createUnit(battle, teamA);
    const target = createUnit(battle, teamB);

    sapper.setHealth(1);
    sapper.triggerMoveEffect(Moves.StrengthSap, unitTarget(target), 0);
    expect(sapper.health).toBeGreaterThan(1);
    expect(target.stages[Stages.Attack]).toBe(-1);

    target.addStage(Stages.Attack, -6, MOVE_CAUSE);
    const before = sapper.health;

    sapper.triggerMoveEffect(Moves.StrengthSap, unitTarget(target), 0);
    expect(sapper.health).toBe(before);
  });

  it('cleans a status up with Purify and is paid in health, and washes a burn off with Sparkling Aria', () => {
    const { battle, teamA, teamB } = createBattle();
    const caster = createUnit(battle, teamA);
    const target = createUnit(battle, teamB);

    pinRandom(battle, 1);
    target.addStatus(Statuses.Poisoned, MOVE_CAUSE);
    caster.setHealth(1);
    caster.triggerMoveEffect(Moves.Purify, unitTarget(target), 0);
    expect(target.status[Statuses.Poisoned]).toBeUndefined();
    expect(caster.health).toBeGreaterThan(1);

    target.addStatus(Statuses.Burned, MOVE_CAUSE);
    caster.triggerMoveEffect(Moves.SparklingAria, unitTarget(target), 0);
    expect(target.status[Statuses.Burned]).toBeUndefined();
  });

  it('lands the next move as a critical hit after Laser Focus', () => {
    const { battle, teamA, teamB } = createBattle();
    const focused = createUnit(battle, teamA);
    const target = createUnit(battle, teamB);
    const criticals: boolean[] = [];

    battle.on(BattleEvents.UnitAttackResolveCriticalHit, EventPriority.Post, (event) => {
      criticals.push(event.critical);
    });
    pinRandom(battle, 0.99);
    focused.triggerMove(Moves.LaserFocus, NONE_TARGET, 0);
    battle.tick(turns(1));
    focused.triggerMove(Moves.Tackle, unitTarget(target), 0);
    battle.tick(turns(1));
    focused.triggerMove(Moves.Tackle, unitTarget(target), 0);
    battle.tick(turns(1));

    expect(criticals[0]).toBe(true);
    expect(criticals.at(-1)).toBe(false);
  });

  it('stops sound moves after Throat Chop', () => {
    const { battle, teamA, teamB } = createBattle();
    const chopper = createUnit(battle, teamA);
    const singer = createUnit(battle, teamB);

    pinRandom(battle, 1);
    singer.addMove(Moves.HyperVoice);
    singer.addMove(Moves.Tackle);
    chopper.triggerMoveEffect(Moves.ThroatChop, unitTarget(singer), 0);
    expect(singer.checkCanCast(Moves.HyperVoice, NONE_TARGET)).toBe(false);
    expect(singer.checkCanCast(Moves.Tackle, NONE_TARGET)).toBe(true);
    battle.tick(turns(3));
    expect(singer.checkCanCast(Moves.HyperVoice, NONE_TARGET)).toBe(true);
  });

  it('heals a teammate with Pollen Puff instead of hitting it', () => {
    const { battle, teamA, teamB } = createBattle();
    const puffer = createUnit(battle, teamA);
    const mate = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);

    pinRandom(battle, 1);
    mate.setHealth(10);
    puffer.triggerMoveEffect(Moves.PollenPuff, unitTarget(mate), 0);
    expect(mate.health).toBe(10 + mate.checkStat(Stats.HP, 0) / 2);

    const whole = enemy.health;

    puffer.triggerMoveEffect(Moves.PollenPuff, unitTarget(enemy), 0);
    expect(enemy.health).toBeLessThan(whole);
  });

  it('only lets a Fire type Burn Up, and puts its fire out', () => {
    const { battle, teamA, teamB } = createBattle();
    const plain = createUnit(battle, teamA);
    const fire = createUnit(battle, teamA, [Types.Fire]);
    const target = createUnit(battle, teamB);

    plain.addMove(Moves.BurnUp);
    fire.addMove(Moves.BurnUp);
    expect(plain.checkCanCast(Moves.BurnUp, unitTarget(target))).toBe(false);
    expect(fire.checkCanCast(Moves.BurnUp, unitTarget(target))).toBe(true);

    pinRandom(battle, 1);
    fire.triggerMoveEffect(Moves.BurnUp, unitTarget(target), 0);
    expect(fire.types.has(Types.Fire)).toBe(false);
  });

  it('trades Speed with Speed Swap', () => {
    const { battle, teamA, teamB } = createBattle();
    const slow = createUnit(battle, teamA);
    const fast = createUnit(battle, teamB);

    slow.setStat(StatsKind.Base, Stats.Speed, 20);
    const mine = slow.checkStat(Stats.Speed, 0);
    const theirs = fast.checkStat(Stats.Speed, 0);

    slow.triggerMoveEffect(Moves.SpeedSwap, unitTarget(fast), 0);
    expect(slow.checkStat(Stats.Speed, 0)).toBe(theirs);
    expect(fast.checkStat(Stats.Speed, 0)).toBe(mine);
  });

  it("throws Revelation Dance as the user's type and Multi-Attack as its Memory's", () => {
    const { battle, teamA, teamB } = createBattle();
    const dancer = createUnit(battle, teamA, [Types.Fire]);
    const target = createUnit(battle, teamB);

    expect(dancer.checkMoveType(Moves.RevelationDance, unitTarget(target))).toBe(Types.Fire);
    expect(dancer.checkMoveType(Moves.MultiAttack, unitTarget(target))).toBe(Types.Normal);
    dancer.addItem(Items.WaterMemory);
    expect(dancer.checkMoveType(Moves.MultiAttack, unitTarget(target))).toBe(Types.Water);
  });

  it('raises the Plus and Minus side with Gear Up, and takes an ability off a target that has moved with Core Enforcer', () => {
    const { battle, teamA, teamB } = createBattle();
    const gear = createUnit(battle, teamA);
    const plus = createUnit(battle, teamA);
    const target = createUnit(battle, teamB);

    plus.addAbility(Abilities.Plus);
    gear.triggerMoveEffect(Moves.GearUp, NONE_TARGET, 0);
    expect(plus.stages[Stages.Attack]).toBe(1);
    expect(gear.stages[Stages.Attack]).toBe(0);

    pinRandom(battle, 1);
    target.addAbility(Abilities.Levitate);
    gear.triggerMoveEffect(Moves.CoreEnforcer, unitTarget(target), 0);
    expect(target.hasAbility(Abilities.Levitate)).toBe(false);
  });

  it('makes the target throw its last move again with Instruct', () => {
    const { battle, teamA, teamB } = createBattle();
    const teacher = createUnit(battle, teamA);
    const pupil = createUnit(battle, teamA);
    const target = createUnit(battle, teamB);
    const thrown: Moves[] = [];

    battle.on(BattleEvents.UnitTriggerMove, AttackPriority.Post, (event) => {
      if (event.source === pupil) {
        thrown.push(event.move);
      }
    });
    teacher.triggerMoveEffect(Moves.Instruct, unitTarget(pupil), 0);
    expect(thrown).toEqual([]);

    pupil.triggerMove(Moves.SwordsDance, NONE_TARGET, 0);
    teacher.triggerMoveEffect(Moves.Instruct, unitTarget(pupil), 0);
    expect(thrown).toEqual([Moves.SwordsDance, Moves.SwordsDance]);
    expect(target.alive).toBe(true);
  });

  it('burns what touches a Beak Blast wind-up, and fires a Shell Trap only when struck', () => {
    const { battle, teamA, teamB } = createBattle();
    const bird = createUnit(battle, teamA);
    const crab = createUnit(battle, teamA);
    const striker = createUnit(battle, teamB);

    pinRandom(battle, 1);
    for (const unit of [bird, crab, striker]) {
      unit.enter();
    }
    bird.addMove(Moves.BeakBlast);
    bird.cast(Moves.BeakBlast, unitTarget(striker));
    expect(bird.casting?.move).toBe(Moves.BeakBlast);
    striker.triggerMoveTarget(Moves.Tackle, unitTarget(bird), 0);
    expect(striker.status[Statuses.Burned]).toBeDefined();

    expect(crab.checkTriggerMove(Moves.ShellTrap, NONE_TARGET, 0)).toBe(false);
    crab.addMove(Moves.ShellTrap);
    crab.cast(Moves.ShellTrap, NONE_TARGET);
    const whole = striker.health;

    striker.triggerMoveTarget(Moves.Tackle, unitTarget(crab), 0);
    battle.tick(turns(1));
    expect(crab.casting).toBeUndefined();
    expect(striker.health).toBeLessThan(whole);
  });

  it('doubles Stomping Tantrum after a failed move', () => {
    const { battle, teamA, teamB } = createBattle();
    const stomper = createUnit(battle, teamA);
    const target = createUnit(battle, teamB);
    const plain = stomper.checkMovePower(Moves.StompingTantrum, unitTarget(target));

    stomper.triggerMove(Moves.Purify, unitTarget(target), 0);
    battle.tick(turns(1));
    stomper.triggerMove(Moves.StompingTantrum, unitTarget(target), 0);
    expect(stomper.checkMovePower(Moves.StompingTantrum, unitTarget(target))).toBe(
      (plain ?? 0) * 2,
    );
  });

  it('steals raised stages with Spectral Thief, and costs half the HP with Mind Blown', () => {
    const { battle, teamA, teamB } = createBattle();
    const thief = createUnit(battle, teamA);
    const target = createUnit(battle, teamB);

    pinRandom(battle, 1);
    target.addStage(Stages.Attack, 2, MOVE_CAUSE);
    target.addStage(Stages.Defense, -1, MOVE_CAUSE);
    thief.triggerMoveEffect(Moves.SpectralThief, unitTarget(target), 0);
    expect(thief.stages[Stages.Attack]).toBe(2);
    expect(target.stages[Stages.Attack]).toBe(0);
    expect(target.stages[Stages.Defense]).toBe(-1);

    const max = thief.checkStat(Stats.HP, 0);

    thief.setHealth(max);
    thief.triggerMove(Moves.MindBlown, NONE_TARGET, 0);
    expect(thief.health).toBe(max - Math.ceil(max / 2));
  });

  it('turns Normal moves Electric after Plasma Fists, and lands Photon Geyser physical off a higher Attack', () => {
    const { battle, teamA, teamB } = createBattle();
    const puncher = createUnit(battle, teamA);
    const target = createUnit(battle, teamB);
    const categories: MoveCategories[] = [];

    pinRandom(battle, 1);
    puncher.triggerMoveEffect(Moves.PlasmaFists, unitTarget(target), 0);
    expect(target.checkMoveType(Moves.Tackle, unitTarget(puncher))).toBe(Types.Electric);

    battle.on(BattleEvents.UnitAttack, AttackPriority.Post, (event) => {
      if (event.move === Moves.PhotonGeyser) {
        categories.push(event.category);
      }
    });
    puncher.triggerMoveEffect(Moves.PhotonGeyser, unitTarget(target), 0);
    puncher.addStage(Stages.Attack, 2, MOVE_CAUSE);
    puncher.triggerMoveEffect(Moves.PhotonGeyser, unitTarget(target), 0);
    expect(categories).toEqual([MoveCategories.Special, MoveCategories.Physical]);
  });

  it('seeds with Sappy Seed, clears with Freezy Frost and cures the party with Sparkly Swirl', () => {
    const { battle, teamA, teamB } = createBattle();
    const partner = createUnit(battle, teamA);
    const mate = createUnit(battle, teamA);
    const target = createUnit(battle, teamB);

    pinRandom(battle, 1);
    partner.triggerMoveEffect(Moves.SappySeed, unitTarget(target), 0);
    expect(target.status[Statuses.Seeding]).toBeDefined();

    target.addStage(Stages.Attack, 2, MOVE_CAUSE);
    partner.triggerMoveEffect(Moves.FreezyFrost, unitTarget(target), 0);
    expect(target.stages[Stages.Attack]).toBe(0);

    mate.addStatus(Statuses.Burned, MOVE_CAUSE);
    partner.triggerMoveEffect(Moves.SparklySwirl, unitTarget(target), 0);
    expect(mate.status[Statuses.Burned]).toBeUndefined();
  });
});
