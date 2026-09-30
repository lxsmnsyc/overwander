// The Ultra Beasts, with Beast Boost.

import { describe, expect, it } from 'vitest';
import { SpawnRarity, getSpawnRarity } from '../../../../src/data/biome';
import { Stages } from '../../../../src/data/constants/stats';
import { Types } from '../../../../src/data/constants/types';
import Abilities from '../../../../src/data/ids/abilities';
import { MoveCategories, Moves } from '../../../../src/data/ids/moves';
import { Species, ULTRA_BEASTS } from '../../../../src/data/ids/species';
import { createBattle, createUnit, pinRandom } from '../../harness';
import { dealDamage } from './helpers';

describe('Foreign Body', () => {
  it('takes one weakness to neutral and leaves the rest', () => {
    const { battle, teamA, teamB } = createBattle();
    const foe = createUnit(battle, teamA);
    const beast = createUnit(battle, teamB, [Types.Electric]);
    const plain = createUnit(battle, teamB, [Types.Electric]);
    const neutral = createUnit(battle, teamB, [Types.Normal]);

    pinRandom(battle, 1);
    beast.addAbility(Abilities.Unearthed);

    const quake = [Moves.Earthquake, 100, Types.Ground, MoveCategories.Physical] as const;
    const even = dealDamage(foe, neutral, ...quake);

    expect(dealDamage(foe, plain, ...quake)).toBeGreaterThan(even);
    expect(dealDamage(foe, beast, ...quake)).toBe(even);
  });

  it('turns a double weakness to neutral rather than a resistance', () => {
    const { battle, teamA, teamB } = createBattle();
    const foe = createUnit(battle, teamA);
    const beast = createUnit(battle, teamB, [Types.Rock, Types.Poison]);
    const neutral = createUnit(battle, teamB, [Types.Normal]);

    pinRandom(battle, 1);
    beast.addAbility(Abilities.Earthless);

    const quake = [Moves.Earthquake, 100, Types.Ground, MoveCategories.Physical] as const;

    expect(dealDamage(foe, beast, ...quake)).toBe(dealDamage(foe, neutral, ...quake));
  });
});

describe('Beast Boost', () => {
  it('raises its highest stat when it knocks something out', () => {
    const { battle, teamA, teamB } = createBattle();
    const beast = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);

    pinRandom(battle, 1);
    beast.addAbility(Abilities.BeastBoost);
    beast.enter();
    foe.enter();
    foe.setHealth(1);
    dealDamage(beast, foe, Moves.Tackle, 80, Types.Normal, MoveCategories.Physical);

    expect(foe.alive).toBe(false);

    // The harness gives every stat the same value, so the first of the
    // five is the highest and takes the stage
    let total = 0;

    for (const stage of [
      Stages.Attack,
      Stages.Defense,
      Stages.SpecialAttack,
      Stages.SpecialDefense,
      Stages.Speed,
    ]) {
      total += beast.stages[stage];
    }
    expect(total).toBe(1);
    expect(beast.stages[Stages.Attack]).toBe(1);
    expect(total).toBe(1);
  });
});

describe('the Ultra Beasts in the world', () => {
  it('stages every beast but the Poipole line by its lair', () => {
    for (const species of ULTRA_BEASTS) {
      if (species === Species.Poipole) {
        expect(getSpawnRarity(species)).toBe(SpawnRarity.Prized);
      } else if (species !== Species.Naganadel) {
        expect(getSpawnRarity(species)).toBe(SpawnRarity.Special);
      }
    }
  });
});
