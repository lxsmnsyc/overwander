import { describe, expect, it } from 'vitest';
import { BASE_SCORE, FEED_BONUS } from '../../../src/battle/ai/score';
import { setupChooseMoveAI } from '../../../src/battle/ai/choose-move';
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
import { createBattle, createUnit } from '../harness';

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
    const { battle, teamA } = createBattle();
    const caster = createUnit(battle, teamA);
    const plain = createUnit(battle, teamA);

    expect(usable(battle, caster, Moves.Thunderbolt, plain)).toBe(false);
  });

  it('allows the teammate that drinks it', () => {
    const { battle, teamA } = createBattle();
    const caster = createUnit(battle, teamA);
    const absorber = createUnit(battle, teamA);

    absorber.addAbility(Abilities.VoltAbsorb);
    expect(usable(battle, caster, Moves.Thunderbolt, absorber)).toBe(true);
  });

  it('leaves a move whose table already names an ally alone', () => {
    const { battle, teamA } = createBattle();
    const caster = createUnit(battle, teamA);
    const contrary = createUnit(battle, teamA);

    contrary.addAbility(Abilities.Contrary);
    expect(usable(battle, caster, Moves.Screech, contrary)).toBe(true);
  });

  it('is worth the health it puts back, and nothing at full', () => {
    const { battle, teamA } = createBattle();
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
    const { battle, teamA } = createBattle();
    const caster = createUnit(battle, teamA);
    const sipper = createUnit(battle, teamA);

    sipper.addAbility(Abilities.SapSipper);
    expect(score(battle, caster, Moves.RazorLeaf, sipper)).toBe(BASE_SCORE + FEED_BONUS);

    sipper.addStage(Stages.Attack, MAX_STAGE, { type: 0 });
    expect(score(battle, caster, Moves.RazorLeaf, sipper)).toBe(BASE_SCORE);
  });

  it('costs nothing to aim at a teammate nothing can reach, and gains nothing either', () => {
    const { battle, teamA } = createBattle();
    const caster = createUnit(battle, teamA);
    const grounded = createUnit(battle, teamA, [Types.Ground]);

    expect(score(battle, caster, Moves.Thunderbolt, grounded)).toBe(BASE_SCORE);
  });

  it('still costs the caster for a hit that lands on its own side', () => {
    const { battle, teamA } = createBattle();

    // The cost lives with the chooser, which the harness leaves out
    setupChooseMoveAI(battle);

    const caster = createUnit(battle, teamA);
    const plain = createUnit(battle, teamA);
    const absorber = createUnit(battle, teamA);

    absorber.addAbility(Abilities.VoltAbsorb);
    absorber.setHealth(40);

    expect(score(battle, caster, Moves.Thunderbolt, plain)).toBeLessThan(BASE_SCORE);
    expect(score(battle, caster, Moves.Thunderbolt, absorber)).toBeGreaterThan(BASE_SCORE);
  });
});
