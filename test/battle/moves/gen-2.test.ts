import { describe, expect, it } from 'vitest';
import { MoveTargetType } from '../../../src/battle/events';
import type Unit from '../../../src/battle/unit';
import { Stages, Stats } from '../../../src/data/constants/stats';
import { Moves } from '../../../src/data/ids/moves';
import { Statuses, Weathers } from '../../../src/data/ids/status';
import { createBattle, createUnit, pinRandom } from '../harness';

function unitTarget(unit: Unit): { readonly type: MoveTargetType.Unit; readonly unit: Unit } {
  return { type: MoveTargetType.Unit, unit } as const;
}

const NONE_TARGET = { type: MoveTargetType.None } as const;

describe('the stages a Johto move pushes as it lands', () => {
  it('sharpens the user rather than what it hit', () => {
    const { battle, teamA, teamB } = createBattle();
    pinRandom(battle, 0);
    const attacker = createUnit(battle, teamA);
    const defender = createUnit(battle, teamB);

    attacker.triggerMoveTarget(Moves.MetalClaw, unitTarget(defender), 0);

    expect(attacker.stages[Stages.Attack]).toBe(1);
    expect(defender.stages[Stages.Attack]).toBe(0);
  });

  it('dents what it hit rather than the user', () => {
    const { battle, teamA, teamB } = createBattle();
    pinRandom(battle, 0);
    const attacker = createUnit(battle, teamA);
    const defender = createUnit(battle, teamB);

    attacker.triggerMoveTarget(Moves.IronTail, unitTarget(defender), 0);

    expect(defender.stages[Stages.Defense]).toBe(-1);
    expect(attacker.stages[Stages.Defense]).toBe(0);
  });

  it('raises every one of them at once for Ancient Power', () => {
    const { battle, teamA, teamB } = createBattle();
    pinRandom(battle, 0);
    const attacker = createUnit(battle, teamA);
    const defender = createUnit(battle, teamB);

    attacker.triggerMoveTarget(Moves.AncientPower, unitTarget(defender), 0);

    for (const stage of [
      Stages.Attack,
      Stages.Defense,
      Stages.SpecialAttack,
      Stages.SpecialDefense,
      Stages.Speed,
    ]) {
      expect(attacker.stages[stage]).toBe(1);
    }
    // The rest of the scale is left alone: it raises the five that
    // fight, not the two that decide whether a move connects
    expect(attacker.stages[Stages.Accuracy]).toBe(0);
    expect(attacker.stages[Stages.Evasion]).toBe(0);
  });
});

describe('the heals that read the sky', () => {
  function heal(weather: Weathers): number {
    const { battle, teamA } = createBattle();
    const unit = createUnit(battle, teamA);

    battle.setWeather(weather);
    unit.setHealth(40);
    unit.triggerMoveEffect(Moves.MorningSun, NONE_TARGET, 0);

    return unit.health;
  }

  it('puts back half under a clear sky, more in the sun and little else', () => {
    expect(heal(Weathers.None)).toBe(120); // 40 + 160 / 2
    expect(heal(Weathers.Sunny)).toBeCloseTo(40 + 160 * (2 / 3));
    expect(heal(Weathers.Rain)).toBe(80); // 40 + 160 / 4
    expect(heal(Weathers.Sandstorm)).toBe(80);
  });
});

describe('Outrage', () => {
  it('leaves the user confused when the rampage ends', () => {
    const { battle, teamA, teamB } = createBattle();
    pinRandom(battle, 0);
    const attacker = createUnit(battle, teamA);
    const defender = createUnit(battle, teamB);

    // The steps before the last one are the rampage; the fatigue is
    // paid on the step that lands
    attacker.triggerMoveEffect(Moves.Outrage, unitTarget(defender), 1);
    expect(attacker.status[Statuses.Confused]).toBeUndefined();

    attacker.triggerMoveEffect(Moves.Outrage, unitTarget(defender), 0);
    expect(attacker.status[Statuses.Confused]).toBeDefined();
  });
});

describe('Giga Drain', () => {
  it('takes back half of what it deals', () => {
    const { battle, teamA, teamB } = createBattle();
    pinRandom(battle, 1);
    const attacker = createUnit(battle, teamA);
    const defender = createUnit(battle, teamB);

    attacker.setHealth(20);
    attacker.triggerMoveEffect(Moves.GigaDrain, unitTarget(defender), 0);

    const dealt = defender.checkStat(Stats.HP, 0) - defender.health;

    expect(dealt).toBeGreaterThan(0);
    expect(attacker.health).toBeCloseTo(20 + dealt / 2);
  });
});

describe('Whirlpool', () => {
  it('binds whatever it hits', () => {
    const { battle, teamA, teamB } = createBattle();
    pinRandom(battle, 0);
    const attacker = createUnit(battle, teamA);
    const defender = createUnit(battle, teamB);

    attacker.triggerMoveTarget(Moves.Whirlpool, unitTarget(defender), 0);

    expect(defender.status[Statuses.Trapped]).toBeDefined();
  });
});

describe('Swagger', () => {
  it('flatters the target into swinging harder while it is confused', () => {
    const { battle, teamA, teamB } = createBattle();
    pinRandom(battle, 0);
    const attacker = createUnit(battle, teamA);
    const defender = createUnit(battle, teamB);

    attacker.triggerMoveEffect(Moves.Swagger, unitTarget(defender), 0);

    expect(defender.stages[Stages.Attack]).toBe(2);
    expect(defender.status[Statuses.Confused]).toBeDefined();
  });
});
