import { afterEach, describe, expect, it, vi } from 'vitest';
import type * as LocaleModule from '../../src/i18n/locale';
import registerGameData from '../../src/data/index';
import { getItemData } from '../../src/data/items';
import { ITEM_IDS } from '../../src/data/ids/names';

/**
 * Every registry entry has a description in Japanese and Spanish, whether
 * it is written out in the entry's YAML or built from a family's templates.
 * Each is a real translation: it differs from the English line and ends
 * with the locale's full stop.
 *
 * A registry joins by adding to `REGISTRIES`: the entries it holds and how
 * to read one's description in the active locale.
 */

const active = vi.hoisted(() => ({ locale: 'en' }));

vi.mock('../../src/i18n/locale', async (original) => ({
  ...(await original<typeof LocaleModule>()),
  currentLocale: () => active.locale,
}));

registerGameData();

afterEach(() => {
  active.locale = 'en';
});

interface Registry {
  name: string;
  /** The key and the description of every entry, in the active locale */
  describe(): Map<string, string>;
}

const REGISTRIES: Registry[] = [
  {
    name: 'items',
    describe() {
      const found = new Map<string, string>();

      for (const [name, id] of Object.entries(ITEM_IDS)) {
        // An id with no data is one the game has not stocked
        try {
          found.set(name, getItemData(id).description);
        } catch {
          continue;
        }
      }
      return found;
    },
  },
];

const STOPS = { ja: '。', es: '.' } as const;

describe('descriptions by locale', () => {
  for (const registry of REGISTRIES) {
    for (const locale of ['ja', 'es'] as const) {
      it(`give every ${registry.name} entry a ${locale} description that is not English`, () => {
        active.locale = 'en';
        const english = registry.describe();

        active.locale = locale;
        const written = registry.describe();

        const same: string[] = [];
        const unfinished: string[] = [];

        for (const [name, line] of written) {
          if (line === english.get(name)) {
            same.push(name);
          }
          if (!line.endsWith(STOPS[locale])) {
            unfinished.push(name);
          }
        }
        expect(english.size).toBeGreaterThan(500);
        expect(same).toEqual([]);
        expect(unfinished).toEqual([]);
      });
    }
  }
});
