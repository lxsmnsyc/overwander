import { describe, expect, it } from 'vitest';
import { setupChooseMoveAI, weighCall } from '../../src/battle/ai/choose-move';
import { BASE_SCORE, RISKY_PENALTY } from '../../src/battle/ai/score';
import {
  BattleEvents,
  type CheckUnitAIMoveScoreEvent,
  EffectType,
  type MoveTarget,
  MoveTargetType,
} from '../../src/battle/events';
import { groundMove } from '../../src/battle/moves/ground';
import type Unit from '../../src/battle/unit';
import { unitTarget } from '../../src/battle/utils';
import { Moves } from '../../src/data/ids/moves';
import { Statuses } from '../../src/data/ids/status';
import { type BattleHarness, createBattle, createUnit, pinRandom } from './harness';

function createAIBattle(): BattleHarness {
  const harness = createBattle('test-seed');
  setupChooseMoveAI(harness.battle);
  pinRandom(harness.battle, 0.99);
  return harness;
}

function scoreMove(
  battle: BattleHarness['battle'],
  source: Unit,
  move: Moves,
  target: MoveTarget,
): number {
  const event: CheckUnitAIMoveScoreEvent = {
    id: 'CheckUnitAIMoveScore',
    disabled: false,
    source,
    move,
    target,
    score: BASE_SCORE,
  };
  battle.emit(BattleEvents.CheckUnitAIMoveScore, event);
  return event.score;
}

describe('weighing a move that calls another', () => {
  it('weighs Nature Power as the move the ground calls', () => {
    const { battle, teamA, teamB } = createAIBattle();
    const unit = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);
    const target = unitTarget(foe);

    expect(scoreMove(battle, unit, Moves.NaturePower, target)).toBe(
      weighCall(battle, unit, groundMove(battle), target),
    );
  });

  it('weighs Sleep Talk as the average of what it could draw', () => {
    const { battle, teamA, teamB } = createAIBattle();
    const unit = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);
    const target = unitTarget(foe);
    unit.addMove(Moves.Tackle);
    unit.addMove(Moves.Growl);
    unit.addMove(Moves.SleepTalk);
    unit.addStatus(Statuses.Sleeping, { type: EffectType.None });

    const tackle = weighCall(battle, unit, Moves.Tackle, target) ?? 0;
    const growl = weighCall(battle, unit, Moves.Growl, target) ?? 0;

    expect(scoreMove(battle, unit, Moves.SleepTalk, target)).toBe(Math.round((tackle + growl) / 2));
  });

  it('weighs Metronome as a gamble that only beats doing nothing', () => {
    const { battle, teamA, teamB } = createAIBattle();
    const unit = createUnit(battle, teamA);
    createUnit(battle, teamB);

    expect(scoreMove(battle, unit, Moves.Metronome, { type: MoveTargetType.None })).toBe(
      BASE_SCORE - RISKY_PENALTY,
    );
  });

  it('weighs Me First as the move it takes, and more', () => {
    const { battle, teamA, teamB } = createAIBattle();
    const unit = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);
    foe.addMove(Moves.Tackle);

    foe.cast(Moves.Tackle, unitTarget(unit));

    expect(scoreMove(battle, unit, Moves.MeFirst, unitTarget(foe))).toBeGreaterThanOrEqual(
      weighCall(battle, unit, Moves.Tackle, unitTarget(foe)) ?? Infinity,
    );
  });

  it('weighs Mirror Move as what the target last used', () => {
    const { battle, teamA, teamB } = createAIBattle();
    const unit = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);
    foe.addMove(Moves.SwordsDance);

    foe.cast(Moves.SwordsDance, { type: MoveTargetType.None });
    battle.tick(4000);

    expect(scoreMove(battle, unit, Moves.MirrorMove, unitTarget(foe))).toBe(
      weighCall(battle, unit, Moves.SwordsDance, unitTarget(foe)),
    );
  });
});
