// Binacle, Skrelp and Clauncher.

import { describe, expect, it } from 'vitest';
import { Stages, Stats } from '../../../../src/data/constants/stats';
import { Types } from '../../../../src/data/constants/types';
import Abilities from '../../../../src/data/ids/abilities';
import { MoveCategories, Moves } from '../../../../src/data/ids/moves';
import {
  MANY_HANDS_SCALE,
  SHOT_FLOOR,
} from '../../../../src/battle/abilities/signature/binacle-to-clauncher';
import { createBattle, createUnit, pinRandom } from '../../harness';
import { NONE_CAUSE, dealDamage } from './helpers';

describe("Kalos's sea", () => {
  it('makes every stage it holds worth half again, either way', () => {
    const { battle, teamA, teamB } = createBattle();
    const rock = createUnit(battle, teamA, [Types.Rock, Types.Water]);

    pinRandom(battle, 1);
    rock.addAbility(Abilities.ManyHands);
    rock.enter();
    createUnit(battle, teamB).enter();

    rock.addStage(Stages.Attack, 2, NONE_CAUSE);
    rock.addStage(Stages.Defense, -2, NONE_CAUSE);

    expect(rock.checkStage(Stages.Attack, 0)).toBe(Math.round(2 * MANY_HANDS_SCALE));
    expect(rock.checkStage(Stages.Defense, 0)).toBe(Math.round(-2 * MANY_HANDS_SCALE));
    // Nothing to read means nothing to multiply
    expect(rock.checkStage(Stages.Speed, 0)).toBe(0);
  });

  it('ignores a blow too small to matter and feels a real one', () => {
    const { battle, teamA, teamB } = createBattle();
    const kelp = createUnit(battle, teamA, [Types.Poison, Types.Water]);
    const foe = createUnit(battle, teamB);

    pinRandom(battle, 1);
    kelp.addAbility(Abilities.DeepKelp);
    kelp.enter();
    foe.enter();

    const whole = kelp.checkStat(Stats.HP, 0);

    // A scratch: under the eighth it lies below
    foe.damage(NONE_CAUSE, kelp, whole * SHOT_FLOOR * 0.5, 0);

    expect(kelp.health).toBe(whole);

    // And a blow that clears it lands in full
    foe.damage(NONE_CAUSE, kelp, whole * SHOT_FLOOR * 2, 0);

    expect(kelp.health).toBeCloseTo(whole - whole * SHOT_FLOOR * 2, 0);
  });

  it('fires no shot smaller than an eighth, however it is resisted', () => {
    const { battle, teamA, teamB } = createBattle();
    const gunner = createUnit(battle, teamA, [Types.Water]);
    // A Water type takes Water moves at half, so the shot is small
    const foe = createUnit(battle, teamB, [Types.Water]);

    pinRandom(battle, 1);
    gunner.enter();
    foe.enter();

    const whole = foe.checkStat(Stats.HP, 0);
    const bare = dealDamage(gunner, foe, Moves.Bubble, 10, Types.Water, MoveCategories.Special);

    expect(bare).toBeLessThan(whole * SHOT_FLOOR);

    foe.setHealth(whole);
    gunner.addAbility(Abilities.RangingShot);

    expect(
      dealDamage(gunner, foe, Moves.Bubble, 10, Types.Water, MoveCategories.Special),
    ).toBeCloseTo(whole * SHOT_FLOOR, 0);
  });

  it('leaves a physical shot and a refused one alone', () => {
    const { battle, teamA, teamB } = createBattle();
    const gunner = createUnit(battle, teamA, [Types.Water]);
    const foe = createUnit(battle, teamB, [Types.Water]);

    pinRandom(battle, 1);
    gunner.addAbility(Abilities.RangingShot);
    gunner.enter();
    foe.enter();

    const whole = foe.checkStat(Stats.HP, 0);
    const swung = dealDamage(gunner, foe, Moves.Tackle, 10, Types.Normal, MoveCategories.Physical);

    expect(swung).toBeLessThan(whole * SHOT_FLOOR);
  });
});
