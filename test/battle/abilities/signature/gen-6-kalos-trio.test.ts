// Xerneas, Yveltal and Zygarde.

import { describe, expect, it } from 'vitest';
import { Stages } from '../../../../src/data/constants/stats';
import { Types } from '../../../../src/data/constants/types';
import Abilities from '../../../../src/data/ids/abilities';
import { EVEN_KEEL_SCALE } from '../../../../src/battle/abilities/signature/kalos-trio';
import { EffectType } from '../../../../src/battle/events';
import { createBattle, createUnit, pinRandom } from '../../harness';
import { NONE_CAUSE } from './helpers';

describe("Kalos's three", () => {
  it('gives its own side a deeper measure of whatever it is given', () => {
    const { battle, teamA, teamB } = createBattle();
    const stag = createUnit(battle, teamA, [Types.Fairy]);
    const mate = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);

    pinRandom(battle, 1);
    stag.addAbility(Abilities.Quickening);
    stag.enter();
    mate.enter();
    foe.enter();

    mate.addStage(Stages.Attack, 1, NONE_CAUSE);

    expect(mate.stages[Stages.Attack]).toBe(2);

    // The other side is given exactly what it was given
    foe.addStage(Stages.Attack, 1, NONE_CAUSE);

    expect(foe.stages[Stages.Attack]).toBe(1);
  });

  it('takes a stage deeper off an enemy, and only what it takes itself', () => {
    const { battle, teamA, teamB } = createBattle();
    const bird = createUnit(battle, teamA, [Types.Dark, Types.Flying]);
    const mate = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);

    pinRandom(battle, 1);
    bird.addAbility(Abilities.Withering);
    bird.enter();
    mate.enter();
    foe.enter();

    foe.addStage(Stages.Defense, -1, { type: EffectType.None });

    expect(foe.stages[Stages.Defense]).toBe(-1);

    foe.addStage(Stages.Defense, -1, {
      type: EffectType.Ability,
      ability: Abilities.Withering,
      unit: bird,
    });

    expect(foe.stages[Stages.Defense]).toBe(-3);

    // A teammate's own doing is its own size
    foe.addStage(Stages.SpecialDefense, -1, {
      type: EffectType.Ability,
      ability: Abilities.Intimidate,
      unit: mate,
    });

    expect(foe.stages[Stages.SpecialDefense]).toBe(-1);
  });

  it('flattens every stage on the field while it stands, its own included', () => {
    const { battle, teamA, teamB } = createBattle();
    const swarm = createUnit(battle, teamA, [Types.Dragon, Types.Ground]);
    const foe = createUnit(battle, teamB);

    pinRandom(battle, 1);
    swarm.enter();
    foe.enter();

    foe.addStage(Stages.Attack, 4, NONE_CAUSE);
    swarm.addStage(Stages.Defense, 4, NONE_CAUSE);

    expect(foe.checkStage(Stages.Attack, 0)).toBe(4);

    swarm.addAbility(Abilities.EvenKeel);

    expect(foe.checkStage(Stages.Attack, 0)).toBe(4 * EVEN_KEEL_SCALE);
    expect(swarm.checkStage(Stages.Defense, 0)).toBe(4 * EVEN_KEEL_SCALE);
  });
});
