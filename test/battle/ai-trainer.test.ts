import { describe, expect, it } from 'vitest';
import { setupChooseMoveAI } from '../../src/battle/ai/choose-move';
import setupIdleAI from '../../src/battle/ai/idle';
import { getTrainer } from '../../src/battle/ai/trainer';
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
});
