import { describe, expect, it } from 'vitest';
import { getAIContext, withAIContext } from '../../src/battle/ai/context';
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

  it('knows the moves its foes carry', () => {
    const { battle, teamA, teamB } = createBattle();
    const unit = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);
    foe.addMove(Moves.Ember);
    const context = getAIContext(battle, unit);

    expect(context.foesKnow((move) => move === Moves.Ember)).toBe(true);
    expect(context.foesKnow((move) => move === Moves.Surf)).toBe(false);
  });
});
