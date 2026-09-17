import { describe, expect, it } from 'vitest';
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
