import { describe, expect, it } from 'vitest';
import { EffectType, MoveTargetType } from '../../../src/battle/events';
import type Unit from '../../../src/battle/unit';
import { Stages } from '../../../src/data/constants/stats';
import { Types } from '../../../src/data/constants/types';
import { Moves } from '../../../src/data/ids/moves';
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
