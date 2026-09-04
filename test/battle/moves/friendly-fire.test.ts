import { describe, expect, it } from 'vitest';
import { BASE_SCORE, FEED_BONUS } from '../../../src/battle/ai/score';
import { chooseMove, setupChooseMoveAI } from '../../../src/battle/ai/choose-move';
import {
  BattleEvents,
  type CheckUnitAIMoveScoreEvent,
  type CheckUnitAIMoveUsableEvent,
  MoveTargetType,
} from '../../../src/battle/events';
import type Battle from '../../../src/battle/core';
import type Unit from '../../../src/battle/unit';
import { MAX_STAGE, Stages } from '../../../src/data/constants/stats';
import { Types } from '../../../src/data/constants/types';
import Abilities from '../../../src/data/ids/abilities';
import { Moves } from '../../../src/data/ids/moves';
import { createBattle, createUnit, pinRandom } from '../harness';

/**
 * With the chooser wired, which is the whole point: its own immunity
 * rule refuses an immune target, and a feed is an immune target on
 * purpose. A battle built without it cannot see the two meet
 */
function createFeedBattle(): ReturnType<typeof createBattle> {
  const harness = createBattle();

  setupChooseMoveAI(harness.battle);
  return harness;
}

function unitTarget(unit: Unit): { readonly type: MoveTargetType.Unit; readonly unit: Unit } {
  return { type: MoveTargetType.Unit, unit } as const;
}

function usable(battle: Battle, source: Unit, move: Moves, aim: Unit): boolean {
  const event: CheckUnitAIMoveUsableEvent = {
    id: 'CheckUnitAIMoveUsable',
    disabled: false,
    source,
    move,
    target: unitTarget(aim),
    usable: true,
  };

  battle.emit(BattleEvents.CheckUnitAIMoveUsable, event);
  return event.usable;
}

function score(battle: Battle, source: Unit, move: Moves, aim: Unit): number {
  const event: CheckUnitAIMoveScoreEvent = {
    id: 'CheckUnitAIMoveScore',
    disabled: false,
    source,
    move,
    target: unitTarget(aim),
    score: BASE_SCORE,
  };

  battle.emit(BattleEvents.CheckUnitAIMoveScore, event);
  return event.score;
}

describe('feeding a hit to one’s own side', () => {
  it('refuses a teammate the hit would actually land on', () => {
    const { battle, teamA } = createFeedBattle();
    const caster = createUnit(battle, teamA);
    const plain = createUnit(battle, teamA);

    expect(usable(battle, caster, Moves.Thunderbolt, plain)).toBe(false);
  });

  it('allows the teammate that drinks it', () => {
    const { battle, teamA } = createFeedBattle();
    const caster = createUnit(battle, teamA);
    const absorber = createUnit(battle, teamA);

    absorber.addAbility(Abilities.VoltAbsorb);
    expect(usable(battle, caster, Moves.Thunderbolt, absorber)).toBe(true);
  });

  it('leaves a move whose table already names an ally alone', () => {
    const { battle, teamA } = createFeedBattle();
    const caster = createUnit(battle, teamA);
    const contrary = createUnit(battle, teamA);

    contrary.addAbility(Abilities.Contrary);
    expect(usable(battle, caster, Moves.Screech, contrary)).toBe(true);
  });

  it('is worth the health it puts back, and nothing at full', () => {
    const { battle, teamA } = createFeedBattle();
    const caster = createUnit(battle, teamA);
    const hurt = createUnit(battle, teamA);
    const whole = createUnit(battle, teamA);

    hurt.addAbility(Abilities.VoltAbsorb);
    whole.addAbility(Abilities.VoltAbsorb);
    hurt.setHealth(40);

    expect(score(battle, caster, Moves.Thunderbolt, hurt)).toBeGreaterThan(
      score(battle, caster, Moves.Thunderbolt, whole),
    );
    expect(score(battle, caster, Moves.Thunderbolt, whole)).toBe(BASE_SCORE);
  });

  it('is worth a stage to whoever answers with one', () => {
    const { battle, teamA } = createFeedBattle();
    const caster = createUnit(battle, teamA);
    const sipper = createUnit(battle, teamA);

    sipper.addAbility(Abilities.SapSipper);

    // A difference rather than a total: Razor Leaf misses one time in
    // twenty, and the chooser prices that too
    const fed = score(battle, caster, Moves.RazorLeaf, sipper);

    sipper.addStage(Stages.Attack, MAX_STAGE, { type: 0 });

    expect(fed - score(battle, caster, Moves.RazorLeaf, sipper)).toBe(FEED_BONUS);
  });

  it('costs nothing to aim at a teammate nothing can reach, and gains nothing either', () => {
    const { battle, teamA } = createFeedBattle();
    const caster = createUnit(battle, teamA);
    const grounded = createUnit(battle, teamA, [Types.Ground]);

    expect(score(battle, caster, Moves.Thunderbolt, grounded)).toBe(BASE_SCORE);
  });

  it('is a choice the chooser actually makes, not only a score', () => {
    const { battle, teamA, teamB } = createFeedBattle();
    pinRandom(battle, 0.99);

    const caster = createUnit(battle, teamA);
    const absorber = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);

    absorber.addAbility(Abilities.VoltAbsorb);
    absorber.setHealth(40);
    caster.addMove(Moves.Thunderbolt);

    const choice = chooseMove(battle, caster);

    expect(choice?.move).toBe(Moves.Thunderbolt);
    expect(choice?.target.type === MoveTargetType.Unit && choice.target.unit).toBe(absorber);
    expect(enemy.alive).toBe(true);
  });

  it('still costs the caster for a hit that lands on its own side', () => {
    const { battle, teamA } = createFeedBattle();
    const caster = createUnit(battle, teamA);
    const plain = createUnit(battle, teamA);
    const absorber = createUnit(battle, teamA);

    absorber.addAbility(Abilities.VoltAbsorb);
    absorber.setHealth(40);

    expect(score(battle, caster, Moves.Thunderbolt, plain)).toBeLessThan(BASE_SCORE);
    expect(score(battle, caster, Moves.Thunderbolt, absorber)).toBeGreaterThan(BASE_SCORE);
  });
});
