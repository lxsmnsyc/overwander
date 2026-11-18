import { describe, expect, it, vi } from 'vitest';
import { ItemTypes, Items } from '../../src/data/ids/items';
import { Moves } from '../../src/data/ids/moves';
import ensureBattleData, { isBattleDataReady } from '../../src/data/battle-data';
import { readActiveText } from '../../src/data/locale-text';
import { getMoveData, getRegisteredMoves } from '../../src/data/moves';
import { getAbilityData, getRegisteredAbilities } from '../../src/data/abilities';
import { getItemData, listItemsByType } from '../../src/data/items';
import registerGameData from '../../src/data';
import registerWorldData from '../../src/data/world';

/**
 * Moves, abilities and items are loaded when something asks, with the
 * words of the page's locale and English, and no other. The page is
 * Japanese here, which no other test file needs.
 */

const active = vi.hoisted(() => ({ locale: 'ja' }));

vi.mock('../../src/i18n/locale', () => ({
  baseLocale: 'en',
  locales: ['en', 'ja', 'es'],
  isLocale: (value: unknown) => ['en', 'ja', 'es'].includes(String(value)),
  currentLocale: () => active.locale,
  getIntlTag: () => 'en-GB',
}));

// What the app registers at boot, and all it registers before the first frame
registerWorldData();

describe('moves, abilities and items on demand', () => {
  it('leaves the three registries empty after the world is registered', () => {
    expect(isBattleDataReady()).toBe(false);
    expect(getRegisteredMoves()).toHaveLength(0);
    expect(getRegisteredAbilities()).toHaveLength(0);
    expect(listItemsByType(ItemTypes.Medicine)).toHaveLength(0);
    expect(() => getMoveData(Moves.Tackle)).toThrow();
  });

  it('fills them when asked, in the page locale, with English under it', async () => {
    await ensureBattleData();

    expect(isBattleDataReady()).toBe(true);
    expect(getRegisteredMoves().length).toBeGreaterThan(500);
    expect(getRegisteredAbilities().length).toBeGreaterThan(100);
    expect(listItemsByType(ItemTypes.Medicine).length).toBeGreaterThan(0);
    // Written in the ja file
    expect(getMoveData(Moves.Tackle).name).toBe('たいあたり');
    // Written in English alone, so it reads in English
    expect(getMoveData(Moves.Tackle).description).not.toBe('');
    expect(getItemData(Items.Potion).name).not.toBe('');
    expect(getAbilityData(getRegisteredAbilities()[0]).name).not.toBe('');
  });

  it('asks the same call again for the same load', async () => {
    const before = getRegisteredMoves().length;

    await ensureBattleData();
    expect(getRegisteredMoves()).toHaveLength(before);
  });
});

describe('the text a page fetches', () => {
  const files = (loaded: string[]): Record<string, () => Promise<unknown>> => {
    const make = (path: string) => async (): Promise<unknown> => {
      loaded.push(path);
      await Promise.resolve();

      return { path };
    };

    return {
      '../text/ja/moves/a.yaml': make('ja a'),
      '../text/ja/moves/b.yaml': make('ja b'),
      '../text/es/moves/a.yaml': make('es a'),
    };
  };

  it('fetches the active locale and leaves the others', async () => {
    const loaded: string[] = [];
    const read = await readActiveText(files(loaded), 'ja');

    expect(loaded.toSorted()).toEqual(['ja a', 'ja b']);
    expect(Object.keys(read).toSorted()).toEqual([
      '../text/ja/moves/a.yaml',
      '../text/ja/moves/b.yaml',
    ]);
  });

  it('fetches nothing in English, which is bundled with the registry', async () => {
    const loaded: string[] = [];
    const read = await readActiveText(files(loaded), 'en');

    expect(loaded).toEqual([]);
    expect(read).toEqual({});
  });
});

describe('where everything is registered already', () => {
  it('keeps every locale when the load is asked for', async () => {
    registerGameData();
    const before = getMoveData(Moves.Tackle);

    expect(isBattleDataReady()).toBe(true);
    await ensureBattleData();
    expect(getMoveData(Moves.Tackle)).toBe(before);

    // The server answers each request in its own locale
    active.locale = 'es';
    expect(getMoveData(Moves.Tackle).name).not.toBe('たいあたり');
    active.locale = 'ja';
    expect(getMoveData(Moves.Tackle).name).toBe('たいあたり');
    active.locale = 'en';
    expect(getMoveData(Moves.Tackle).name).toBe('Tackle');
  });
});
