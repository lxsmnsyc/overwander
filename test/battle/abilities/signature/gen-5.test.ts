// Snivy through Oshawott.

import { describe, expect, it } from 'vitest';
import { Stages, Stats } from '../../../../src/data/constants/stats';
import { Types } from '../../../../src/data/constants/types';
import Abilities from '../../../../src/data/ids/abilities';
import { MoveCategories, Moves } from '../../../../src/data/ids/moves';
import { Items } from '../../../../src/data/ids/items';
import { MoveTargetType } from '../../../../src/battle/events';
import type Unit from '../../../../src/battle/unit';
import {
  GUARD_FACTOR,
  SPOTTER_ACCURACY,
} from '../../../../src/battle/abilities/signature/patrat-to-purrloin';
import { createBattle, createUnit, pinRandom } from '../../harness';
import { dealDamage } from './helpers';

function unitTarget(unit: Unit): { readonly type: MoveTargetType.Unit; readonly unit: Unit } {
  return { type: MoveTargetType.Unit, unit } as const;
}

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

describe('the three a walk out of the first town meets', () => {
  it('calls the shot for its whole team, against a target mid-move', () => {
    const { battle, teamA, teamB } = createBattle();
    const scout = createUnit(battle, teamA);
    const ally = createUnit(battle, teamA);
    const target = createUnit(battle, teamB);
    const aim = unitTarget(target);

    scout.enter();
    ally.enter();
    target.enter();
    target.addMove(Moves.Tackle);

    const bare = ally.checkMoveAccuracy(Moves.Thunderbolt, aim) ?? 0;

    scout.addAbility(Abilities.Spotter);

    // Nothing is called while the target is doing nothing
    expect(ally.checkMoveAccuracy(Moves.Thunderbolt, aim)).toBe(bare);

    target.cast(Moves.Tackle, unitTarget(ally));
    battle.tick(1);

    expect(ally.checkMoveAccuracy(Moves.Thunderbolt, aim)).toBeCloseTo(bare * SPOTTER_ACCURACY, 5);
    // And the scout's own throws are called too
    expect(scout.checkMoveAccuracy(Moves.Thunderbolt, aim)).toBeCloseTo(bare * SPOTTER_ACCURACY, 5);
  });

  it('stands over a hurt teammate, and stands down once it is well', () => {
    const { battle, teamA, teamB } = createBattle();
    const dog = createUnit(battle, teamA);
    const ally = createUnit(battle, teamA);

    createUnit(battle, teamB).enter();
    dog.enter();
    ally.enter();
    dog.addAbility(Abilities.LoyalGuard);

    const defense = dog.checkStat(Stats.Defense, 0);
    const special = dog.checkStat(Stats.SpecialDefense, 0);

    ally.setHealth(Math.floor(ally.checkStat(Stats.HP, 0) / 4));

    expect(dog.checkStat(Stats.Defense, 0)).toBe(defense * GUARD_FACTOR);
    expect(dog.checkStat(Stats.SpecialDefense, 0)).toBe(special * GUARD_FACTOR);

    // Its own health is not what it is watching
    ally.setHealth(ally.checkStat(Stats.HP, 0));

    expect(dog.checkStat(Stats.Defense, 0)).toBe(defense);
  });

  it('takes an item with the first move it lands, once a fight', () => {
    const { battle, teamA, teamB } = createBattle();
    const cat = createUnit(battle, teamA);
    const target = createUnit(battle, teamB);
    const other = createUnit(battle, teamB);

    cat.enter();
    target.enter();
    other.enter();
    cat.addAbility(Abilities.CatBurglar);
    target.addItem(Items.Leftovers);
    other.addItem(Items.ShellBell);

    dealDamage(cat, target, Moves.Tackle, 40, Types.Normal, MoveCategories.Physical);

    expect(cat.hasItem(Items.Leftovers)).toBe(true);
    expect(target.hasItem(Items.Leftovers)).toBe(false);

    // One theft a fight: the second pokemon keeps what it is holding
    dealDamage(cat, other, Moves.Tackle, 40, Types.Normal, MoveCategories.Physical);

    expect(other.hasItem(Items.ShellBell)).toBe(true);
  });
});
