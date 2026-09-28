import { describe, expect, it } from 'vitest';
import { setupChooseMoveAI } from '../../src/battle/ai/choose-move';
import { MoveRole, ROLE_BASE } from '../../src/battle/ai/roles';
import { BASE_SCORE, KILL_BONUS } from '../../src/battle/ai/score';
import {
  BattleEvents,
  type CheckUnitAIMoveScoreEvent,
  type MoveTarget,
  MoveTargetType,
} from '../../src/battle/events';
import type Unit from '../../src/battle/unit';
import { unitTarget } from '../../src/battle/utils';
import { Stats, StatsKind } from '../../src/data/constants/stats';
import Abilities from '../../src/data/ids/abilities';
import { Items } from '../../src/data/ids/items';
import { Moves } from '../../src/data/ids/moves';
import { type BattleHarness, createBattle, createUnit, pinRandom } from './harness';

const NONE: MoveTarget = { type: MoveTargetType.None };
const OWN_TEAM = (unit: Unit): MoveTarget => ({ type: MoveTargetType.Team, team: unit.team });

function createAIBattle(): BattleHarness {
  const harness = createBattle('test-seed');
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

describe('own-side synergy', () => {
  it('guesses at Light Screen from a foe built to hit specially', () => {
    const { battle, teamA, teamB } = createAIBattle();
    const unit = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);
    foe.setStat(StatsKind.Base, Stats.Attack, 150);

    expect(scoreMove(battle, unit, Moves.LightScreen, OWN_TEAM(unit))).toBe(BASE_SCORE);

    foe.setStat(StatsKind.Base, Stats.Attack, 50);

    // A guess is worth half of a shown special move
    expect(scoreMove(battle, unit, Moves.LightScreen, OWN_TEAM(unit))).toBe(
      BASE_SCORE + ROLE_BASE[MoveRole.TeamSetup] / 2,
    );
  });

  it('values a screen more with a Light Clay, never above a KO', () => {
    const { battle, teamA, teamB } = createAIBattle();
    const unit = createUnit(battle, teamA);
    createUnit(battle, teamB);

    const plain = scoreMove(battle, unit, Moves.Reflect, OWN_TEAM(unit));

    unit.addItem(Items.LightClay);

    const clay = scoreMove(battle, unit, Moves.Reflect, OWN_TEAM(unit));

    expect(clay).toBeGreaterThan(plain);
    expect(clay).toBeLessThan(BASE_SCORE + KILL_BONUS);
  });

  it('sees a Contrary turn a boost into a drop, and a Simple double it', () => {
    const { battle, teamA, teamB } = createAIBattle();
    const unit = createUnit(battle, teamA);
    createUnit(battle, teamB);
    unit.addMove(Moves.Tackle);

    const plain = scoreMove(battle, unit, Moves.SwordsDance, NONE);

    expect(plain).toBeGreaterThan(BASE_SCORE);

    unit.addAbility(Abilities.Simple);
    expect(scoreMove(battle, unit, Moves.SwordsDance, NONE)).toBe(plain);

    unit.removeAbility(Abilities.Simple);
    unit.addAbility(Abilities.Contrary);
    expect(scoreMove(battle, unit, Moves.SwordsDance, NONE)).toBeLessThan(BASE_SCORE);
  });

  it('pays no recoil price under a Rock Head or a Magic Guard', () => {
    const { battle, teamA, teamB } = createAIBattle();
    const unit = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);
    const target = unitTarget(foe);

    const plain = scoreMove(battle, unit, Moves.DoubleEdge, target);

    unit.addAbility(Abilities.RockHead);
    const rockHead = scoreMove(battle, unit, Moves.DoubleEdge, target);

    unit.removeAbility(Abilities.RockHead);
    unit.addAbility(Abilities.MagicGuard);
    const magicGuard = scoreMove(battle, unit, Moves.DoubleEdge, target);

    expect(rockHead).toBeGreaterThan(plain);
    expect(magicGuard).toBe(rockHead);
  });

  it('fears no crash under a Magic Guard', () => {
    const { battle, teamA, teamB } = createAIBattle();
    const unit = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);
    const target = unitTarget(foe);

    const plain = scoreMove(battle, unit, Moves.HiJumpKick, target);

    unit.addAbility(Abilities.MagicGuard);

    expect(scoreMove(battle, unit, Moves.HiJumpKick, target)).toBeGreaterThan(plain);
  });

  it('drains harder with a Big Root', () => {
    const { battle, teamA, teamB } = createAIBattle();
    const unit = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);
    const target = unitTarget(foe);
    unit.setHealth(40);

    const plain = scoreMove(battle, unit, Moves.GigaDrain, target);

    unit.addItem(Items.BigRoot);

    expect(scoreMove(battle, unit, Moves.GigaDrain, target)).toBeGreaterThan(plain);
  });

  it('holds back a hit whose Life Orb recoil would finish its holder', () => {
    const { battle, teamA, teamB } = createAIBattle();
    const unit = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);
    const target = unitTarget(foe);
    unit.addItem(Items.LifeOrb);

    const healthy = scoreMove(battle, unit, Moves.Tackle, target);

    unit.setHealth(5);

    expect(scoreMove(battle, unit, Moves.Tackle, target)).toBeLessThan(healthy);
  });
});
