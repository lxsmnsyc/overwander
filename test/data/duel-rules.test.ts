import { beforeAll, describe, expect, it } from 'vitest';
import registerGameData from '../../src/data';
import { DUEL_BANS, DuelBan } from '../../src/data/constants/duel-bans';
import { baseStatTotal, duelRefusal } from '../../src/data/constants/duel-rules';
import { Items } from '../../src/data/ids/items';
import { Species } from '../../src/data/ids/species';

describe('what a duel host may bar', () => {
  beforeAll(() => {
    registerGameData();
  });

  const open = { maxBst: 0, bans: 0 };

  it('lets everything through when nothing is barred', () => {
    expect(duelRefusal({ species: Species.Mewtwo, items: [] }, open)).toBeNull();
    expect(duelRefusal({ species: Species.Arceus, items: [Items.FlamePlate] }, open)).toBeNull();
  });

  it('bars legendaries and mythicals apart', () => {
    const legendaries = { maxBst: 0, bans: DuelBan.Legendary };
    const mythicals = { maxBst: 0, bans: DuelBan.Mythical };

    expect(duelRefusal({ species: Species.Mewtwo, items: [] }, legendaries)).toBe('legendary');
    expect(duelRefusal({ species: Species.Mew, items: [] }, legendaries)).toBeNull();
    expect(duelRefusal({ species: Species.Mew, items: [] }, mythicals)).toBe('mythical');
    expect(duelRefusal({ species: Species.Mewtwo, items: [] }, mythicals)).toBeNull();
  });

  it('counts a true shadow as the legendary it is, and Volcarona as no legendary', () => {
    const legendaries = { maxBst: 0, bans: DuelBan.Legendary };

    expect(duelRefusal({ species: Species.ArticunoShadow, items: [] }, legendaries)).toBe(
      'legendary',
    );
    expect(duelRefusal({ species: Species.Volcarona, items: [] }, legendaries)).toBeNull();
  });

  it('bars a pokemon holding an item that changes its form, and nothing else holding it', () => {
    const forms = { maxBst: 0, bans: DuelBan.ItemForms };

    expect(duelRefusal({ species: Species.Arceus, items: [Items.FlamePlate] }, forms)).toBe(
      'holds a form item',
    );
    // A Plate is only a type booster on anything but an Arceus
    expect(
      duelRefusal({ species: Species.Charizard, items: [Items.FlamePlate] }, forms),
    ).toBeNull();
  });

  it('caps the stat total at the shape a held item puts it into', () => {
    expect(
      duelRefusal({ species: Species.Pikachu, items: [] }, { maxBst: 400, bans: 0 }),
    ).toBeNull();
    expect(duelRefusal({ species: Species.Dragonite, items: [] }, { maxBst: 540, bans: 0 })).toBe(
      `stat total ${baseStatTotal(Species.Dragonite)}`,
    );
    // Kyogre fits a cap its Primal form does not
    const cap = baseStatTotal(Species.Kyogre);

    expect(
      duelRefusal({ species: Species.Kyogre, items: [] }, { maxBst: cap, bans: 0 }),
    ).toBeNull();
    expect(
      duelRefusal({ species: Species.Kyogre, items: [Items.BlueOrb] }, { maxBst: cap, bans: 0 }),
    ).toBe(`stat total ${baseStatTotal(Species.KyogrePrimal)}`);
  });

  it('packs every ban into the range the lobby stores', () => {
    expect(DUEL_BANS).toBe(7);
  });
});
