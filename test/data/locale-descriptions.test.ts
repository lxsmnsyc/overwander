import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'yaml';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type * as LocaleModule from '../../src/i18n/locale';
import registerGameData from '../../src/data/index';
import { getItemData } from '../../src/data/items';
import { getMoveData } from '../../src/data/moves';
import { getAbilityData } from '../../src/data/abilities/__create';
import { ABILITY_IDS, ITEM_IDS, MOVE_IDS } from '../../src/data/ids/names';

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
const ABILITY_TEXT = join(import.meta.dirname, '../../src/data/text/en/abilities');

/**
 * The regions whose signature abilities are translated, names and
 * descriptions both. A batch that translates more regions adds them here
 */
const SIGNATURE_REGIONS = ['kanto', 'johto', 'hoenn', 'sinnoh'];

/**
 * The key of every entry written in the English text under a folder,
 * in every file at the top of it or below it. `skip` leaves out a
 * subfolder whose descriptions another batch translates
 */
function listFiled(folder: string, skip?: string): string[] {
  const names: string[] = [];

  for (const entry of readdirSync(folder, { recursive: true, encoding: 'utf8' })) {
    if (!entry.endsWith('.yaml') || (skip !== undefined && entry.startsWith(skip))) {
      continue;
    }

    const text: unknown = parse(readFileSync(join(folder, entry), 'utf8'));

    if (typeof text === 'object' && text !== null) {
      names.push(...Object.keys(text));
    }
  }
  return names;
}

/** The signature abilities of the translated regions, one field of each in the active locale */
function describeSignatures(
  read: (data: { name: string; description: string }) => string,
): Map<string, string> {
  const found = new Map<string, string>();

  const ids = new Map<string, number>(Object.entries(ABILITY_IDS));

  for (const region of SIGNATURE_REGIONS) {
    const text: unknown = parse(
      readFileSync(join(ABILITY_TEXT, 'signature', `${region}.yaml`), 'utf8'),
    );

    if (typeof text !== 'object' || text === null) {
      throw new Error(`${region} has no signature abilities written`);
    }
    for (const name of Object.keys(text)) {
      const id = ids.get(name);

      if (id === undefined) {
        throw new Error(`${name} is filed under ${region} but has no ability id`);
      }
      found.set(name, read(getAbilityData(id)));
    }
  }
  return found;
}

interface Registry {
  name: string;
  /** The key and the description of every entry, in the active locale */
  describe(): Map<string, string>;
  /** The key and the name of every entry, in the active locale, where the names are translated too */
  named?(): Map<string, string>;
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

      for (const name of listFiled(MOVE_TEXT)) {
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
  {
    // The signature folder is translated with its own batches
    name: 'abilities (all but the signatures)',
    describe() {
      const found = new Map<string, string>();

      const ids = new Map<string, number>(Object.entries(ABILITY_IDS));

      for (const name of listFiled(ABILITY_TEXT, 'signature')) {
        const id = ids.get(name);

        if (id === undefined) {
          throw new Error(`${name} is filed under an ability folder but has no ability id`);
        }
        found.set(name, getAbilityData(id).description);
      }
      return found;
    },
    minimum: 300,
  },
  {
    // The names are this engine's own, so each is coined per locale
    name: 'signature abilities (Kanto to Sinnoh)',
    describe() {
      return describeSignatures((data) => data.description);
    },
    named() {
      return describeSignatures((data) => data.name);
    },
    minimum: 250,
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

      if (registry.named === undefined) {
        continue;
      }

      const named = registry.named.bind(registry);

      it(`give every ${registry.name} entry a ${locale} name that is not English`, () => {
        active.locale = 'en';
        const english = named();

        active.locale = locale;
        const written = named();

        const same: string[] = [];

        for (const [name, line] of written) {
          if (line === english.get(name)) {
            same.push(name);
          }
        }
        expect(english.size).toBeGreaterThan(registry.minimum);
        expect(same).toEqual([]);
      });
    }
  }
});
