import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'yaml';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type * as LocaleModule from '../../src/i18n/locale';
import registerGameData from '../../src/data/index';
import { getItemData } from '../../src/data/items';
import { getMoveData } from '../../src/data/moves';
import { ITEM_IDS, MOVE_IDS } from '../../src/data/ids/names';

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

const MOVE_TEXT = join(import.meta.dirname, '../../src/data/text/en/moves');

/** The name of every move written in the English move text, in every generation folder and the weather file */
function listFiledMoves(): string[] {
  const names: string[] = [];

  for (const entry of readdirSync(MOVE_TEXT, { recursive: true, encoding: 'utf8' })) {
    if (!entry.endsWith('.yaml')) {
      continue;
    }

    const text: unknown = parse(readFileSync(join(MOVE_TEXT, entry), 'utf8'));

    if (typeof text === 'object' && text !== null) {
      names.push(...Object.keys(text));
    }
  }
  return names;
}

interface Registry {
  name: string;
  /** The key and the description of every entry, in the active locale */
  describe(): Map<string, string>;
  /** How many entries it holds at least, so an empty read cannot pass */
  minimum: number;
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
    minimum: 500,
  },
  {
    name: 'moves',
    describe() {
      const found = new Map<string, string>();

      const ids = new Map<string, number>(Object.entries(MOVE_IDS));

      for (const name of listFiledMoves()) {
        const id = ids.get(name);

        if (id === undefined) {
          throw new Error(`${name} is filed under a generation but has no move id`);
        }
        found.set(name, getMoveData(id).description);
      }
      return found;
    },
    minimum: 900,
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
        expect(english.size).toBeGreaterThan(registry.minimum);
        expect(same).toEqual([]);
        expect(unfinished).toEqual([]);
      });
    }
  }
});
