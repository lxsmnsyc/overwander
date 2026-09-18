// Snivy through Oshawott.

import { describe, expect, it } from 'vitest';
import { Stages } from '../../../../src/data/constants/stats';
import { Types } from '../../../../src/data/constants/types';
import Abilities from '../../../../src/data/ids/abilities';
import { MoveCategories, Moves } from '../../../../src/data/ids/moves';
import { createBattle, createUnit, pinRandom } from '../../harness';
import { dealDamage } from './helpers';

describe('the Unova starters', () => {
  it('slows what its first landed move hits, and nothing after that', () => {
    const { battle, teamA, teamB } = createBattle();
    const snake = createUnit(battle, teamA);
    const target = createUnit(battle, teamB);

    snake.addAbility(Abilities.LeafOpening);
    snake.enter();
    target.enter();
    battle.tick(1);

    dealDamage(snake, target, Moves.Tackle, 40, Types.Normal, MoveCategories.Physical);

    expect(target.stages[Stages.Speed]).toBe(-1);

    // The opening is spent, so the second blow is an ordinary one
    dealDamage(snake, target, Moves.Tackle, 40, Types.Normal, MoveCategories.Physical);

    expect(target.stages[Stages.Speed]).toBe(-1);
  });

  it('puts half again behind its first landed move only', () => {
    const { battle, teamA, teamB } = createBattle();

    pinRandom(battle, 1);

    const boar = createUnit(battle, teamA);
    const target = createUnit(battle, teamB);

    boar.addAbility(Abilities.EmberOpening);
    boar.enter();
    target.enter();
    battle.tick(1);

    const opened = dealDamage(
      boar,
      target,
      Moves.Tackle,
      40,
      Types.Normal,
      MoveCategories.Physical,
    );
    const ordinary = dealDamage(
      boar,
      target,
      Moves.Tackle,
      40,
      Types.Normal,
      MoveCategories.Physical,
    );

    expect(opened).toBeGreaterThan(ordinary);
    expect(opened / ordinary).toBeCloseTo(1.5, 1);
  });

  it('gets its shell up on its first landed move, once a fight', () => {
    const { battle, teamA, teamB } = createBattle();
    const otter = createUnit(battle, teamA);
    const target = createUnit(battle, teamB);

    otter.addAbility(Abilities.ShellOpening);
    otter.enter();
    target.enter();
    battle.tick(1);

    dealDamage(otter, target, Moves.Tackle, 40, Types.Normal, MoveCategories.Physical);

    expect(otter.stages[Stages.Defense]).toBe(2);

    dealDamage(otter, target, Moves.Tackle, 40, Types.Normal, MoveCategories.Physical);

    expect(otter.stages[Stages.Defense]).toBe(2);
  });
});
