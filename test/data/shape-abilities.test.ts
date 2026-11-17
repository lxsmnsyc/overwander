import { beforeAll, describe, expect, it } from 'vitest';
import registerGameData from '../../src/data';
import Abilities from '../../src/data/ids/abilities';
import { Items } from '../../src/data/ids/items';
import { Species } from '../../src/data/ids/species';
import { getWornAbilities } from '../../src/data/species/shape-abilities';

beforeAll(() => {
  registerGameData();
});

function wornOf(species: Species, items: Items[] = [], carried: Abilities[] = []): Abilities[] {
  return getWornAbilities(species, items, carried).map((entry) => entry.ability);
}

describe('getWornAbilities', () => {
  it('gives every Ogerpon mask its own ability', () => {
    expect(wornOf(Species.Ogerpon)).toEqual([Abilities.Defiant]);
    expect(wornOf(Species.OgerponWellspring)).toEqual([Abilities.WaterAbsorb]);
    expect(wornOf(Species.OgerponHearthflame)).toEqual([Abilities.MoldBreaker]);
    expect(wornOf(Species.OgerponCornerstone)).toEqual([Abilities.Sturdy]);
  });

  it('leaves out the shapes taken only mid-fight', () => {
    expect(wornOf(Species.OgerponTealTera)).toEqual([]);
    expect(wornOf(Species.TerapagosTerastal)).toEqual([]);
  });

  it('gives Giratina Levitate only while it holds the Griseous Orb', () => {
    expect(wornOf(Species.Giratina)).toEqual([]);
    expect(getWornAbilities(Species.Giratina, [Items.GriseousOrb])).toEqual([
      { ability: Abilities.Levitate, item: Items.GriseousOrb },
    ]);
  });

  it('reads a true shadow through its counterpart', () => {
    expect(wornOf(Species.KyogreShadow, [Items.BlueOrb])).toEqual([Abilities.PrimordialSea]);
    expect(wornOf(Species.KyogreShadow)).toEqual([]);
  });

  it("gives Landorus its Therian ability with the Reveal Glass, and no one else's", () => {
    expect(wornOf(Species.Landorus, [Items.RevealGlass])).toEqual([Abilities.Intimidate]);
    expect(wornOf(Species.Tornadus, [Items.RevealGlass])).toEqual([Abilities.Regenerator]);
  });

  it('gives a fused Necrozma Neuroforce with the Ultranecrozium Z', () => {
    expect(getWornAbilities(Species.NecrozmaDuskMane, [Items.UltranecroziumZ])).toEqual([
      { ability: Abilities.Neuroforce, item: Items.UltranecroziumZ },
    ]);
    expect(wornOf(Species.NecrozmaDawnWings, [Items.UltranecroziumZ])).toEqual([
      Abilities.Neuroforce,
    ]);
    expect(wornOf(Species.Necrozma, [Items.UltranecroziumZ])).toEqual([]);
    expect(wornOf(Species.NecrozmaDuskMane)).toEqual([]);
  });

  it('wears nothing for a plain catch', () => {
    expect(wornOf(Species.Charmander)).toEqual([]);
    expect(wornOf(Species.Charmander, [Items.Charcoal])).toEqual([]);
  });

  it('does not repeat an ability the catch already carries', () => {
    expect(wornOf(Species.Ogerpon, [], [Abilities.Defiant])).toEqual([]);
    expect(wornOf(Species.Giratina, [Items.GriseousOrb, Items.GriseousOrb])).toEqual([
      Abilities.Levitate,
    ]);
  });
});
