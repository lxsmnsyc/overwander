import { describe, expect, it } from 'vitest';
import { EffectType, MoveTargetType } from '../../../src/battle/events';
import type Unit from '../../../src/battle/unit';
import { Stages } from '../../../src/data/constants/stats';
import { Moves } from '../../../src/data/ids/moves';
import { Statuses, TeamStatuses, Weathers } from '../../../src/data/ids/status';
import turns from '../../../src/battle/turn';
import { createBattle, createUnit, pinRandom } from '../harness';

const NONE_TARGET = { type: MoveTargetType.None } as const;
const MOVE_CAUSE = { type: EffectType.None } as const;

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
