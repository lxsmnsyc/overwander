import { afterEach, describe, expect, it, vi } from 'vitest';
import { readAbilities } from '../../src/data/abilities/yaml';
import { readItems } from '../../src/data/items/yaml';
import { readMoves } from '../../src/data/moves/yaml';
import { readSpecies } from '../../src/data/species/yaml';
import { itemText, registerItemTemplates } from '../../src/data/items/__create';
import { deriveLocalized, extendRecord, localize, splitLocales } from '../../src/data/yaml';
import type { Locale } from '../../src/i18n/locale';

/**
 * Registry text by locale. English is the record and any other locale
 * is laid over it, entry by entry and field by field. The game has no
 * other locale yet, so the locale module is swapped for one that also
 * knows `xx`, and the active locale is whatever a case sets.
 */

// The stand-in locale, which the game's own Locale type does not know
// oxlint-disable-next-line typescript/no-unsafe-type-assertion
const XX = 'xx' as string as Locale;

const active = vi.hoisted(() => ({ locale: 'en' }));

vi.mock('../../src/i18n/locale', () => ({
  baseLocale: 'en',
  locales: ['en', 'xx'],
  isLocale: (value: unknown) => value === 'en' || value === 'xx',
  currentLocale: () => active.locale,
  getIntlTag: () => 'en-GB',
}));

afterEach(() => {
  active.locale = 'en';
});

const MOVE_TEXT = import.meta.glob('../../src/data/text/en/moves/**/*.yaml', {
  eager: true,
  import: 'default',
});

const MOVE_PATH = '../../src/data/text/xx/moves/gen-1/bulbasaur-to-blastoise.yaml';

function readMovesWith(text: Record<string, unknown>): ReturnType<typeof readMoves> {
  return readMoves({
    battle: import.meta.glob('../../src/data/moves/battle/**/*.yaml', {
      eager: true,
      import: 'default',
    }),
    cast: import.meta.glob('../../src/data/moves/cast/**/*.yaml', {
      eager: true,
      import: 'default',
    }),
    text: { ...MOVE_TEXT, ...text },
  });
}

function findMove(
  read: ReturnType<typeof readMoves>,
  name: string,
): { name: string; description: string } {
  for (const [, data] of read) {
    if (data.name === name) {
      return data;
    }
  }
  throw new Error(`No move named ${name}`);
}

describe('a locale laid over English', () => {
  it('overrides the one entry it writes, in that locale only', () => {
    const read = readMovesWith({ [MOVE_PATH]: { Tackle: { name: 'Plaquage' } } });
    const tackle = findMove(read, 'Tackle');

    active.locale = 'xx';
    expect(tackle.name).toBe('Plaquage');
    // A field the locale leaves out reads in English
    expect(tackle.description).toBe('Plain contact damage.');

    active.locale = 'en';
    expect(tackle.name).toBe('Tackle');
  });

  it('leaves every entry it does not write in English', () => {
    const read = readMovesWith({ [MOVE_PATH]: { Tackle: { name: 'Plaquage' } } });

    active.locale = 'xx';
    expect(findMove(read, 'Growl').name).toBe('Growl');
  });

  it('reaches the abilities, the items and the species the same way', () => {
    const abilities = readAbilities({
      ...import.meta.glob('../../src/data/text/en/abilities/**/*.yaml', {
        eager: true,
        import: 'default',
      }),
      '../../src/data/text/xx/abilities/gen-1.yaml': { Overgrow: { name: 'Engrais' } },
    });
    const items = readItems(
      {
        records: import.meta.glob('../../src/data/items/records/ability-items.yaml', {
          eager: true,
          import: 'default',
        }),
        text: {
          ...import.meta.glob('../../src/data/text/en/items/ability-items.yaml', {
            eager: true,
            import: 'default',
          }),
          '../../src/data/text/xx/items/ability-items.yaml': {
            AbilityPatch: { name: 'Patch Talent' },
          },
        },
      },
      ['ability-items'],
    );
    const species = readSpecies({
      world: import.meta.glob('../../src/data/species/world/**/*.yaml', {
        eager: true,
        import: 'default',
      }),
      stats: import.meta.glob('../../src/data/species/stats/**/*.yaml', {
        eager: true,
        import: 'default',
      }),
      abilities: import.meta.glob('../../src/data/species/abilities/**/*.yaml', {
        eager: true,
        import: 'default',
      }),
      learnsets: import.meta.glob('../../src/data/species/learnsets/**/*.yaml', {
        eager: true,
        import: 'default',
      }),
      text: {
        ...import.meta.glob('../../src/data/text/en/species/**/*.yaml', {
          eager: true,
          import: 'default',
        }),
        '../../src/data/text/xx/species/kanto/001-025.yaml': {
          Bulbasaur: { Bulbasaur: { name: 'Bulbizarre' } },
        },
      },
    });

    active.locale = 'xx';
    expect(abilities.find(([, data]) => data.name === 'Engrais')).toBeDefined();
    expect(items.items.find(({ data }) => data.name === 'Patch Talent')).toBeDefined();
    expect(species.find(([, data]) => data.name === 'Bulbizarre')?.[1].category).toBe(
      'Seed Pokemon',
    );
  });
});

