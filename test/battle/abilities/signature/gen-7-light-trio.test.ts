// Cosmog's line and Necrozma, with their armour, Neuroforce and Ultra Burst.

import { describe, expect, it } from 'vitest';
import { NEUROFORCE_SCALE } from '../../../../src/battle/abilities/gen-7';
import { MOLD_PROOF_ABILITIES } from '../../../../src/battle/abilities/protected';
import { SKY_ARC_RISE } from '../../../../src/battle/abilities/signature/__create';
import { MoveTargetType } from '../../../../src/battle/events';
import { unitTarget } from '../../../../src/battle/utils';
import { SpawnRarity, getSpawnRarity } from '../../../../src/data/biome';
import { Stages, Stats } from '../../../../src/data/constants/stats';
import { Types } from '../../../../src/data/constants/types';
import Abilities from '../../../../src/data/ids/abilities';
import { Items } from '../../../../src/data/ids/items';
import { MoveCategories, Moves } from '../../../../src/data/ids/moves';
import { Species } from '../../../../src/data/ids/species';
import { createBattle, createUnit, pinRandom } from '../../harness';
import { dealDamage } from './helpers';

describe('Zenith and Nadir', () => {
  it('lift a move by how full the holder is, in opposite directions', () => {
    const { battle, teamA, teamB } = createBattle();
    const sun = createUnit(battle, teamA);
    const prism = createUnit(battle, teamA);
    const plain = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);

    sun.addAbility(Abilities.Zenith);
    prism.addAbility(Abilities.Nadir);

    const power = (unit: typeof sun): number =>
      unit.checkMovePower(Moves.Tackle, unitTarget(foe)) ?? 0;
    const base = power(plain);

    expect(power(sun)).toBeCloseTo(base * (1 + SKY_ARC_RISE), 5);
    expect(power(prism)).toBeCloseTo(base, 5);

    for (const unit of [sun, prism]) {
      unit.setHealth(unit.checkStat(Stats.HP, 0) / 2);
    }
    expect(power(sun)).toBeCloseTo(base * (1 + SKY_ARC_RISE / 2), 5);
    expect(power(prism)).toBeCloseTo(base * (1 + SKY_ARC_RISE / 2), 5);
  });
});

describe('the light trio armour', () => {
  it('Shadow Shield halves a blow at full health even through Mold Breaker', () => {
    const { battle, teamA, teamB } = createBattle();
    const breaker = createUnit(battle, teamA);
    const shield = createUnit(battle, teamB);
    const bare = createUnit(battle, teamB);

    pinRandom(battle, 1);
    breaker.addAbility(Abilities.MoldBreaker);
    shield.addAbility(Abilities.ShadowShield);

    const plain = dealDamage(
      breaker,
      bare,
      Moves.Tackle,
      80,
      Types.Normal,
      MoveCategories.Physical,
    );
    const halved = dealDamage(
      breaker,
      shield,
      Moves.Tackle,
      80,
      Types.Normal,
      MoveCategories.Physical,
    );

    expect(halved).toBeCloseTo(plain / 2, 0);
  });

  it('Full Metal Body refuses a stat drop, and all three are mold-proof', () => {
    const { battle, teamA, teamB } = createBattle();
    const foe = createUnit(battle, teamA);
    const lion = createUnit(battle, teamB);

    pinRandom(battle, 1);
    lion.addAbility(Abilities.FullMetalBody);
    foe.triggerMoveEffect(Moves.Growl, { type: MoveTargetType.Unit, unit: lion }, 0);

    expect(lion.stages[Stages.Attack]).toBe(0);
    expect([...MOLD_PROOF_ABILITIES]).toEqual([
      Abilities.FullMetalBody,
      Abilities.ShadowShield,
      Abilities.PrismArmor,
    ]);
  });

  it('Neuroforce lifts only a super-effective blow', () => {
    const { battle, teamA, teamB } = createBattle();
    const ultra = createUnit(battle, teamA);
    const plain = createUnit(battle, teamA);
    const grass = createUnit(battle, teamB, [Types.Grass]);
    const water = createUnit(battle, teamB, [Types.Water]);

    pinRandom(battle, 1);
    ultra.addAbility(Abilities.Neuroforce);

    const strong = dealDamage(plain, grass, Moves.Ember, 80, Types.Fire, MoveCategories.Special);

    grass.setHealth(grass.checkStat(Stats.HP, 0));
    expect(
      dealDamage(ultra, grass, Moves.Ember, 80, Types.Fire, MoveCategories.Special) / strong,
    ).toBeCloseTo(NEUROFORCE_SCALE, 1);

    const weak = dealDamage(plain, water, Moves.Ember, 80, Types.Fire, MoveCategories.Special);

    water.setHealth(water.checkStat(Stats.HP, 0));
    expect(dealDamage(ultra, water, Moves.Ember, 80, Types.Fire, MoveCategories.Special)).toBe(
      weak,
    );
  });
});

describe('Ultra Burst', () => {
  it('bursts a fused Necrozma holding its crystal, and no other', () => {
    const { battle, teamA } = createBattle();
    const fused = createUnit(battle, teamA);
    const alone = createUnit(battle, teamA);

    fused.setSpecies(Species.NecrozmaDuskMane);
    alone.setSpecies(Species.Necrozma);
    for (const unit of [fused, alone]) {
      unit.addItem(Items.UltranecroziumZ);
      unit.enter();
    }

    expect(fused.species).toBe(Species.NecrozmaUltra);
    expect(fused.hasAbility(Abilities.Neuroforce)).toBe(true);
    expect(alone.species).toBe(Species.Necrozma);
  });
});

describe('the light trio in the world', () => {
  it('keeps the line out of the ordinary bands', () => {
    expect(getSpawnRarity(Species.Cosmog)).toBe(SpawnRarity.Prized);
    expect(getSpawnRarity(Species.Cosmoem)).toBe(SpawnRarity.Prized);
    for (const species of [Species.Solgaleo, Species.Lunala, Species.Necrozma]) {
      expect(getSpawnRarity(species)).toBe(SpawnRarity.Special);
    }
  });
});
