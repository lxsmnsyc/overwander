import { describe, expect, it } from 'vitest';
import { getAIContext, withAIContext } from '../../src/battle/ai/context';
import setupFog from '../../src/battle/ai/fog';
import { unitTarget } from '../../src/battle/utils';
import { BattleEvents } from '../../src/battle/events';
import { EventPriority } from '../../src/core/event-emitter';
import { Moves } from '../../src/data/ids/moves';
import { createBattle, createUnit } from './harness';

describe('AI context', () => {
  it('shares one context across a decision and rates each unit once', () => {
    const { battle, teamA, teamB } = createBattle();
    const unit = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);
    let ratings = 0;

    battle.on(BattleEvents.CheckUnitAIRating, EventPriority.Post, () => {
      ratings += 1;
    });

    withAIContext(battle, unit, () => {
      const context = getAIContext(battle, unit);

      expect(getAIContext(battle, unit)).toBe(context);
      context.threatBand(foe);
      context.threatBand(foe);
    });

    // The foe and the caster, once each
    expect(ratings).toBe(2);
  });

  it('gives a question asked outside a decision a fresh context', () => {
    const { battle, teamA, teamB } = createBattle();
    const unit = createUnit(battle, teamA);
    const other = createUnit(battle, teamB);

    withAIContext(battle, unit, () => {
      expect(getAIContext(battle, other).source).toBe(other);
    });
    expect(getAIContext(battle, unit)).not.toBe(getAIContext(battle, unit));
  });

  it('counts a fainted teammate as no health left', () => {
    const { battle, teamA, teamB } = createBattle();
    const unit = createUnit(battle, teamA);
    const ally = createUnit(battle, teamA);
    createUnit(battle, teamB);
    ally.setHealth(0);
    ally.alive = false;

    expect(getAIContext(battle, unit).healthShare()).toBeCloseTo(0.5);
  });

  it('knows only the moves its foes have shown', () => {
    const { battle, teamA, teamB } = createBattle();
    const unit = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);
    setupFog(battle);
    foe.addMove(Moves.Ember);
    const isEmber = (move: Moves): boolean => move === Moves.Ember;

    // Carried is not shown: only a cast tells the field what a foe has
    expect(getAIContext(battle, unit).foesKnow(isEmber)).toBe(false);

    foe.cast(Moves.Ember, unitTarget(unit));

    expect(getAIContext(battle, unit).foesKnow(isEmber)).toBe(true);
    // The basic swing is one every unit has
    expect(getAIContext(battle, unit).foesKnow((move) => move === Moves.Attack)).toBe(true);
  });
});
