// Diancie, Hoopa and Volcanion.

import { describe, expect, it } from 'vitest';
import { Stages, Stats } from '../../../../src/data/constants/stats';
import { Types } from '../../../../src/data/constants/types';
import Abilities from '../../../../src/data/ids/abilities';
import { MoveCategories, Moves } from '../../../../src/data/ids/moves';
import { Weathers } from '../../../../src/data/ids/status';
import {
  BOILER_SCALE,
  REGALIA_INTERVAL,
  REGALIA_LIMIT,
} from '../../../../src/battle/abilities/signature/kalos-mythicals';
import { MoveTargetType } from '../../../../src/battle/events';
import { createBattle, createUnit, pinRandom } from '../../harness';
import { dealDamage } from './helpers';

describe("Kalos's mythicals", () => {
  it('hands its court a shell, a layer at a time', () => {
    const { battle, teamA, teamB } = createBattle();
    const queen = createUnit(battle, teamA, [Types.Rock, Types.Fairy]);
    const mate = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);

    pinRandom(battle, 1);
    queen.addAbility(Abilities.Regalia);
    queen.enter();
    mate.enter();
    foe.enter();

    battle.tick(REGALIA_INTERVAL);

    expect(queen.stages[Stages.Defense]).toBe(1);
    expect(mate.stages[Stages.Defense]).toBe(1);
    // The other side is given nothing
    expect(foe.stages[Stages.Defense]).toBe(0);

    battle.tick(REGALIA_INTERVAL * (REGALIA_LIMIT + 2));

    expect(mate.stages[Stages.Defense]).toBe(REGALIA_LIMIT);
  });

  it('sends a move back through the ring at whoever threw it', () => {
    const { battle, teamA, teamB } = createBattle();
    const rings = createUnit(battle, teamA, [Types.Psychic, Types.Ghost]);
    const foe = createUnit(battle, teamB);

    pinRandom(battle, 1);
    rings.addAbility(Abilities.Ringback);
    rings.enter();
    foe.enter();

    const aimed = { type: MoveTargetType.Unit, unit: rings } as const;

    // Never, at a roll above the chance
    expect(foe.checkMoveRedirect(Moves.Pound, aimed)).toEqual(aimed);

    // And back at the thrower under it
    pinRandom(battle, 0);

    expect(foe.checkMoveRedirect(Moves.Pound, aimed)).toEqual({
      type: MoveTargetType.Unit,
      unit: foe,
    });
  });

  it('is not damped by the sky its other half would like', () => {
    const { battle, teamA, teamB } = createBattle();
    const boiler = createUnit(battle, teamA, [Types.Fire, Types.Water]);
    const foe = createUnit(battle, teamB);

    pinRandom(battle, 1);
    boiler.enter();
    foe.enter();
    battle.setWeather(Weathers.Rain, 0);

    const whole = foe.checkStat(Stats.HP, 0);
    const bare = dealDamage(boiler, foe, Moves.Incinerate, 40, Types.Fire, MoveCategories.Special);

    foe.setHealth(whole);
    boiler.addAbility(Abilities.Boiler);

    expect(
      dealDamage(boiler, foe, Moves.Incinerate, 40, Types.Fire, MoveCategories.Special),
    ).toBeCloseTo(bare * BOILER_SCALE, 0);

    // A Fire move in the sun is already at its best, so nothing is owed
    battle.setWeather(Weathers.Sunny, 0);
    foe.setHealth(whole);

    const sunlit = dealDamage(
      boiler,
      foe,
      Moves.Incinerate,
      40,
      Types.Fire,
      MoveCategories.Special,
    );

    foe.setHealth(whole);
    boiler.removeAbility(Abilities.Boiler);

    expect(
      dealDamage(boiler, foe, Moves.Incinerate, 40, Types.Fire, MoveCategories.Special),
    ).toBeCloseTo(sunlit, 0);
  });
});
