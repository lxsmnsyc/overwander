import { describe, expect, it } from 'vitest';
import matches from '../src/core/search';

describe('search matching', () => {
  it('matches everything while nothing has been typed', () => {
    // Clearing the box is the way back to the whole list, so an empty
    // search — or one of nothing but spaces — hides nothing
    expect(matches('Poke Ball', '')).toBe(true);
    expect(matches('Poke Ball', '   ')).toBe(true);
  });

  it('ignores case, so a player need not match the game’s capitals', () => {
    expect(matches('Ultra Ball', 'ultra')).toBe(true);
    expect(matches('ultra ball', 'ULTRA')).toBe(true);
  });

  it('matches part of a word, since a player types what they remember', () => {
    expect(matches('Bulbasaur · Lv. 12', 'bulb')).toBe(true);
    expect(matches('Bulbasaur · Lv. 12', 'saur')).toBe(true);
  });

  it('wants every word, in any order', () => {
    const row = '✦ Charizard · Lv. 36 · 40/120 HP';

    // The row is written one way round and searched the other; both
    // words are in it, which is what the search is asking
    expect(matches(row, 'charizard 36')).toBe(true);
    expect(matches(row, '36 charizard')).toBe(true);
    expect(matches(row, 'charizard poisoned')).toBe(false);
  });

  it('searches what the row shows, marks included', () => {
    expect(matches('✦ Gyarados · Lv. 40', '✦')).toBe(true);
    expect(matches('Gyarados · Lv. 40', '✦')).toBe(false);
  });
});
