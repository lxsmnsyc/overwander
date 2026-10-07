import { beforeAll, describe, expect, it } from 'vitest';
import registerGameData from '../../src/data';
import { Stages } from '../../src/data/constants/stats';
import { Items } from '../../src/data/ids/items';
import { Species } from '../../src/data/ids/species';
import {
  getTotemAlly,
  getTotemAura,
  getTotemCrystal,
  getTotemSize,
  getTotemsOf,
  isTotemSpecies,
} from '../../src/data/overworld/totems';
import { getSpeciesData } from '../../src/data/species';

describe('Totems', () => {
  beforeAll(() => {
    registerGameData();
  });

  it('wraps the trial Totems in the auras the games gave them', () => {
    expect(getTotemAura(Species.Lurantis)).toEqual({ [Stages.Speed]: 2 });
    expect(getTotemAura(Species.Togedemaru)).toEqual({ [Stages.Defense]: 2 });
    expect(getTotemAura(Species.Salazzle)).toEqual({ [Stages.SpecialDefense]: 1 });
    expect(getTotemAura(Species.KommoO)[Stages.Speed]).toBe(1);
    expect(getTotemAura(Species.Ribombee)[Stages.Attack]).toBe(2);
    // The school is the trial's Totem as much as the fish is
    expect(getTotemAura(Species.WishiwashiSchool)).toEqual(getTotemAura(Species.Wishiwashi));
  });

  it('gives any other Totem an aura out of its own highest stats', () => {
    // Grown into: its two highest stats by 1. Arcanine's are Attack and Special Attack
    expect(getTotemAura(Species.Arcanine)).toEqual({
      [Stages.Attack]: 1,
      [Stages.SpecialAttack]: 1,
    });
    // One stage long: its highest by 2. Tauros' is Speed
    expect(getTotemAura(Species.Tauros)).toEqual({ [Stages.Speed]: 2 });
  });

  it('stands only final stages that hold no lair of their own', () => {
    expect(isTotemSpecies(Species.Arcanine)).toBe(true);
    expect(isTotemSpecies(Species.Growlithe)).toBe(false);
    expect(isTotemSpecies(Species.Articuno)).toBe(false);
    expect(isTotemSpecies(Species.Mew)).toBe(false);
    expect(isTotemSpecies(Species.Nihilego)).toBe(false);
  });

  it('calls the first stage of its own line, or another of itself', () => {
    expect(getTotemAlly(Species.Salazzle)).toBe(Species.Salandit);
    expect(getTotemAlly(Species.KommoO)).toBe(Species.JangmoO);
    expect(getTotemAlly(Species.Mimikyu)).toBe(Species.Mimikyu);
  });

  it('leaves the trial crystal, or the crystal of its first type', () => {
    expect(getTotemCrystal(Species.Mimikyu)).toBe(Items.GhostiumZ);
    expect(getTotemCrystal(Species.Gumshoos)).toBe(Items.NormaliumZ);
    expect(getTotemCrystal(Species.Arcanine)).toBe(Items.FiriumZ);
  });

  it('stands at the trial size, or twice as tall as its species', () => {
    expect(getTotemSize(Species.KommoO)).toEqual({ height: 2.4, weight: 207.5 });
    expect(getTotemSize(Species.Arcanine).height).toBe(getSpeciesData(Species.Arcanine).height * 2);
  });

  it('offers every branch a line grows into', () => {
    const eevee = getTotemsOf(Species.Eevee);

    expect(eevee).toContain(Species.Vaporeon);
    expect(eevee).toContain(Species.Sylveon);
    expect(getTotemsOf(Species.Growlithe)).toEqual([Species.Arcanine]);
    // A legendary grows into nothing a lair would call a Totem
    expect(getTotemsOf(Species.Articuno)).toEqual([]);
  });

  it('never raises HP, however high it is', () => {
    // Snorlax's HP is its highest stat; Attack and Special Defense come next
    expect(getTotemAura(Species.Snorlax)).toEqual({
      [Stages.Attack]: 1,
      [Stages.SpecialDefense]: 1,
    });
  });
});
