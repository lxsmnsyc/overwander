import { describe, expect, it } from 'vitest';
import { MoveTargetType } from '../../../src/battle/events';
import turns from '../../../src/battle/turn';
import type Unit from '../../../src/battle/unit';
import { Stats, StatsKind } from '../../../src/data/constants/stats';
import { Types } from '../../../src/data/constants/types';
import { MoveAffects, Moves } from '../../../src/data/ids/moves';
import { getMoveData } from '../../../src/data/moves';
import { createBattle, createUnit } from '../harness';

function unitTarget(unit: Unit): { readonly type: MoveTargetType.Unit; readonly unit: Unit } {
  return { type: MoveTargetType.Unit, unit } as const;
}

const NONE_TARGET = { type: MoveTargetType.None } as const;

/**
 * A teammate with a pool of its own, so a heal measured against the
 * wrong one is a heal of the wrong size rather than a coincidence
 */
function createPartner(
  battle: ReturnType<typeof createBattle>['battle'],
  team: Unit['team'],
): Unit {
  const unit = createUnit(battle, team);

  unit.setStat(StatsKind.Base, Stats.HP, 200);
  unit.setHealth(20);

  return unit;
}

describe('the heals a pokemon can hand over', () => {
  it('heals a teammate by a share of that teammate’s HP', () => {
    const { battle, teamA } = createBattle();
    const healer = createUnit(battle, teamA);
    const hurt = createPartner(battle, teamA);

    const healerBefore = healer.health;

    healer.triggerMoveTarget(Moves.SoftBoiled, unitTarget(hurt), 0);

    expect(hurt.health).toBe(20 + hurt.checkStat(Stats.HP, 0) * 0.5);
    expect(hurt.checkStat(Stats.HP, 0)).not.toBe(healer.checkStat(Stats.HP, 0));
    expect(healer.health).toBe(healerBefore);
  });

  it('heals a Ghost teammate, which the damage chart has no say over', () => {
    const { battle, teamA } = createBattle();
    const healer = createUnit(battle, teamA);
    const ghost = createUnit(battle, teamA, [Types.Ghost]);

    ghost.setHealth(20);
    healer.triggerMoveTarget(Moves.SoftBoiled, unitTarget(ghost), 0);

    expect(ghost.health).toBe(20 + ghost.checkStat(Stats.HP, 0) * 0.5);
  });

  it('drinks its own milk when it is aimed at itself', () => {
    const { battle, teamA } = createBattle();
    const healer = createUnit(battle, teamA);

    healer.setHealth(20);
    healer.triggerMoveTarget(Moves.MilkDrink, unitTarget(healer), 0);

    expect(healer.health).toBe(20 + healer.checkStat(Stats.HP, 0) * 0.5);
  });

  it('hands a milk drink to a teammate too', () => {
    const { battle, teamA } = createBattle();
    const healer = createUnit(battle, teamA);
    const hurt = createPartner(battle, teamA);

    healer.triggerMoveTarget(Moves.MilkDrink, unitTarget(hurt), 0);

    expect(hurt.health).toBe(20 + hurt.checkStat(Stats.HP, 0) * 0.5);
  });

  it('leaves a wish with whoever it was aimed at', () => {
    const { battle, teamA } = createBattle();
    const wisher = createUnit(battle, teamA);
    const hurt = createPartner(battle, teamA);

    wisher.setHealth(20);
    wisher.triggerMoveTarget(Moves.Wish, unitTarget(hurt), 0);

    // Nothing yet: the whole point of a wish is that it lands late
    expect(hurt.health).toBe(20);

    battle.tick(turns(2));

    expect(hurt.health).toBe(20 + hurt.checkStat(Stats.HP, 0) * 0.5);
    expect(wisher.health).toBe(20);
  });

  it('keeps a wish cast at nobody for the wisher', () => {
    const { battle, teamA } = createBattle();
    const wisher = createUnit(battle, teamA);

    wisher.setHealth(20);
    wisher.triggerMoveEffect(Moves.Wish, NONE_TARGET, 0);
    battle.tick(turns(2));

    expect(wisher.health).toBe(20 + wisher.checkStat(Stats.HP, 0) * 0.5);
  });

  it('leaves the heals nobody can hand over alone', () => {
    for (const move of [Moves.Recover, Moves.SlackOff, Moves.Synthesis, Moves.Rest]) {
      expect(getMoveData(move).affects & MoveAffects.Own).toBe(0);
    }
  });
});
