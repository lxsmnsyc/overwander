import { describe, expect, it } from 'vitest';
import { Species } from '../src/data/ids/species';
import {
  DEX_CAUGHT,
  DEX_SEEN,
  countDexSpecies,
  getDexCount,
  getDexTally,
  hasCaughtShiny,
  hasCaughtSpecies,
  hasSeenSpecies,
  listDexTallies,
  pokedexId,
} from '../src/auth/pokedex-record';

/**
 * What a stored dex means, asked of the readers rather than of a
 * store. The document is four maps of counts — see
 * [`pokedex-record.ts`](../src/auth/pokedex-record.ts) — and every
 * question a screen asks of a dex is answered from them, so what these
 * cover is the arithmetic and the shapes a Firestore document can
 * arrive in
 */
const DEX = {
  seen: { [Species.Pidgey]: 12, [Species.Gyarados]: 2 },
  seenShiny: { [Species.Gyarados]: 1 },
  caught: { [Species.Pidgey]: 3 },
  caughtShiny: { [Species.Gyarados]: 1 },
};

describe('pokedex record', () => {
  it('lives at one document per player', () => {
    expect(pokedexId('red')).toBe('red');
  });

  it('counts the ordinary and the sparkling apart, and both together', () => {
    // A shiny is counted only in the shiny map: the two are separate
    // tallies and the total is their sum
    expect(getDexCount(DEX, DEX_SEEN, Species.Gyarados)).toBe(2);
    expect(getDexCount(DEX, DEX_SEEN, Species.Gyarados, true)).toBe(1);
    expect(getDexTally(DEX, DEX_SEEN, Species.Gyarados)).toEqual({
      species: Species.Gyarados,
      regular: 2,
      shiny: 1,
      total: 3,
    });
  });

  it('answers zero for a species nobody has met', () => {
    // A caller can ask about any species without checking first
    expect(getDexTally(DEX, DEX_SEEN, Species.Mewtwo)).toEqual({
      species: Species.Mewtwo,
      regular: 0,
      shiny: 0,
      total: 0,
    });
    expect(hasSeenSpecies(DEX, Species.Mewtwo)).toBe(false);
    expect(hasCaughtSpecies(DEX, Species.Mewtwo)).toBe(false);
  });

  it('lists a tally in species order whatever order it was filled in', () => {
    const seen = listDexTallies(DEX, DEX_SEEN);

    expect(seen.map((entry) => entry.species)).toEqual(
      seen.map((entry) => entry.species).sort((one, other) => one - other),
    );
    // A species that only ever sparkled is still in the list: both
    // maps are read, not just the ordinary one
    expect(new Set(listDexTallies(DEX, DEX_CAUGHT).map((entry) => entry.species))).toEqual(
      new Set([Species.Pidgey, Species.Gyarados]),
    );
    expect(countDexSpecies(DEX, DEX_SEEN)).toBe(2);
    expect(countDexSpecies(DEX, DEX_CAUGHT)).toBe(2);
  });

  it('counts owning one as having seen it', () => {
    // A gift arrives without a meeting, and a dex that called it
    // unseen would be saying the player has never laid eyes on
    // something standing in their party
    const gifted = { caught: { [Species.Mew]: 1 } };

    expect(hasSeenSpecies(gifted, Species.Mew)).toBe(true);
    expect(hasCaughtSpecies(gifted, Species.Mew)).toBe(true);
    expect(getDexTally(gifted, DEX_SEEN, Species.Mew).total).toBe(0);
  });

  it('knows which ones sparkled', () => {
    // The one question a dex is really kept for: a Gyarados was caught
    // shiny, a Pidgey never was
    expect(hasCaughtShiny(DEX, Species.Gyarados)).toBe(true);
    expect(hasCaughtShiny(DEX, Species.Pidgey)).toBe(false);
  });

  it('reads a dex that was never written as an empty one', () => {
    // Firestore hands back whatever is there, which for a player who
    // has met nobody is nothing at all
    for (const stored of [undefined, null, {}, { seen: null }, { seen: 'many' }]) {
      expect(countDexSpecies(stored, DEX_SEEN)).toBe(0);
      expect(listDexTallies(stored, DEX_CAUGHT)).toEqual([]);
      expect(hasSeenSpecies(stored, Species.Pidgey)).toBe(false);
    }
  });

  it('counts a pokemon once however many of its shapes were met', () => {
    // A row is kept per form, since which letters somebody has found
    // is worth knowing; a dex is counted in pokemon, and the printed
    // dex has one Unown in it
    const dex = {
      seen: { [Species.Unown]: 1, [Species.UnownB]: 4, [Species.UnownQ]: 2, [Species.Pidgey]: 1 },
      seenShiny: { [Species.UnownZ]: 1 },
      caught: { [Species.UnownB]: 1 },
      caughtShiny: {},
    };

    expect(listDexTallies(dex, DEX_SEEN).length).toBe(5);
    expect(countDexSpecies(dex, DEX_SEEN)).toBe(2);

    // An unown nobody has is still an Unown caught, since the entry
    // the dex prints is the one being filled in
    expect(countDexSpecies(dex, DEX_CAUGHT)).toBe(1);
  });

  it('ignores anything in the maps that is not a count', () => {
    // A key written as a string, a zero left behind, a negative: none
    // of them is a pokemon met, and none is read as one
    const odd = { seen: { [Species.Pidgey]: 0, [Species.Rattata]: -1, [Species.Eevee]: 'lots' } };

    expect(listDexTallies(odd, DEX_SEEN)).toEqual([]);
    expect(getDexCount(odd, DEX_SEEN, Species.Rattata)).toBe(0);
  });
});
