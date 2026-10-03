import { describe, expect, it } from 'vitest';
import { setupChooseMoveAI } from '../../src/battle/ai/choose-move';
import { BASE_SCORE } from '../../src/battle/ai/score';
import {
  BattleEvents,
  type CheckUnitAIMoveScoreEvent,
  type CheckUnitAIMoveUsableEvent,
  type MoveTarget,
  MoveTargetType,
} from '../../src/battle/events';
import { PLEDGE_PAIR_BONUS } from '../../src/battle/moves/pledges';
import Team from '../../src/battle/team';
import type Unit from '../../src/battle/unit';
import { unitTarget } from '../../src/battle/utils';
import { Stages } from '../../src/data/constants/stats';
import { Types } from '../../src/data/constants/types';
import { Moves } from '../../src/data/ids/moves';
import { Statuses } from '../../src/data/ids/status';
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

  it('leaves a foe to the affliction a teammate has let go and is still in the air', () => {
    const { battle, teamA, teamB } = createAIBattle();
    const unit = createUnit(battle, teamA);
    const friend = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);
    friend.addMove(Moves.Toxic);
    // Every roll lands, so the Toxic is in the air rather than missed
    pinRandom(battle, 0);

    friend.cast(Moves.Toxic, unitTarget(foe));

    // Step to the moment the cast ends and the move is on its way
    while (friend.casting != null) {
      battle.tick(50);
    }
    expect(foe.status[Statuses.BadlyPoisoned]).toBeUndefined();
    expect(usableMove(battle, unit, Moves.Toxic, unitTarget(foe))).toBe(false);

    battle.tick(1000);
    expect(foe.status[Statuses.BadlyPoisoned]).toBeDefined();
    expect(usableMove(battle, unit, Moves.Toxic, unitTarget(foe))).toBe(false);
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

  it('leaves a foe to the restriction a teammate is already winding up', () => {
    const { battle, teamA, teamB } = createAIBattle();
    const unit = createUnit(battle, teamA, [Types.Ghost]);
    const foe = createUnit(battle, teamB);
    const other = createUnit(battle, teamB);

    for (const [cast, mine] of [
      [Moves.Embargo, Moves.Embargo],
      [Moves.Soak, Moves.Soak],
      [Moves.MeanLook, Moves.Block],
      [Moves.Foresight, Moves.OdorSleuth],
      [Moves.Curse, Moves.Curse],
    ] as const) {
      const friend = createUnit(battle, teamA, [Types.Ghost]);
      friend.addMove(cast);
      expect(usableMove(battle, unit, mine, unitTarget(foe))).toBe(true);
      friend.cast(cast, unitTarget(foe));

      expect(usableMove(battle, unit, mine, unitTarget(foe))).toBe(false);
      expect(usableMove(battle, unit, mine, unitTarget(other))).toBe(true);
    }
  });

  it('lends one hand to a partner and leaves a party-wide move to the first', () => {
    const { battle, teamA, teamB } = createAIBattle();
    const unit = createUnit(battle, teamA);
    const partner = createUnit(battle, teamA);
    createUnit(battle, teamB);
    const none: MoveTarget = { type: MoveTargetType.None };

    for (const [cast, target, mine] of [
      [Moves.HelpingHand, unitTarget(partner), Moves.HelpingHand],
      [Moves.FollowMe, none, Moves.RagePowder],
      [Moves.HealBell, none, Moves.Aromatherapy],
      [Moves.Haze, none, Moves.Haze],
      [Moves.TeeterDance, none, Moves.TeeterDance],
    ] as const) {
      const friend = createUnit(battle, teamA);
      friend.addMove(cast);
      expect(usableMove(battle, unit, mine, target), `${mine}`).toBe(true);
      friend.cast(cast, target);

      expect(usableMove(battle, unit, mine, target)).toBe(false);
    }
  });

  it('leaves the song to whoever sings first', () => {
    const { battle, teamA, teamB } = createAIBattle();
    const unit = createUnit(battle, teamA);
    const friend = createUnit(battle, teamA);
    for (let i = 0; i < 3; i++) {
      createUnit(battle, teamB);
    }
    const none: MoveTarget = { type: MoveTargetType.None };
    friend.addMove(Moves.PerishSong);

    expect(usableMove(battle, unit, Moves.PerishSong, none)).toBe(true);
    friend.cast(Moves.PerishSong, none);
    expect(usableMove(battle, unit, Moves.PerishSong, none)).toBe(false);
  });

  it('leaves what a second cast would only turn back', () => {
    const { battle, teamA, teamB } = createAIBattle();
    const unit = createUnit(battle, teamA);
    const friend = createUnit(battle, teamA);
    const flipper = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);
    foe.stages[Stages.Attack] = 2;
    friend.addMove(Moves.AllySwitch);
    flipper.addMove(Moves.TopsyTurvy);
    foe.addMove(Moves.Tackle);

    expect(usableMove(battle, unit, Moves.TopsyTurvy, unitTarget(foe))).toBe(true);
    flipper.cast(Moves.TopsyTurvy, unitTarget(foe));
    expect(usableMove(battle, unit, Moves.TopsyTurvy, unitTarget(foe))).toBe(false);

    // Ally Switch is only worth it with a hit on its way
    foe.cast(Moves.Tackle, unitTarget(unit));
    expect(usableMove(battle, unit, Moves.AllySwitch, unitTarget(friend))).toBe(true);
    friend.cast(Moves.AllySwitch, unitTarget(unit));
    expect(usableMove(battle, unit, Moves.AllySwitch, unitTarget(friend))).toBe(false);
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
    // A different sky would only replace it
    expect(usableMove(battle, unit, Moves.RainDance, { type: MoveTargetType.None })).toBe(false);
  });

  it('leaves the ground to the terrain a teammate is already laying', () => {
    const { battle, teamA, teamB } = createAIBattle();
    const unit = createUnit(battle, teamA);
    const friend = createUnit(battle, teamA);
    createUnit(battle, teamB);
    const none: MoveTarget = { type: MoveTargetType.None };
    friend.addMove(Moves.ElectricTerrain);

    friend.cast(Moves.ElectricTerrain, none);

    expect(usableMove(battle, unit, Moves.GrassyTerrain, none)).toBe(false);
    // The sky is a separate thing
    expect(usableMove(battle, unit, Moves.SunnyDay, none)).toBe(true);
  });

  it('pairs its Pledge with a different one a teammate is already casting', () => {
    const { battle, teamA, teamB } = createAIBattle();
    const unit = createUnit(battle, teamA);
    const friend = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);
    friend.addMove(Moves.WaterPledge);

    const fire = scoreMove(battle, unit, Moves.FirePledge, unitTarget(foe));
    const water = scoreMove(battle, unit, Moves.WaterPledge, unitTarget(foe));

    friend.cast(Moves.WaterPledge, unitTarget(foe));
    battle.tick(500);

    // Landing after the teammate's, it lands as the pair
    expect(scoreMove(battle, unit, Moves.FirePledge, unitTarget(foe))).toBe(
      fire + PLEDGE_PAIR_BONUS,
    );
    // The same Pledge twice is no pair
    expect(scoreMove(battle, unit, Moves.WaterPledge, unitTarget(foe))).toBe(water);
  });
});
