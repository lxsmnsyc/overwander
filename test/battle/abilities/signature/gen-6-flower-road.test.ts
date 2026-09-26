// Flabebe through Furfrou.

import { describe, expect, it } from 'vitest';
import { Stats, StatsKind } from '../../../../src/data/constants/stats';
import { Types } from '../../../../src/data/constants/types';
import Abilities from '../../../../src/data/ids/abilities';
import { MoveCategories, Moves } from '../../../../src/data/ids/moves';
import { Statuses } from '../../../../src/data/ids/status';
import { EffectType } from '../../../../src/battle/events';
import {
  PEDIGREE_COAT_FLOOR,
  PEDIGREE_COAT_SCALE,
  SADDLE_BURDEN_FLOOR,
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

  it("takes a status in a teammate's place while it has health to spare", () => {
    const { battle, teamA, teamB } = createBattle();
    const goat = createUnit(battle, teamA, [Types.Grass]);
    const mate = createUnit(battle, teamA);

    pinRandom(battle, 1);
    goat.addAbility(Abilities.SaddleBurden);
    goat.enter();
    mate.enter();
    createUnit(battle, teamB).enter();

    mate.addStatus(Statuses.Poisoned, { type: EffectType.None });

    expect(mate.getStatus(Statuses.Poisoned)).toBeFalsy();
    expect(goat.getStatus(Statuses.Poisoned)).toBeTruthy();

    // One burden at a time: the next dose stays where it landed
    mate.addStatus(Statuses.Burned, { type: EffectType.None });

    expect(mate.getStatus(Statuses.Burned)).toBeTruthy();
    expect(goat.getStatus(Statuses.Burned)).toBeFalsy();
  });

  it('carries nothing once it is down to half its own', () => {
    const { battle, teamA, teamB } = createBattle();
    const goat = createUnit(battle, teamA, [Types.Grass]);
    const mate = createUnit(battle, teamA);

    pinRandom(battle, 1);
    goat.addAbility(Abilities.SaddleBurden);
    goat.enter();
    mate.enter();
    createUnit(battle, teamB).enter();
    goat.setHealth(goat.checkStat(Stats.HP, 0) * SADDLE_BURDEN_FLOOR);

    mate.addStatus(Statuses.Paralyzed, { type: EffectType.None });

    expect(mate.getStatus(Statuses.Paralyzed)).toBeTruthy();
    expect(goat.getStatus(Statuses.Paralyzed)).toBeFalsy();
  });

  it('turns special moves away with the coat until it is hurt', () => {
    const { battle, teamA, teamB } = createBattle();
    const poodle = createUnit(battle, teamA, [Types.Normal]);
    const foe = createUnit(battle, teamB);

    pinRandom(battle, 1);
    poodle.enter();
    foe.enter();

    const bare = dealDamage(foe, poodle, Moves.Ember, 60, Types.Fire, MoveCategories.Special);

    poodle.setHealth(poodle.checkStat(Stats.HP, 0));
    poodle.addAbility(Abilities.PedigreeCoat);

    const coated = dealDamage(foe, poodle, Moves.Ember, 60, Types.Fire, MoveCategories.Special);

    expect(coated).toBeCloseTo(bare * PEDIGREE_COAT_SCALE, 0);

    // The coat is no use to a hurt one, and it never answered a fist
    poodle.setHealth(poodle.checkStat(Stats.HP, 0) * PEDIGREE_COAT_FLOOR - 1);

    const hurt = dealDamage(foe, poodle, Moves.Ember, 60, Types.Fire, MoveCategories.Special);

    expect(hurt).toBeCloseTo(bare, 0);

    poodle.setHealth(poodle.checkStat(Stats.HP, 0));

    const swung = dealDamage(foe, poodle, Moves.Tackle, 60, Types.Normal, MoveCategories.Physical);

    poodle.setHealth(poodle.checkStat(Stats.HP, 0));
    poodle.removeAbility(Abilities.PedigreeCoat);

    expect(
      dealDamage(foe, poodle, Moves.Tackle, 60, Types.Normal, MoveCategories.Physical),
    ).toBeCloseTo(swung, 5);
  });
});
