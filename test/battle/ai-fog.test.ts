import { describe, expect, it } from 'vitest';
import { chooseMove, setupChooseMoveAI } from '../../src/battle/ai/choose-move';
import { knowsAbility, knowsMove } from '../../src/battle/ai/fog';
import { BASE_SCORE } from '../../src/battle/ai/score';
import { BattleEvents, type CheckUnitAIMoveScoreEvent } from '../../src/battle/events';
import type Unit from '../../src/battle/unit';
import { unitTarget } from '../../src/battle/utils';
import Abilities from '../../src/data/ids/abilities';
import { Items } from '../../src/data/ids/items';
import { Moves } from '../../src/data/ids/moves';
import { type BattleHarness, createBattle, createUnit, pinRandom } from './harness';

function createFogBattle(): BattleHarness {
  const harness = createBattle('test-seed');
  setupChooseMoveAI(harness.battle);
  pinRandom(harness.battle, 0.99);
  return harness;
}

function scoreAt(battle: BattleHarness['battle'], source: Unit, move: Moves, target: Unit): number {
  const event: CheckUnitAIMoveScoreEvent = {
    id: 'CheckUnitAIMoveScore',
    disabled: false,
    source,
    move,
    target: unitTarget(target),
    score: BASE_SCORE,
  };
  battle.emit(BattleEvents.CheckUnitAIMoveScore, event);
  return event.score;
}

describe('the fog', () => {
  it('hides a held item until it shows itself', () => {
    const { battle, teamA, teamB } = createFogBattle();
    const unit = createUnit(battle, teamA);
    const floater = createUnit(battle, teamB);
    floater.addItem(Items.AirBalloon);
    unit.addMove(Moves.BoneClub);

    expect(chooseMove(battle, unit)?.move).toBe(Moves.BoneClub);

    floater.triggerItem(Items.AirBalloon);

    expect(chooseMove(battle, unit)?.move).toBe(Moves.Attack);
  });

  it('only hides things while the AI is weighing a move', () => {
    const { battle, teamA, teamB } = createFogBattle();
    const unit = createUnit(battle, teamA);
    const floater = createUnit(battle, teamB);
    floater.addItem(Items.AirBalloon);
    unit.addMove(Moves.BoneClub);

    chooseMove(battle, unit);

    expect(floater.hasItem(Items.AirBalloon)).toBe(true);
  });

  it('hides nothing on the caster’s own side', () => {
    const { battle, teamA, teamB } = createFogBattle();
    const unit = createUnit(battle, teamA);
    const ally = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);
    ally.addAbility(Abilities.Levitate);
    foe.addAbility(Abilities.Levitate);

    expect(knowsAbility(unit, ally, Abilities.Levitate)).toBe(true);
    expect(knowsAbility(unit, foe, Abilities.Levitate)).toBe(false);
    expect(knowsMove(unit, ally, Moves.Surf)).toBe(true);
  });

  it('always knows a raid boss for what it is', () => {
    const { battle, teamA, teamB } = createFogBattle();
    const unit = createUnit(battle, teamA);
    const boss = createUnit(battle, teamB);

    expect(knowsAbility(unit, boss, Abilities.Boss)).toBe(true);
  });

  it('assumes a foe holds something to knock off until it knows otherwise', () => {
    const { battle, teamA, teamB } = createFogBattle();
    const unit = createUnit(battle, teamA);
    const holding = createUnit(battle, teamB);
    const bare = createUnit(battle, teamB);
    holding.addItem(Items.Leftovers);

    expect(scoreAt(battle, unit, Moves.KnockOff, bare)).toBe(
      scoreAt(battle, unit, Moves.KnockOff, holding),
    );
  });
});
