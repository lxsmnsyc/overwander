import { describe, expect, it } from 'vitest';
import { EffectType, MoveTargetType } from '../../../src/battle/events';
import type Unit from '../../../src/battle/unit';
import { Stages, Stats } from '../../../src/data/constants/stats';
import { Moves } from '../../../src/data/ids/moves';
import { Statuses } from '../../../src/data/ids/status';
import { MULTI_HIT_MOVES } from '../../../src/data/moves/multi-hit';
import { RECOIL_MOVES } from '../../../src/data/moves/recoil';
import { getMoveData } from '../../../src/data/moves';
import { createBattle, createUnit, pinRandom } from '../harness';

const NONE_TARGET = { type: MoveTargetType.None } as const;

function unitTarget(unit: Unit): { readonly type: MoveTargetType.Unit; readonly unit: Unit } {
  return { type: MoveTargetType.Unit, unit } as const;
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
});
