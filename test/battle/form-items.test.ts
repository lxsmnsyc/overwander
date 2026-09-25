import { describe, expect, it } from 'vitest';
import { UNLIMITED_BATTLE_LIMITS } from '../../src/data/constants/battle-limits';
import { packSlots } from '../../src/data/constants/slots';
import { Stats } from '../../src/data/constants/stats';
import { Types } from '../../src/data/constants/types';
import Abilities from '../../src/data/ids/abilities';
import { Items } from '../../src/data/ids/items';
import { Species } from '../../src/data/ids/species';
import { createBattle, createUnit } from './harness';

describe('Form items', () => {
  it('puts a Giratina holding the Griseous Orb in Origin Forme, Levitate on top', () => {
    const { battle, teamA } = createBattle();
    const dragon = createUnit(battle, teamA);
    dragon.setSpecies(Species.Giratina);
    dragon.addAbility(Abilities.Pressure);
    dragon.addItem(Items.GriseousOrb);

    dragon.enter();

    expect(dragon.species).toBe(Species.GiratinaOrigin);
    expect(dragon.stats[0][Stats.Attack]).toBe(120);
    expect([...dragon.types]).toEqual([Types.Ghost, Types.Dragon]);
    expect(dragon.hasAbility(Abilities.Levitate)).toBe(true);
    expect(dragon.hasAbility(Abilities.Pressure)).toBe(true);
  });

  it('gives Origin Dialga Unaware and Origin Palkia Shadow Tag', () => {
    const { battle, teamA } = createBattle();
    const time = createUnit(battle, teamA);
    const space = createUnit(battle, teamA);
    time.setSpecies(Species.Dialga);
    time.addItem(Items.AdamantOrb);
    space.setSpecies(Species.Palkia);
    space.addItem(Items.LustrousOrb);

    time.enter();
    space.enter();

    expect(time.species).toBe(Species.DialgaOrigin);
    expect(time.hasAbility(Abilities.Unaware)).toBe(true);
    expect(space.species).toBe(Species.PalkiaOrigin);
    expect(space.hasAbility(Abilities.ShadowTag)).toBe(true);
  });

  it('gives Sky Shaymin Serene Grace without spending a slot on it', () => {
    const { battle, teamA } = createBattle();
    const flower = createUnit(battle, teamA);
    flower.setSpecies(Species.Shaymin);
    flower.addAbility(Abilities.NaturalCure);
    flower.addItem(Items.Gracidea);

    flower.enter();

    expect(flower.species).toBe(Species.ShayminSky);
    expect(flower.hasAbility(Abilities.SereneGrace)).toBe(true);
    expect(flower.hasAbility(Abilities.NaturalCure)).toBe(true);

    // The one slot is still Natural Cure's: freed, another fits in it
    flower.removeAbility(Abilities.NaturalCure);
    flower.addAbility(Abilities.Guts);

    expect(flower.hasAbility(Abilities.Guts)).toBe(true);
    expect(flower.hasAbility(Abilities.SereneGrace)).toBe(true);
  });
});

describe('Fused shapes', () => {
  it('lets the dragon inside a Black Kyurem fight with Teravolt', () => {
    const { battle, teamA } = createBattle();
    const fusion = createUnit(battle, teamA);

    fusion.setSpecies(Species.KyuremBlack);
    fusion.addAbility(Abilities.Pressure);
    fusion.enter();

    expect(fusion.hasAbility(Abilities.Teravolt)).toBe(true);
    // What the Kyurem itself rolled is still its own
    expect(fusion.hasAbility(Abilities.Pressure)).toBe(true);
  });

  it('gives White Kyurem Turboblaze, and a plain Kyurem neither', () => {
    const { battle, teamA } = createBattle();
    const fusion = createUnit(battle, teamA);
    const husk = createUnit(battle, teamA);

    fusion.setSpecies(Species.KyuremWhite);
    husk.setSpecies(Species.Kyurem);
    fusion.enter();
    husk.enter();

    expect(fusion.hasAbility(Abilities.Turboblaze)).toBe(true);
    expect(husk.hasAbility(Abilities.Turboblaze)).toBe(false);
    expect(husk.hasAbility(Abilities.Teravolt)).toBe(false);
  });

  it('hands the folded dragon creed only to a holder keeping its own', () => {
    const { battle, teamA } = createBattle();
    const granted = createUnit(battle, teamA);
    const plain = createUnit(battle, teamA);

    granted.setSpecies(Species.KyuremBlack);
    granted.addAbility(Abilities.HollowCreed);
    plain.setSpecies(Species.KyuremBlack);
    granted.enter();
    plain.enter();

    expect(granted.hasAbility(Abilities.IdealCreed)).toBe(true);
    expect(plain.hasAbility(Abilities.IdealCreed)).toBe(false);
  });
});

describe('Worn abilities and slots', () => {
  it('rides free of a Kyurem that has filled all four of its slots', () => {
    const { battle, teamA } = createBattle('test-seed', undefined, UNLIMITED_BATTLE_LIMITS);
    const fusion = createUnit(battle, teamA);

    fusion.setSpecies(Species.KyuremBlack);
    fusion.setSlots(packSlots(4, 1, 4));
    for (const ability of [
      Abilities.Pressure,
      Abilities.SnowWarning,
      Abilities.IceBody,
      Abilities.Intimidate,
    ]) {
      fusion.addAbility(ability);
    }
    fusion.enter();

    // The four it rolled, and the dragon's on top of them: a worn
    // ability is the shape's rather than the pokemon's
    for (const ability of [
      Abilities.Pressure,
      Abilities.SnowWarning,
      Abilities.IceBody,
      Abilities.Intimidate,
      Abilities.Teravolt,
    ]) {
      expect(fusion.hasAbility(ability)).toBe(true);
    }
    expect(fusion.worn[Abilities.Teravolt]).toBe(true);
  });
});
