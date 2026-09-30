import { describe, expect, it } from 'vitest';
import { chooseMove, setupChooseMoveAI } from '../../src/battle/ai/choose-move';
import { MoveRole, ROLE_BASE } from '../../src/battle/ai/roles';
import { BASE_SCORE } from '../../src/battle/ai/score';
import { BattleModes } from '../../src/battle/core';
import {
  BattleEvents,
  type CheckUnitAIMoveScoreEvent,
  type CheckUnitAIMoveUsableEvent,
  EffectType,
  type MoveTarget,
  MoveTargetType,
} from '../../src/battle/events';
import type Unit from '../../src/battle/unit';
import { unitTarget } from '../../src/battle/utils';
import { Stats, StatsKind } from '../../src/data/constants/stats';
import { Types } from '../../src/data/constants/types';
import Abilities from '../../src/data/ids/abilities';
import { Moves } from '../../src/data/ids/moves';
import { Statuses, TeamStatuses } from '../../src/data/ids/status';
import { type BattleHarness, createBattle, createUnit, pinRandom } from './harness';

const NONE: MoveTarget = { type: MoveTargetType.None };
const CAUSE = { type: EffectType.None } as const;

function createAIBattle(mode?: BattleModes): BattleHarness {
  const harness = createBattle('test-seed', mode);
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

function usableMove(
  battle: BattleHarness['battle'],
  source: Unit,
  move: Moves,
  target: MoveTarget,
): boolean {
  const event: CheckUnitAIMoveUsableEvent = {
    id: 'CheckUnitAIMoveUsable',
    disabled: false,
    source,
    move,
    target,
    usable: true,
  };
  battle.emit(BattleEvents.CheckUnitAIMoveUsable, event);
  return event.usable;
}

describe('scoring by role', () => {
  it('raises Protect only when a hit is on its way', () => {
    const { battle, teamA, teamB } = createAIBattle();
    const unit = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);
    unit.addMove(Moves.Protect);
    foe.addMove(Moves.Tackle);

    expect(scoreMove(battle, unit, Moves.Protect, NONE)).toBe(BASE_SCORE);

    foe.cast(Moves.Tackle, unitTarget(unit));

    expect(scoreMove(battle, unit, Moves.Protect, NONE)).toBe(
      BASE_SCORE + ROLE_BASE[MoveRole.Shield],
    );
  });

  it('bends the room only for the slower side', () => {
    const { battle, teamA, teamB } = createAIBattle();
    const unit = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);

    expect(scoreMove(battle, unit, Moves.TrickRoom, NONE)).toBe(BASE_SCORE);

    foe.setStat(StatsKind.Base, Stats.Speed, 150);

    expect(scoreMove(battle, unit, Moves.TrickRoom, NONE)).toBe(
      BASE_SCORE + ROLE_BASE[MoveRole.Field],
    );
  });

  it('takes a standing Trick Room down only when it helps the foe', () => {
    const { battle, teamA, teamB } = createAIBattle();
    const unit = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);
    unit.addMove(Moves.TrickRoom);
    foe.addMove(Moves.TrickRoom);
    foe.setStat(StatsKind.Base, Stats.Speed, 150);

    unit.cast(Moves.TrickRoom, NONE);
    battle.tick(4000);

    // The caster is the slower side, so the room is working for it
    expect(usableMove(battle, unit, Moves.TrickRoom, NONE)).toBe(false);
    // The faster foe would be glad to take it down
    expect(usableMove(battle, foe, Moves.TrickRoom, NONE)).toBe(true);
  });

  it('calls up a sky only for a side that gains from it', () => {
    const { battle, teamA, teamB } = createAIBattle();
    const unit = createUnit(battle, teamA);
    createUnit(battle, teamB);

    expect(scoreMove(battle, unit, Moves.SunnyDay, NONE)).toBe(BASE_SCORE);

    unit.addMove(Moves.Ember);

    expect(scoreMove(battle, unit, Moves.SunnyDay, NONE)).toBe(
      BASE_SCORE + ROLE_BASE[MoveRole.Field],
    );
  });

  it('never sets up a raid boss', () => {
    const { battle, teamA, teamB } = createAIBattle(BattleModes.Raid);
    const boss = createUnit(battle, teamA);
    createUnit(battle, teamB);
    boss.addAbility(Abilities.Boss);

    expect(scoreMove(battle, boss, Moves.SwordsDance, NONE)).toBe(BASE_SCORE);
  });

  it('finishes a foe rather than raise any shield', () => {
    const { battle, teamA, teamB } = createAIBattle();
    const unit = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);
    unit.addMove(Moves.Tackle);
    unit.addMove(Moves.Protect);
    foe.addMove(Moves.Tackle);
    foe.setHealth(5);
    foe.cast(Moves.Tackle, unitTarget(unit));

    expect(chooseMove(battle, unit)?.move).toBe(Moves.Tackle);
  });

  it('opens a Clefable fight with Substitute, Reflect, Toxic, then Minimize', () => {
    const { battle, teamA, teamB } = createAIBattle();
    const clefable = createUnit(battle, teamA, [Types.Fairy]);
    const foe = createUnit(battle, teamB);
    clefable.addMove(Moves.Reflect);
    clefable.addMove(Moves.Minimize);
    clefable.addMove(Moves.Substitute);
    clefable.addMove(Moves.Toxic);
    foe.addMove(Moves.Tackle);

    // Keeping the damage off outranks team setup, which outranks a status
    expect(chooseMove(battle, clefable)?.move).toBe(Moves.Substitute);
    clefable.addStatus(Statuses.Substituted, CAUSE);

    expect(chooseMove(battle, clefable)?.move).toBe(Moves.Reflect);
    teamA.addStatus(TeamStatuses.Reflect, CAUSE);

    expect(chooseMove(battle, clefable)?.move).toBe(Moves.Toxic);
    foe.addStatus(Statuses.BadlyPoisoned, CAUSE);

    expect(chooseMove(battle, clefable)?.move).toBe(Moves.Minimize);
  });
});
