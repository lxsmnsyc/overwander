import { describe, expect, it } from 'vitest';
import { chooseMove, setupChooseMoveAI } from '../../src/battle/ai/choose-move';
import { setupIdleAI } from '../../src/battle/ai/idle';
import { checkTeamUnit, checkUnitRating } from '../../src/battle/ai/rating';
import { EffectType, MoveTargetType } from '../../src/battle/events';
import { Stages } from '../../src/data/constants/stats';
import { Types } from '../../src/data/constants/types';
import { Moves, MoveTargetPriorities } from '../../src/data/ids/moves';
import { Statuses } from '../../src/data/ids/status';
import { createBattle, createUnit, pinRandom } from './harness';

const NONE_CAUSE = { type: EffectType.None } as const;

function createAIBattle() {
  const harness = createBattle();
  setupChooseMoveAI(harness.battle);
  return harness;
}

describe('unit rating', () => {
  it('rates healthier units higher and penalizes statuses', () => {
    const { battle, teamA } = createBattle();
    const healthy = createUnit(battle, teamA);
    const hurt = createUnit(battle, teamA);
    const statused = createUnit(battle, teamA);
    hurt.setHealth(40);
    statused.addStatus(Statuses.Burned, NONE_CAUSE);

    const healthyRating = checkUnitRating(battle, healthy);

    expect(healthyRating).toBeGreaterThan(checkUnitRating(battle, hurt));
    expect(healthyRating).toBeGreaterThan(checkUnitRating(battle, statused));
  });

  it('picks the strongest and weakest team members with exclusion', () => {
    const { battle, teamA } = createBattle();
    const strong = createUnit(battle, teamA);
    const weak = createUnit(battle, teamA);
    weak.setHealth(20);

    expect(checkTeamUnit(battle, teamA, MoveTargetPriorities.Strongest)).toBe(
      strong,
    );
    expect(checkTeamUnit(battle, teamA, MoveTargetPriorities.Weakest)).toBe(
      weak,
    );
    expect(
      checkTeamUnit(battle, teamA, MoveTargetPriorities.Strongest, strong),
    ).toBe(weak);
  });
});

describe('choose move', () => {
  it('prefers the damaging move and the killable target', () => {
    const { battle, teamA, teamB } = createAIBattle();
    pinRandom(battle, 0.99);
    const unit = createUnit(battle, teamA);
    const healthy = createUnit(battle, teamB);
    const dying = createUnit(battle, teamB);
    dying.setHealth(5);
    unit.addMove(Moves.Tackle);
    unit.addMove(Moves.Growl);

    const choice = chooseMove(battle, unit);

    expect(choice?.move).toBe(Moves.Tackle);
    expect(
      choice?.target.type === MoveTargetType.Unit && choice.target.unit,
    ).toBe(dying);
    expect(healthy.health).toBe(160); // scoring never applies damage
  });

  it('focuses fire on the higher-rated threat', () => {
    const { battle, teamA, teamB } = createAIBattle();
    pinRandom(battle, 0.99);
    const unit = createUnit(battle, teamA);
    const weakened = createUnit(battle, teamB);
    const threat = createUnit(battle, teamB);
    // Same health and defenses (equal damage bonus), lower rating
    weakened.addStage(Stages.Attack, -6, NONE_CAUSE);
    unit.addMove(Moves.Tackle);

    const choice = chooseMove(battle, unit);

    expect(
      choice?.target.type === MoveTargetType.Unit && choice.target.unit,
    ).toBe(threat);
  });

  it('avoids moves the target is immune to', () => {
    const { battle, teamA, teamB } = createAIBattle();
    pinRandom(battle, 0.99);
    const unit = createUnit(battle, teamA);
    createUnit(battle, teamB, [Types.Ghost]);
    unit.addMove(Moves.Tackle);
    unit.addMove(Moves.Growl);

    const choice = chooseMove(battle, unit);

    expect(choice?.move).toBe(Moves.Growl);
  });

  it('skips moves on cooldown', () => {
    const { battle, teamA, teamB } = createAIBattle();
    pinRandom(battle, 0.99);
    const unit = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    unit.addMove(Moves.Tackle);
    unit.addMove(Moves.Growl);

    unit.startCooldown(Moves.Tackle, {
      type: MoveTargetType.Unit,
      unit: enemy,
    });

    const choice = chooseMove(battle, unit);

    expect(choice?.move).toBe(Moves.Growl);
  });
});

describe('idle AI', () => {
  function createIdleBattle() {
    const harness = createBattle();
    setupChooseMoveAI(harness.battle);
    setupIdleAI(harness.battle);
    return harness;
  }

  it('idle units pick a move and start casting on tick', () => {
    const { battle, teamA, teamB } = createIdleBattle();
    pinRandom(battle, 0.99);
    const unit = createUnit(battle, teamA);
    createUnit(battle, teamB);
    unit.addMove(Moves.Tackle);

    unit.enter();
    battle.tick(16);

    expect(unit.casting).toBeDefined();
    expect(unit.casting?.move).toBe(Moves.Tackle);
  });

  it('locked units stay put', () => {
    const { battle, teamA, teamB } = createIdleBattle();
    pinRandom(battle, 0.99);
    const unit = createUnit(battle, teamA);
    createUnit(battle, teamB);
    unit.addMove(Moves.Tackle);

    unit.enter();
    unit.addStatus(Statuses.Sleeping, NONE_CAUSE);
    battle.tick(16);

    expect(unit.casting).toBeUndefined();
  });
});
