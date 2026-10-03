// Inkay, Helioptile and Hawlucha.

import { describe, expect, it } from 'vitest';
import { Stages, Stats } from '../../../../src/data/constants/stats';
import { Types } from '../../../../src/data/constants/types';
import Abilities from '../../../../src/data/ids/abilities';
import { MoveCategories, Moves } from '../../../../src/data/ids/moves';
import {
  BACKFEED_SHARE,
  OVERTURN_COOLDOWN,
  TOP_ROPE_CAP,
  TOP_ROPE_GAIN,
  TOP_ROPE_STEP,
} from '../../../../src/battle/abilities/signature/inkay-to-hawlucha';
import { createBattle, createUnit, pinRandom } from '../../harness';
import { NONE_CAUSE, dealDamage } from './helpers';

describe("Kalos's sun and sky", () => {
  it('turns over every stage the target has built', () => {
    const { battle, teamA, teamB } = createBattle();
    const squid = createUnit(battle, teamA, [Types.Dark, Types.Psychic]);
    const foe = createUnit(battle, teamB);

    pinRandom(battle, 1);
    squid.addAbility(Abilities.Overturn);
    squid.enter();
    foe.enter();

    foe.addStage(Stages.Attack, 2, NONE_CAUSE);
    foe.addStage(Stages.Speed, -1, NONE_CAUSE);

    dealDamage(squid, foe, Moves.Pound, 10, Types.Normal, MoveCategories.Physical);
    // The move flies before it lands
    battle.tick(1000);

    expect(foe.stages[Stages.Attack]).toBe(-2);
    expect(foe.stages[Stages.Speed]).toBe(1);
  });

  it('leaves the same target alone until the lights come round again', () => {
    const { battle, teamA, teamB } = createBattle();
    const squid = createUnit(battle, teamA, [Types.Dark, Types.Psychic]);
    const foe = createUnit(battle, teamB);

    pinRandom(battle, 1);
    squid.addAbility(Abilities.Overturn);
    squid.enter();
    foe.enter();

    foe.addStage(Stages.Attack, 2, NONE_CAUSE);
    dealDamage(squid, foe, Moves.Pound, 10, Types.Normal, MoveCategories.Physical);
    battle.tick(1000);

    expect(foe.stages[Stages.Attack]).toBe(-2);

    // A second blow inside the window finds the lights still off
    dealDamage(squid, foe, Moves.Pound, 10, Types.Normal, MoveCategories.Physical);
    battle.tick(1000);

    expect(foe.stages[Stages.Attack]).toBe(-2);

    battle.tick(OVERTURN_COOLDOWN);
    dealDamage(squid, foe, Moves.Pound, 10, Types.Normal, MoveCategories.Physical);
    battle.tick(1000);

    expect(foe.stages[Stages.Attack]).toBe(2);
  });

  it('feeds a shock back to the whole team', () => {
    const { battle, teamA, teamB } = createBattle();
    const lizard = createUnit(battle, teamA, [Types.Electric, Types.Normal]);
    const mate = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);

    pinRandom(battle, 1);
    lizard.addAbility(Abilities.Backfeed);
    lizard.enter();
    mate.enter();
    foe.enter();

    const whole = lizard.checkStat(Stats.HP, 0);

    lizard.setHealth(whole / 2);
    mate.setHealth(whole / 2);

    const dealt = dealDamage(
      lizard,
      foe,
      Moves.ThunderShock,
      40,
      Types.Electric,
      MoveCategories.Special,
    );

    expect(dealt).toBeGreaterThan(0);
    expect(lizard.health).toBeCloseTo(whole / 2 + dealt * BACKFEED_SHARE, 0);
    expect(mate.health).toBeCloseTo(whole / 2 + dealt * BACKFEED_SHARE, 0);
  });

  it('feeds nothing back off a move that is not Electric', () => {
    const { battle, teamA, teamB } = createBattle();
    const lizard = createUnit(battle, teamA, [Types.Electric, Types.Normal]);
    const foe = createUnit(battle, teamB);

    pinRandom(battle, 1);
    lizard.addAbility(Abilities.Backfeed);
    lizard.enter();
    foe.enter();

    const half = lizard.checkStat(Stats.HP, 0) / 2;

    lizard.setHealth(half);
    dealDamage(lizard, foe, Moves.Pound, 40, Types.Normal, MoveCategories.Physical);

    expect(lizard.health).toBe(half);
  });

  it('hits for what it lands on, up to the cap', () => {
    const { battle, teamA, teamB } = createBattle();
    const wrestler = createUnit(battle, teamA, [Types.Fighting, Types.Flying]);
    const foe = createUnit(battle, teamB);

    pinRandom(battle, 1);
    wrestler.enter();
    foe.enter();

    const whole = foe.checkStat(Stats.HP, 0);

    foe.setWeight(TOP_ROPE_STEP * 2);

    const bare = dealDamage(wrestler, foe, Moves.Tackle, 40, Types.Normal, MoveCategories.Physical);

    foe.setHealth(whole);
    wrestler.addAbility(Abilities.TopRope);

    expect(
      dealDamage(wrestler, foe, Moves.Tackle, 40, Types.Normal, MoveCategories.Physical),
    ).toBeCloseTo(bare * (1 + 2 * TOP_ROPE_GAIN), 0);

    // Heavy enough to sit on the cap rather than above it
    foe.setWeight(TOP_ROPE_STEP * 20);
    foe.setHealth(whole);

    expect(
      dealDamage(wrestler, foe, Moves.Tackle, 40, Types.Normal, MoveCategories.Physical),
    ).toBeCloseTo(bare * TOP_ROPE_CAP, 0);
  });

  it('leaves a light target and a move thrown from a distance alone', () => {
    const { battle, teamA, teamB } = createBattle();
    const wrestler = createUnit(battle, teamA, [Types.Fighting, Types.Flying]);
    const foe = createUnit(battle, teamB);

    pinRandom(battle, 1);
    wrestler.enter();
    foe.enter();

    const whole = foe.checkStat(Stats.HP, 0);

    foe.setWeight(TOP_ROPE_STEP / 2);

    const light = dealDamage(
      wrestler,
      foe,
      Moves.Tackle,
      40,
      Types.Normal,
      MoveCategories.Physical,
    );

    foe.setHealth(whole);
    wrestler.addAbility(Abilities.TopRope);

    expect(
      dealDamage(wrestler, foe, Moves.Tackle, 40, Types.Normal, MoveCategories.Physical),
    ).toBeCloseTo(light, 0);

    // A heavy target still gains nothing from a move that never touches it
    foe.setWeight(TOP_ROPE_STEP * 4);
    foe.setHealth(whole);

    const thrown = dealDamage(wrestler, foe, Moves.Swift, 40, Types.Normal, MoveCategories.Special);

    foe.setHealth(whole);
    wrestler.removeAbility(Abilities.TopRope);

    expect(
      dealDamage(wrestler, foe, Moves.Swift, 40, Types.Normal, MoveCategories.Special),
    ).toBeCloseTo(thrown, 0);
  });
});
