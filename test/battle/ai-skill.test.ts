import { describe, expect, it } from 'vitest';
import { setupChooseMoveAI } from '../../src/battle/ai/choose-move';
import { getAIContext } from '../../src/battle/ai/context';
import { BASIC_SKILL, GYM_SKILL, TOP_SKILL, setTrainerSkill } from '../../src/battle/ai/skill';
import { getTrainer } from '../../src/battle/ai/trainer';
import { unitTarget } from '../../src/battle/utils';
import Abilities from '../../src/data/ids/abilities';
import { Items } from '../../src/data/ids/items';
import { Moves } from '../../src/data/ids/moves';
import skillOf, { type OutfittedTeam } from '../../src/overworld/trainer-skill';
import { Stats } from '../../src/data/constants/stats';
import { type BattleHarness, createBattle, createUnit, pinRandom } from './harness';

function createAIBattle(): BattleHarness {
  const harness = createBattle('test-seed');
  setupChooseMoveAI(harness.battle);
  pinRandom(harness.battle, 0.99);
  return harness;
}

/** A party of one, outfitted as asked */
function team(
  player: string,
  abilities: Abilities[],
  items: Items[] = [],
  effort = 0,
): OutfittedTeam {
  return {
    player,
    catches: [
      {
        abilities,
        items,
        effortValues: {
          [Stats.HP]: effort,
          [Stats.Attack]: 0,
          [Stats.Defense]: 0,
          [Stats.SpecialAttack]: 0,
          [Stats.SpecialDefense]: 0,
          [Stats.Speed]: 0,
        },
      },
    ],
  };
}

describe('trainer skill', () => {
  it('reads a team’s rank off how it was outfitted', () => {
    expect(skillOf(team('someone', [Abilities.Static]), false)).toBe(TOP_SKILL);
    expect(skillOf(team('', [Abilities.Static]), false)).toBe(BASIC_SKILL);
    // A grunt's Shadow mark is no second ability
    expect(skillOf(team('', [Abilities.Static, Abilities.Shadow]), false)).toBe(BASIC_SKILL);
    expect(skillOf(team('', [Abilities.Static], [Items.Leftovers]), false)).toBe(GYM_SKILL);
    expect(skillOf(team('', [Abilities.Static], [], 50), false)).toBe(GYM_SKILL);
    expect(skillOf(team('', [Abilities.Static, Abilities.Intimidate]), false)).toBe(TOP_SKILL);
    // A raid boss is a legend, and fights like one
    expect(skillOf(team('', [Abilities.Static]), true)).toBe(TOP_SKILL);
  });

  it('gives a slower trainer time to think before a free unit acts', () => {
    const { battle, teamA, teamB } = createAIBattle();
    setTrainerSkill(teamA, BASIC_SKILL);
    const unit = createUnit(battle, teamA);
    createUnit(battle, teamB);
    unit.addMove(Moves.Tackle);
    const trainer = getTrainer(battle, teamA);

    trainer.command([unit], 0);
    expect(unit.casting).toBeUndefined();

    trainer.command([unit], BASIC_SKILL.think);
    expect(unit.casting?.move).toBe(Moves.Tackle);
  });

  it('reacts to a foe’s cast only once its reaction time has run', () => {
    const { battle, teamA, teamB } = createAIBattle();
    setTrainerSkill(teamA, GYM_SKILL);
    const unit = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);
    foe.addMove(Moves.Tackle);
    const hit = (): boolean => true;

    foe.cast(Moves.Tackle, unitTarget(unit));
    expect(getAIContext(battle, unit).incoming(unit, hit)).toBe(false);

    battle.tick(GYM_SKILL.reaction);
    expect(getAIContext(battle, unit).incoming(unit, hit)).toBe(true);
  });

  it('now and then throws something other than the best move', () => {
    const { battle, teamA, teamB } = createAIBattle();
    setTrainerSkill(teamA, BASIC_SKILL);
    const unit = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);
    unit.addMove(Moves.Tackle);
    unit.addMove(Moves.Splash);
    foe.setHealth(10);

    // The first roll is a misplay, and the pick lands on the last option
    const rolls = [0.01, 0.99];

    battle.random = () => rolls.shift() ?? 0.99;

    expect(getTrainer(battle, teamA).order(unit, 0)?.move).toBe(Moves.Attack);
  });
});
