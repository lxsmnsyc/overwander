import { describe, expect, it } from 'vitest';
import { Stages } from '../../../src/data/constants/stats';
import { Types } from '../../../src/data/constants/types';
import Abilities from '../../../src/data/ids/abilities';
import { Moves } from '../../../src/data/ids/moves';
import { MoveTargetType } from '../../../src/battle/events';
import { createBattle, createUnit } from '../harness';

describe('Wind Rider', () => {
  it('turns a wind move away and takes an Attack stage from it', () => {
    const { battle, teamA, teamB } = createBattle();
    const holder = createUnit(battle, teamA);
    const attacker = createUnit(battle, teamB);
    holder.addAbility(Abilities.WindRider);

    const target = { type: MoveTargetType.Unit, unit: holder } as const;

    expect(attacker.checkMoveImmunity(Moves.Gust, target, Types.Flying)).toBe(true);

    // Asking is not being hit, so nothing is gained by the question
    expect(holder.stages[Stages.Attack]).toBe(0);

    const before = holder.health;
    attacker.triggerMoveTarget(Moves.Gust, target, 0);

    expect(holder.health).toBe(before);
    expect(holder.stages[Stages.Attack]).toBe(1);
  });

  it('rides the wind whatever type it comes as', () => {
    const { battle, teamA, teamB } = createBattle();
    const holder = createUnit(battle, teamA);
    const attacker = createUnit(battle, teamB);
    holder.addAbility(Abilities.WindRider);

    const target = { type: MoveTargetType.Unit, unit: holder } as const;

    expect(attacker.checkMoveImmunity(Moves.Blizzard, target, Types.Ice)).toBe(true);
    expect(attacker.checkMoveImmunity(Moves.SilverWind, target, Types.Bug)).toBe(true);
  });

  it('stands in the way of anything that is not wind', () => {
    const { battle, teamA, teamB } = createBattle();
    const holder = createUnit(battle, teamA);
    const attacker = createUnit(battle, teamB);
    holder.addAbility(Abilities.WindRider);

    const target = { type: MoveTargetType.Unit, unit: holder } as const;

    expect(attacker.checkMoveImmunity(Moves.WingAttack, target, Types.Flying)).toBe(false);

    const before = holder.health;
    attacker.triggerMoveTarget(Moves.WingAttack, target, 0);

    expect(holder.health).toBeLessThan(before);
    expect(holder.stages[Stages.Attack]).toBe(0);
  });
});
