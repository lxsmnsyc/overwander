import { describe, expect, it } from 'vitest';
import { chooseMove, setupChooseMoveAI } from '../../src/battle/ai/choose-move';
import Natures, { NATURE_EFFECTS, NATURE_NAMES } from '../../src/data/ids/natures';
import setupNatureAI, { MoveStyle, getMoveStyle } from '../../src/battle/ai/nature';
import { Moves } from '../../src/data/ids/moves';
import { Stats } from '../../src/data/constants/stats';
import { EffectType, MoveTargetType } from '../../src/battle/events';
import { Statuses } from '../../src/data/ids/status';
import { createBattle, createUnit, pinRandom } from './harness';

/**
 * The Palace's rule, as the engine sees it: a scoring listener on top
 * of the ordinary chooser. Every case here is the same field fought
 * twice, once with the listener and once without, since what is being
 * asserted is the difference the leaning makes
 */
function pickWith(nature: Natures, byNature: boolean): Moves | undefined {
  const { battle, teamA, teamB } = createBattle();
  setupChooseMoveAI(battle);

  if (byNature) {
    setupNatureAI(battle);
  }
  pinRandom(battle, 0);

  const source = createUnit(battle, teamA);
  createUnit(battle, teamB);

  source.setNature(nature);
  source.addMove(Moves.Tackle);
  source.addMove(Moves.WaterGun);
  source.addMove(Moves.Growl);

  return chooseMove(battle, source)?.move;
}

/**
 * Who a nature aims at, told apart by which of two enemies is picked:
 * one hampered and hurt, one whole
 */
function aimWith(nature: Natures, byNature: boolean): string {
  const { battle, teamA, teamB } = createBattle();
  setupChooseMoveAI(battle);

  if (byNature) {
    setupNatureAI(battle);
  }
  pinRandom(battle, 0);

  const source = createUnit(battle, teamA);
  const strong = createUnit(battle, teamB);
  const weak = createUnit(battle, teamB);

  source.setNature(nature);
  source.addMove(Moves.Tackle);
  // Hurt and hampered, but not near enough to going down for the
  // try-to-KO bonus to answer for the choice
  weak.setHealth(80);
  weak.addStatus(Statuses.Paralyzed, { type: EffectType.None });

  const target = chooseMove(battle, source)?.target;

  if (target?.type !== MoveTargetType.Unit) {
    return 'none';
  }
  return target.unit === strong ? 'strong' : 'weak';
}

describe('fighting by nature', () => {
  it('reads a leaning off the stat each nature raises', () => {
    // The neutral five say nothing about what to do
    expect(getMoveStyle(Natures.Hardy)).toBe(MoveStyle.Balanced);
    expect(getMoveStyle(Natures.Quirky)).toBe(MoveStyle.Balanced);

    expect(getMoveStyle(Natures.Adamant)).toBe(MoveStyle.Attack);
    expect(getMoveStyle(Natures.Modest)).toBe(MoveStyle.Attack);
    expect(getMoveStyle(Natures.Jolly)).toBe(MoveStyle.Attack);
    expect(getMoveStyle(Natures.Bold)).toBe(MoveStyle.Defense);
    expect(getMoveStyle(Natures.Careful)).toBe(MoveStyle.Defense);

    // And every nature is read, so nobody falls through
    const defensive = new Set<Stats>([Stats.Defense, Stats.SpecialDefense]);

    for (const nature of Object.keys(NATURE_NAMES).map(Number) as Natures[]) {
      const effect = NATURE_EFFECTS[nature];
      let expected = MoveStyle.Balanced;

      if (effect != null) {
        expected = defensive.has(effect.up) ? MoveStyle.Defense : MoveStyle.Attack;
      }

      expect(getMoveStyle(nature), NATURE_NAMES[nature]).toBe(expected);
    }
  });

  it('sends a defensive nature to a status move it would not otherwise cast', () => {
    expect(pickWith(Natures.Bold, false)).not.toBe(Moves.Growl);
    expect(pickWith(Natures.Bold, true)).toBe(Moves.Growl);
  });

  it('picks the half of the split an attacking nature raised', () => {
    expect(pickWith(Natures.Adamant, true)).toBe(Moves.Tackle);
    expect(pickWith(Natures.Modest, true)).toBe(Moves.WaterGun);
  });

  it('sends an attacking nature at what it can finish, not at the threat', () => {
    // The ordinary AI concentrates fire on the biggest threat, so a
    // hampered enemy is the one it leaves alone
    expect(aimWith(Natures.Adamant, false)).toBe('strong');
    expect(aimWith(Natures.Adamant, true)).toBe('weak');
  });

  it('keeps a defensive nature on the threat it was already answering', () => {
    expect(aimWith(Natures.Bold, true)).toBe('strong');
  });

  it('leaves a neutral nature fighting on merit', () => {
    expect(pickWith(Natures.Hardy, true)).toBe(pickWith(Natures.Hardy, false));
  });
});
