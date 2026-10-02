import { describe, expect, it } from 'vitest';
import { setupChooseMoveAI } from '../../src/battle/ai/choose-move';
import {
  BattleEvents,
  type CheckUnitAIMoveUsableEvent,
  type MoveTarget,
  MoveTargetType,
} from '../../src/battle/events';
import Team from '../../src/battle/team';
import type Unit from '../../src/battle/unit';
import { unitTarget } from '../../src/battle/utils';
import { Moves } from '../../src/data/ids/moves';
import { type BattleHarness, createBattle, createUnit, pinRandom } from './harness';

function createAIBattle(): BattleHarness {
  const harness = createBattle('test-seed');
  setupChooseMoveAI(harness.battle);
  pinRandom(harness.battle, 0.99);
  return harness;
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

function teamTarget(unit: Unit): MoveTarget {
  return { type: MoveTargetType.Team, team: unit.team };
}

describe('teammates casting over each other', () => {
  it('leaves a screen a teammate is already raising', () => {
    const { battle, teamA, teamB } = createAIBattle();
    const unit = createUnit(battle, teamA);
    const friend = createUnit(battle, teamA);
    createUnit(battle, teamB);
    friend.addMove(Moves.Reflect);

    expect(usableMove(battle, unit, Moves.Reflect, teamTarget(unit))).toBe(true);

    friend.cast(Moves.Reflect, teamTarget(friend));

    expect(usableMove(battle, unit, Moves.Reflect, teamTarget(unit))).toBe(false);
    // A different veil is still its own
    expect(usableMove(battle, unit, Moves.LightScreen, teamTarget(unit))).toBe(true);
  });

  it('raises its own screen when the teammate raising one is on another team', () => {
    const { battle, allianceA, teamA, teamB } = createAIBattle();
    const unit = createUnit(battle, teamA);
    const other = new Team(battle, allianceA);
    allianceA.addTeam(other);
    const friend = createUnit(battle, other);
    createUnit(battle, teamB);
    friend.addMove(Moves.Reflect);

    friend.cast(Moves.Reflect, teamTarget(friend));

    expect(usableMove(battle, unit, Moves.Reflect, teamTarget(unit))).toBe(true);
  });

  it('leaves a foe to the affliction a teammate is already winding up', () => {
    const { battle, teamA, teamB } = createAIBattle();
    const unit = createUnit(battle, teamA);
    const friend = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);
    const other = createUnit(battle, teamB);
    friend.addMove(Moves.Toxic);

    friend.cast(Moves.Toxic, unitTarget(foe));

    expect(usableMove(battle, unit, Moves.Toxic, unitTarget(foe))).toBe(false);
    expect(usableMove(battle, unit, Moves.Toxic, unitTarget(other))).toBe(true);
    // A different affliction stacks on top
    expect(usableMove(battle, unit, Moves.ThunderWave, unitTarget(foe))).toBe(true);
  });

  it('counts two moves for one status as the same affliction', () => {
    const { battle, teamA, teamB } = createAIBattle();
    const unit = createUnit(battle, teamA);
    const friend = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);
    friend.addMove(Moves.SleepPowder);

    friend.cast(Moves.SleepPowder, unitTarget(foe));

    expect(usableMove(battle, unit, Moves.Spore, unitTarget(foe))).toBe(false);
  });

  it('still adds a layer of Spikes over a teammate’s', () => {
    const { battle, teamA, teamB } = createAIBattle();
    const unit = createUnit(battle, teamA);
    const friend = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);
    friend.addMove(Moves.Spikes);

    friend.cast(Moves.Spikes, teamTarget(foe));

    expect(usableMove(battle, unit, Moves.Spikes, teamTarget(foe))).toBe(true);
  });

  it('leaves the sky a teammate is already calling up', () => {
    const { battle, teamA, teamB } = createAIBattle();
    const unit = createUnit(battle, teamA);
    const friend = createUnit(battle, teamA);
    createUnit(battle, teamB);
    friend.addMove(Moves.SunnyDay);

    friend.cast(Moves.SunnyDay, { type: MoveTargetType.None });

    expect(usableMove(battle, unit, Moves.SunnyDay, { type: MoveTargetType.None })).toBe(false);
  });
});