describe('a record copied off another', () => {
  it('keeps reading in the active locale, apart from what the copy changes', () => {
    const base = { name: 'Venusaur', category: 'Seed Pokemon' };

    localize(
      base,
      'Venusaur',
      new Map([[XX, new Map([['Venusaur', { name: 'Florizarre', category: 'Graine' }]])]]),
      ['name', 'category'],
    );

    const mega = extendRecord(base, { name: 'Mega Venusaur' });

    active.locale = 'xx';
    expect(mega.category).toBe('Graine');
    expect(mega.name).toBe('Mega Venusaur');
    active.locale = 'en';
    expect(mega.category).toBe('Seed Pokemon');
  });
});

describe('an item family laid over English', () => {
  it('fills in the template of the active locale, or the English one where it has none', () => {
    const items = readItems(
      {
        records: import.meta.glob('../../src/data/items/records/ability-items.yaml', {
          eager: true,
          import: 'default',
        }),
        text: {
          ...import.meta.glob('../../src/data/text/en/items/ability-items.yaml', {
            eager: true,
            import: 'default',
          }),
          '../../src/data/text/xx/items/ability-items.yaml': {
            templates: { capsule: 'Tire une capacité, {slots} au plus.' },
          },
        },
      },
      ['ability-items'],
    );
    const family = items.text.get('ability-items');

    if (family == null) {
      throw new Error('No ability-items text');
    }
    registerItemTemplates('ability-items', family.templates, family.translatedTemplates);

    active.locale = 'xx';
    expect(itemText('ability-items', 'capsule', { slots: 2 })).toBe(
      'Tire une capacité, 2 au plus.',
    );
    active.locale = 'en';
    expect(itemText('ability-items', 'capsule', { slots: 2 })).toMatch(/^Draws another ability/);
  });

  it('writes a derived line once per locale, in that locale', () => {
    const record = { description: '' };
    let written = 0;

    deriveLocalized(record, 'description', () => {
      written++;
      return `Line in ${active.locale}.`;
    });

    expect(record.description).toBe('Line in en.');
    expect(record.description).toBe('Line in en.');
    active.locale = 'xx';
    expect(record.description).toBe('Line in xx.');
    expect(written).toBe(2);
  });
});

describe('a locale that writes what English lacks', () => {
  it('fails on an entry English does not have', () => {
    expect(() => readMovesWith({ [MOVE_PATH]: { Tackel: { name: 'Plaquage' } } })).toThrow(
      'Tackel is not in English',
    );
  });

  it('fails on a field English does not write', () => {
    expect(() => readMovesWith({ [MOVE_PATH]: { Tackle: { flavour: 'Un coup.' } } })).toThrow(
      'flavour is not in English',
    );
  });

  it('fails on a file with no English counterpart', () => {
    expect(() => readMovesWith({ '../../src/data/text/xx/moves/gen-1/nowhere.yaml': {} })).toThrow(
      'has no English file',
    );
  });

  it('fails on a value where English writes a map', () => {
    expect(() => readMovesWith({ [MOVE_PATH]: { Tackle: 'Plaquage' } })).toThrow(
      'does not have the shape English gives it',
    );
  });

  it('fails on a folder that is not a locale', () => {
    expect(() => splitLocales({ '../text/zz/moves/a.yaml': {} })).toThrow(
      'zz is not one of the game',
    );
  });
});
