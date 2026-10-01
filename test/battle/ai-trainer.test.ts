import { describe, expect, it } from 'vitest';
import { chooseMove, setupChooseMoveAI } from '../../src/battle/ai/choose-move';
import setupIdleAI from '../../src/battle/ai/idle';
import { getTrainer } from '../../src/battle/ai/trainer';
import { unitTarget } from '../../src/battle/utils';
import { MoveTargetType } from '../../src/battle/events';
import { Moves } from '../../src/data/ids/moves';
import { type BattleHarness, createBattle, createUnit, pinRandom } from './harness';

function createTrainerBattle(): BattleHarness {
  const harness = createBattle();
  setupChooseMoveAI(harness.battle);
  setupIdleAI(harness.battle);
  pinRandom(harness.battle, 0.99);
  return harness;
}

describe('the invisible trainer', () => {
  it('is one per team', () => {
    const { battle, teamA, teamB } = createTrainerBattle();

    expect(getTrainer(battle, teamA)).toBe(getTrainer(battle, teamA));
    expect(getTrainer(battle, teamA)).not.toBe(getTrainer(battle, teamB));
  });

  it('decides what its units cast', () => {
    const { battle, teamA, teamB } = createTrainerBattle();
    const unit = createUnit(battle, teamA);
    createUnit(battle, teamB);
    unit.addMove(Moves.Tackle);
    unit.addMove(Moves.Growl);

    // Left to itself the unit would Tackle; its trainer says otherwise
    getTrainer(battle, teamA).order = () => ({
      move: Moves.Growl,
      target: { type: MoveTargetType.None },
    });

    unit.enter();
    battle.tick(16);

    expect(unit.casting?.move).toBe(Moves.Growl);
  });

  it('can leave a free unit standing', () => {
    const { battle, teamA, teamB } = createTrainerBattle();
    const unit = createUnit(battle, teamA);
    createUnit(battle, teamB);
    unit.addMove(Moves.Tackle);

    getTrainer(battle, teamA).order = () => undefined;

    unit.enter();
    battle.tick(16);

    expect(unit.casting).toBeUndefined();
  });

  it('finishes a foe a teammate’s hit leaves in reach, and spares one it will finish', () => {
    const { battle, teamA, teamB } = createTrainerBattle();
    const unit = createUnit(battle, teamA);
    const friend = createUnit(battle, teamA);
    const doomed = createUnit(battle, teamB);
    const other = createUnit(battle, teamB);
    unit.addMove(Moves.Tackle);
    friend.addMove(Moves.Tackle);
    friend.addMove(Moves.HyperBeam);

    // Out of one Tackle's reach, but not of two
    doomed.setHealth(30);
    friend.cast(Moves.Tackle, unitTarget(doomed));

    expect(chooseMove(battle, unit)?.target).toEqual(unitTarget(doomed));

    // A Hyper Beam on the way finishes it, so the Tackle goes elsewhere
    friend.stopCast();
    friend.cast(Moves.HyperBeam, unitTarget(doomed));

    expect(chooseMove(battle, unit)?.target).toEqual(unitTarget(other));
  });

  it('holds a unit for a much better move about to come off cooldown', () => {
    const { battle, teamA, teamB } = createTrainerBattle();
    const unit = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);
    unit.addMove(Moves.Tackle);
    unit.addMove(Moves.Thunderbolt);
    // Thunderbolt finishes it, a Tackle does not
    foe.setHealth(35);

    const cooling = unit.moves[Moves.Thunderbolt];
    const trainer = getTrainer(battle, teamA);

    if (cooling == null) {
      throw new Error('Thunderbolt was not learned');
    }
    cooling.cooldown = { progress: 0, duration: 500 };

    expect(trainer.order(unit, 0)).toBeUndefined();

    // Too long a wait to be worth it, so it chips instead
    cooling.cooldown = { progress: 0, duration: 10_000 };

    expect(trainer.order(unit, 0)?.move).toBe(Moves.Tackle);
  });

  it('keeps a unit on guard with Protect, but not for ever', () => {
    const { battle, teamA, teamB } = createTrainerBattle();
    const unit = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);
    unit.addMove(Moves.Tackle);
    unit.addMove(Moves.Protect);
    foe.addMove(Moves.Tackle);
    const trainer = getTrainer(battle, teamA);

    expect(trainer.order(unit, 0)).toBeUndefined();
    expect(trainer.order(unit, 500)).toBeUndefined();

    // The foe commits, and the guard answers it
    foe.cast(Moves.Tackle, unitTarget(unit));
    expect(trainer.order(unit, 600)?.move).toBe(Moves.Protect);

    // A foe that never commits is not waited out
    foe.stopCast();
    expect(trainer.order(unit, 700)).toBeUndefined();
    expect(trainer.order(unit, 2000)?.move).toBe(Moves.Tackle);
  });
});
