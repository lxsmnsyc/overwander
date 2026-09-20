// Flabebe through Furfrou.

import { describe, expect, it } from 'vitest';
import { Stages, Stats, StatsKind } from '../../../../src/data/constants/stats';
import { Types } from '../../../../src/data/constants/types';
import Abilities from '../../../../src/data/ids/abilities';
import { MoveCategories, Moves } from '../../../../src/data/ids/moves';
import { Statuses } from '../../../../src/data/ids/status';
import { EffectType } from '../../../../src/battle/events';
import {
  BROAD_BACK_FLOOR,
  BROAD_BACK_SHARE,
} from '../../../../src/battle/abilities/signature/flabebe-to-furfrou';
import { createBattle, createUnit, pinRandom } from '../../harness';
import { dealDamage } from './helpers';

describe("Kalos's flower road", () => {
  it('puts the garden roof over a teammate with the thinner special guard', () => {
    const { battle, teamA, teamB } = createBattle();
    const garden = createUnit(battle, teamA, [Types.Fairy]);
    const mate = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);

    pinRandom(battle, 1);
    garden.setStat(StatsKind.Base, Stats.SpecialDefense, 200);
    mate.setStat(StatsKind.Base, Stats.SpecialDefense, 60);
    garden.enter();
    mate.enter();
    foe.enter();

    const bare = dealDamage(foe, mate, Moves.Ember, 80, Types.Fire, MoveCategories.Special);

    mate.setHealth(mate.checkStat(Stats.HP, 0));
    garden.addAbility(Abilities.Hothouse);

    const sheltered = dealDamage(foe, mate, Moves.Ember, 80, Types.Fire, MoveCategories.Special);

    expect(sheltered).toBeLessThan(bare);
  });

  it('leaves a physical blow and a thicker teammate alone', () => {
    const { battle, teamA, teamB } = createBattle();
    const garden = createUnit(battle, teamA, [Types.Fairy]);
    const thick = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);

    pinRandom(battle, 1);
    garden.setStat(StatsKind.Base, Stats.SpecialDefense, 60);
    thick.setStat(StatsKind.Base, Stats.SpecialDefense, 200);
    garden.enter();
    thick.enter();
    foe.enter();

    const special = dealDamage(foe, thick, Moves.Ember, 80, Types.Fire, MoveCategories.Special);

    thick.setHealth(thick.checkStat(Stats.HP, 0));
    garden.addAbility(Abilities.Hothouse);

    // A roof lower than the guard under it is no roof at all
    expect(dealDamage(foe, thick, Moves.Ember, 80, Types.Fire, MoveCategories.Special)).toBeCloseTo(
      special,
      5,
    );

    thick.setHealth(thick.checkStat(Stats.HP, 0));

    const physical = dealDamage(
      foe,
      thick,
      Moves.Tackle,
      80,
      Types.Normal,
      MoveCategories.Physical,
    );

    thick.setHealth(thick.checkStat(Stats.HP, 0));
    garden.removeAbility(Abilities.Hothouse);

    expect(
      dealDamage(foe, thick, Moves.Tackle, 80, Types.Normal, MoveCategories.Physical),
    ).toBeCloseTo(physical, 5);
  });

  it('carries a third of what its teammate is hit with', () => {
    const { battle, teamA, teamB } = createBattle();
    const goat = createUnit(battle, teamA, [Types.Grass]);
    const mate = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);

    pinRandom(battle, 1);
    goat.enter();
    mate.enter();
    foe.enter();

    const bare = dealDamage(foe, mate, Moves.Tackle, 80, Types.Normal, MoveCategories.Physical);

    mate.setHealth(mate.checkStat(Stats.HP, 0));
    goat.addAbility(Abilities.BroadBack);

    const whole = goat.health;
    const shared = dealDamage(foe, mate, Moves.Tackle, 80, Types.Normal, MoveCategories.Physical);

    expect(shared).toBeCloseTo(bare * (1 - BROAD_BACK_SHARE), 0);
    expect(whole - goat.health).toBeCloseTo(bare * BROAD_BACK_SHARE, 0);
  });

  it('stops carrying once it is down to a quarter of its own', () => {
    const { battle, teamA, teamB } = createBattle();
    const goat = createUnit(battle, teamA, [Types.Grass]);
    const mate = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);

    pinRandom(battle, 1);
    goat.addAbility(Abilities.BroadBack);
    goat.enter();
    mate.enter();
    foe.enter();
    goat.setHealth(goat.checkStat(Stats.HP, 0) * BROAD_BACK_FLOOR);

    const spent = goat.health;
    const taken = dealDamage(foe, mate, Moves.Tackle, 80, Types.Normal, MoveCategories.Physical);

    expect(taken).toBeGreaterThan(0);
    expect(goat.health).toBe(spent);
  });

  it('shrugs the first status off and takes the second', () => {
    const { battle, teamA, teamB } = createBattle();
    const poodle = createUnit(battle, teamA, [Types.Normal]);

    pinRandom(battle, 1);
    poodle.addAbility(Abilities.WellGroomed);
    poodle.enter();
    createUnit(battle, teamB).enter();

    poodle.addStatus(Statuses.Burned, { type: EffectType.None });

    expect(poodle.getStatus(Statuses.Burned)).toBeFalsy();
    expect(poodle.stages[Stages.Speed]).toBe(1);

    poodle.addStatus(Statuses.Burned, { type: EffectType.None });

    expect(poodle.getStatus(Statuses.Burned)).toBeTruthy();
    expect(poodle.stages[Stages.Speed]).toBe(1);
  });
});
