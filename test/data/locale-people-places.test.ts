import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'yaml';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type * as LocaleModule from '../../src/i18n/locale';
import registerGameData from '../../src/data/index';
import Biome from '../../src/data/ids/biome';
import type { SettledBiome } from '../../src/data/ids/biome';
import { FAMILY_NAMES } from '../../src/data/ids/text';
import { FAMILY_IDS } from '../../src/data/ids/names';
import { getMegaBase, getSpeciesData, listMegas } from '../../src/data/species';
import nameTown, {
  COUNTY_NAMES,
  TOWN_JOINERS,
  checkTownWords,
} from '../../src/data/overworld/town-names';
import { localeFieldTable, localeFile, localeLines, localePhrases } from '../../src/data/yaml';
import * as v from 'valibot';

/**
 * The people and places text is read in the player's locale. A locale
 * file may only write what English writes: the same keys, a list as
 * long as English's, and no message parameter English lacks.
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

const TEXT = join(import.meta.dirname, '../../src/data/text');

/** Every file this batch reads, under `text/<locale>/` */
const FILES = [
  'npcs',
  'vendor-stalls',
  'decorations',
  'trainers/kanto',
  'trainers/johto',
  'trainers/hoenn',
  'trainers/sinnoh',
  'trainers/unova',
  'trainers/kalos',
  'trainer-sheets',
  'gym-leaders',
  'elite',
  'champions',
  'frontier',
  'frontier-rooms',
  'legends',
  'executives',
  'syndicates',
  'biomes',
  'weather',
  'times-of-day',
  'landmarks',
  'lairs',
  'phenomena',
  'spawn-rarities',
  'town-names',
  'quests',
  'awards',
  'achievements',
  'titles',
  'dex-rungs',
  'families',
  'megas',
  'regions',
  'title-forms',
  'dex-chain',
  'quest-rotations',
  'lair-titles',
  'syndicate-titles',
  'trainer-names',
  'mega-names',
  'egg-groups',
  'item-types',
];

function read(locale: string, file: string): unknown {
  return parse(readFileSync(join(TEXT, locale, `${file}.yaml`), 'utf8'));
}

/** The `{name}` parameters of a message */
function parameters(text: string): string[] {
  return [...text.matchAll(/\{(\w+)\}/g)].map((found) => found[1]);
}

/** What a locale file writes that English does not, one line a fault */
function faults(overlay: unknown, english: unknown, where: string): string[] {
  if (Array.isArray(overlay)) {
    if (!Array.isArray(english)) {
      return [`${where}: a list where English writes something else`];
    }
    if (overlay.length !== english.length) {
      return [`${where}: ${overlay.length} items, English has ${english.length}`];
    }
    return overlay.flatMap((item, at) => faults(item, english[at], `${where}[${at}]`));
  }
  if (typeof overlay === 'object' && overlay != null) {
    if (typeof english !== 'object' || english == null || Array.isArray(english)) {
      return [`${where}: a map where English writes something else`];
    }
    const found: string[] = [];

    for (const [key, value] of Object.entries(overlay)) {
      if (Object.hasOwn(english, key)) {
        found.push(...faults(value, Reflect.get(english, key), `${where}.${key}`));
      } else {
        found.push(`${where}: ${key} is not in English`);
      }
    }
    return found;
  }
  if (typeof overlay === 'string') {
    if (typeof english !== 'string') {
      return [`${where}: a line where English writes something else`];
    }
    const allowed = new Set(parameters(english));

    return parameters(overlay)
      .filter((name) => !allowed.has(name))
      .map((name) => `${where}: {${name}} is not a parameter of the English line`);
  }
  return overlay === english ? [] : [`${where}: not the kind of value English writes`];
}

describe('people and places text in ja and es', () => {
  it('has an English file for every file in the list', () => {
    for (const file of FILES) {
      expect(existsSync(join(TEXT, 'en', `${file}.yaml`)), file).toBe(true);
    }
  });

  it('writes no key, list length or parameter that English lacks', () => {
    const found: string[] = [];

    for (const locale of ['ja', 'es']) {
      for (const file of FILES) {
        if (existsSync(join(TEXT, locale, `${file}.yaml`))) {
          found.push(
            ...faults(read(locale, file), read('en', file), `text/${locale}/${file}.yaml`),
          );
        }
      }
    }
    expect(found).toEqual([]);
  });

  it('catches a key, a list length and a parameter English lacks', () => {
    const english = { Ash: { name: 'Ash {town}' }, list: ['a', 'b'] };

    expect(faults({ Misty: {} }, english, 'f')).toHaveLength(1);
    expect(faults({ list: ['a'] }, english, 'f')).toHaveLength(1);
    expect(faults({ Ash: { name: '{city}' } }, english, 'f')).toHaveLength(1);
    expect(faults({ Ash: { name: '{town}' }, list: ['x', 'y'] }, english, 'f')).toEqual([]);
  });

  it('lists every file the locale folders hold for the batch under trainers', () => {
    for (const locale of ['ja', 'es']) {
      const folder = join(TEXT, locale, 'trainers');

      if (existsSync(folder)) {
        for (const file of readdirSync(folder)) {
          expect(FILES, file).toContain(`trainers/${file.replace('.yaml', '')}`);
        }
      }
    }
  });
});

describe('a table read in the active locale', () => {
  const ids = { Brock: 0, Misty: 1 };
  const files = {
    '../text/en/leaders.yaml': {
      Brock: { name: 'Brock', quote: 'Rock.' },
      Misty: { name: 'Misty', quote: 'Water.' },
    },
    '../text/ja/leaders.yaml': { Brock: { name: 'タケシ' } },
  };

  it('reads a translated field in its locale and the rest in English', () => {
    const names = localeFieldTable(ids, files, 'leaders', 'name');
    const quotes = localeFieldTable(ids, files, 'leaders', 'quote');

    expect(names[0]).toBe('Brock');
    active.locale = 'ja';
    expect(names[0]).toBe('タケシ');
    expect(names[1]).toBe('Misty');
    expect(quotes[0]).toBe('Rock.');
  });

  it('reads lines keyed by something other than an id', () => {
    const lines = localeLines(
      {
        '../text/en/sheets.yaml': { 'a/b': 'Lady' },
        '../text/ja/sheets.yaml': { 'a/b': 'レディ' },
      },
      'sheets',
    );

    expect(lines['a/b']).toBe('Lady');
    active.locale = 'ja';
    expect(lines['a/b']).toBe('レディ');
  });

  it('reads a whole file from the locale that writes all of it', () => {
    const file = localeFile(
      { '../text/en/l.yaml': ['a'], '../text/ja/l.yaml': ['あ'] },
      'l',
      v.array(v.string()),
    );

    expect(file.read()).toEqual(['a']);
    active.locale = 'ja';
    expect(file.read()).toEqual(['あ']);
    active.locale = 'es';
    expect(file.read()).toEqual(['a']);
  });
});

describe('phrases the code fills in', () => {
  const files = {
    '../text/en/p.yaml': { hello: 'Hello {name}', plain: 'Plain' },
    '../text/ja/p.yaml': { hello: '{name}さん' },
  };

  it('fills the parameters in the active locale and reads the rest in English', () => {
    const phrase = localePhrases(files, 'p', ['hello', 'plain']);

    expect(phrase('hello', { name: 'Ash' })).toBe('Hello Ash');
    active.locale = 'ja';
    expect(phrase('hello', { name: 'Ash' })).toBe('Ashさん');
    expect(phrase('plain')).toBe('Plain');
  });

  it('fails on a parameter that was not given, a key English lacks and a key left out', () => {
    expect(() => localePhrases(files, 'p', ['hello', 'plain'])('hello')).toThrow(/name/);
    expect(() => localePhrases(files, 'p', ['hello'])).toThrow(/plain/);
    expect(() => localePhrases(files, 'p', ['hello', 'plain', 'more'])).toThrow(/more/);
  });
});

describe('town names by locale', () => {
  const words = {
    heads: { Beach: ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'] },
    tails: ['x'],
    titles: ['t'],
    marks: ['m'],
    counties: ['c'],
  };

  it('holds a locale to the lengths of English', () => {
    expect(() => {
      checkTownWords(words, words, 'f');
    }).not.toThrow();
    expect(() => {
      checkTownWords({ ...words, tails: ['x', 'y'] }, words, 'f');
    }).toThrow(/tails/);
    expect(() => {
      checkTownWords({ ...words, counties: [] }, words, 'f');
    }).toThrow(/counties/);
    expect(() => {
      checkTownWords({ ...words, heads: { Beach: ['a'] } }, words, 'f');
    }).toThrow(/8 heads/);
  });

  it('joins the parts English welds, Japanese from the county and Spanish title first', () => {
    const parts = { mark: 'New', head: 'Shell', tail: 'fell', title: 'Town', county: 'Ashmarch' };

    expect(TOWN_JOINERS.en(parts)).toBe('New Shellfell Town, Ashmarch');
    expect(TOWN_JOINERS.en({ ...parts, mark: null })).toBe('Shellfell Town, Ashmarch');
    expect(TOWN_JOINERS.ja(parts)).toBe('NewShellfellTown（Ashmarch）');
    expect(TOWN_JOINERS.ja({ ...parts, mark: null })).toBe('ShellfellTown（Ashmarch）');
    expect(TOWN_JOINERS.es(parts)).toBe('Town New Shell fell, Ashmarch');
    expect(COUNTY_NAMES).toHaveLength(64);
  });

  it('makes a Spanish mark agree with its title, and leaves the others as they are', () => {
    const parts = {
      mark: 'Nuevo',
      head: 'Concha',
      tail: 'del Risco',
      title: 'Pueblo',
      county: 'X',
    };

    expect(TOWN_JOINERS.es(parts)).toBe('Pueblo Nuevo Concha del Risco, X');
    expect(TOWN_JOINERS.es({ ...parts, title: 'Ciudad' })).toBe('Ciudad Nueva Concha del Risco, X');
    expect(TOWN_JOINERS.es({ ...parts, title: 'Molinos' })).toBe(
      'Molinos Nuevos Concha del Risco, X',
    );
    expect(TOWN_JOINERS.es({ ...parts, mark: 'Grande', title: 'Molinos' })).toBe(
      'Molinos Grandes Concha del Risco, X',
    );
    expect(TOWN_JOINERS.es({ ...parts, mark: 'Grande', title: 'Ciudad' })).toBe(
      'Ciudad Grande Concha del Risco, X',
    );
    expect(TOWN_JOINERS.es({ ...parts, mark: null })).toBe('Pueblo Concha del Risco, X');
    // A head that is an adjective agrees too, in gender and number
    expect(TOWN_JOINERS.es({ ...parts, mark: null, head: 'Ardiente', title: 'Molinos' })).toBe(
      'Molinos Ardientes del Risco, X',
    );
    expect(TOWN_JOINERS.es({ ...parts, mark: null, head: 'Abrasador', title: 'Ciudad' })).toBe(
      'Ciudad Abrasadora del Risco, X',
    );
    expect(TOWN_JOINERS.es({ ...parts, mark: null, head: 'Granito', title: 'Ciudad' })).toBe(
      'Ciudad Granito del Risco, X',
    );
  });
});

describe('families and Megas named from species', () => {
  it('names a family for the pokemon it is named for, in ja and es', () => {
    const bulbasaur = FAMILY_IDS.Bulbasaur;

    expect(FAMILY_NAMES[bulbasaur]).toBe('Bulbasaur');
    active.locale = 'ja';
    expect(FAMILY_NAMES[bulbasaur]).toBe('フシギダネ');
    active.locale = 'es';
    expect(FAMILY_NAMES[bulbasaur]).toBe('Bulbasaur');
  });

  it('names every Mega the way its template makes it in each locale', () => {
    const odd: string[] = [];

    for (const mega of listMegas()) {
      const english = getSpeciesData(mega).name;

      active.locale = 'es';
      if (
        !english.includes('Tatsugiri ') &&
        getSpeciesData(mega).name !== english.replace('Mega ', 'Mega-')
      ) {
        odd.push(`es ${english}`);
      }
      active.locale = 'ja';
      if (
        !/^メガ[\p{Script=Katakana}ー]+[XYZ]?(（[\p{Script=Hiragana}]+）)?$/u.test(
          getSpeciesData(mega).name,
        )
      ) {
        odd.push(`ja ${english}`);
      }
      active.locale = 'en';
      if (!english.startsWith('Mega ')) {
        odd.push(english);
      }
    }
    expect(odd).toEqual([]);
  });

  it('names the Tatsugiri Megas for their forms, in one script', () => {
    const found: string[] = [];

    for (const mega of listMegas()) {
      const english = getSpeciesData(mega).name;

      if (english.includes('Tatsugiri')) {
        active.locale = 'ja';
        found.push(getSpeciesData(mega).name);
        active.locale = 'es';
        found.push(getSpeciesData(mega).name);
        active.locale = 'en';
      }
    }
    expect(found).toEqual([
      'メガシャリタツ',
      'Mega-Tatsugiri',
      'メガシャリタツ（のびたすがた）',
      'Mega-Tatsugiri (Forma Recta)',
      'メガシャリタツ（たれたすがた）',
      'Mega-Tatsugiri (Forma Lánguida)',
    ]);
  });

  it('names a Mega from the official name of its pokemon in ja and es', () => {
    const named: string[] = [];

    for (const mega of listMegas()) {
      const base = getMegaBase(mega);

      if (base != null && getSpeciesData(base).name === 'Charizard') {
        active.locale = 'ja';
        named.push(getSpeciesData(mega).name);
        active.locale = 'es';
        named.push(getSpeciesData(mega).name);
        active.locale = 'en';
        named.push(getSpeciesData(mega).name);
      }
    }
    expect(named).toEqual([
      'メガリザードンX',
      'Mega-Charizard X',
      'Mega Charizard X',
      'メガリザードンY',
      'Mega-Charizard Y',
      'Mega Charizard Y',
    ]);
  });
});

describe('the NPCs, their stalls and their scenery in ja and es', () => {
  const NPC_FIELDS = ['name', 'description', 'quote', 'spent'];
  const PEOPLE = v.record(v.string(), v.record(v.string(), v.string()));
  const LINES = v.record(v.string(), v.string());

  it('write every person, stall and kind of scenery, with the fields English writes', () => {
    const missing: string[] = [];
    const english = v.parse(PEOPLE, read('en', 'npcs'));

    for (const locale of ['ja', 'es']) {
      const written = v.parse(PEOPLE, read(locale, 'npcs'));

      for (const [key, person] of Object.entries(english)) {
        for (const field of NPC_FIELDS) {
          if (field in person && !written[key]?.[field]) {
            missing.push(`${locale} ${key}.${field}`);
          }
        }
      }
      for (const file of ['vendor-stalls', 'decorations']) {
        const lines = v.parse(LINES, read(locale, file));

        for (const key of Object.keys(v.parse(LINES, read('en', file)))) {
          if (!lines[key]) {
            missing.push(`${locale} ${file} ${key}`);
          }
        }
      }
    }
    expect(missing).toEqual([]);
  });

  it('end every description on a full stop, 。 in Japanese', () => {
    const open: string[] = [];

    for (const [locale, stop] of [
      ['ja', '。'],
      ['es', '.'],
    ]) {
      for (const [key, person] of Object.entries(v.parse(PEOPLE, read(locale, 'npcs')))) {
        if (!person.description.endsWith(stop)) {
          open.push(`${locale} ${key}`);
        }
      }
    }
    expect(open).toEqual([]);
  });

  it('say no two people by the same name in one locale', () => {
    for (const locale of ['ja', 'es']) {
      const names = Object.values(v.parse(PEOPLE, read(locale, 'npcs'))).map(
        (person) => person.name,
      );

      expect(new Set(names).size, locale).toBe(names.length);
    }
  });
});

describe('the trainer classes and sheets in ja and es', () => {
  const CLASSES = v.record(v.string(), v.object({ name: v.string(), quote: v.string() }));
  const LINES = v.record(v.string(), v.string());
  const REGIONS = ['kanto', 'johto', 'hoenn', 'sinnoh', 'kalos', 'unova'];

  it('write a name and a quote for every class and a name for every sheet', () => {
    const missing: string[] = [];

    for (const locale of ['ja', 'es']) {
      for (const region of REGIONS) {
        const english = v.parse(CLASSES, read('en', `trainers/${region}`));
        const written = v.parse(CLASSES, read(locale, `trainers/${region}`));

        for (const key of Object.keys(english)) {
          if (!written[key]?.name || !written[key]?.quote) {
            missing.push(`${locale} ${region} ${key}`);
          }
        }
      }
      const sheets = v.parse(LINES, read(locale, 'trainer-sheets'));

      for (const key of Object.keys(v.parse(LINES, read('en', 'trainer-sheets')))) {
        if (!sheets[key]) {
          missing.push(`${locale} sheet ${key}`);
        }
      }
      if (!v.parse(LINES, read(locale, 'trainer-names')).region) {
        missing.push(`${locale} trainer-names region`);
      }
    }
    expect(missing).toEqual([]);
  });

  it('end every quote on a full stop, 。 in Japanese, or a mark that closes a sentence', () => {
    const open: string[] = [];

    for (const [locale, closing] of [
      ['ja', /[。！？…]$/u],
      ['es', /[.!?…]$/u],
    ] as const) {
      for (const region of REGIONS) {
        for (const [key, entry] of Object.entries(
          v.parse(CLASSES, read(locale, `trainers/${region}`)),
        )) {
          if (!closing.test(entry.quote)) {
            open.push(`${locale} ${key}`);
          }
        }
      }
    }
    expect(open).toEqual([]);
  });

  it('keep the classes English names alike under one name in ja and es', () => {
    const found: string[] = [];

    for (const locale of ['ja', 'es']) {
      const byEnglish = new Map<string, Set<string>>();

      for (const region of REGIONS) {
        const english = v.parse(CLASSES, read('en', `trainers/${region}`));
        const written = v.parse(CLASSES, read(locale, `trainers/${region}`));

        for (const [key, entry] of Object.entries(english)) {
          const names = byEnglish.get(entry.name) ?? new Set<string>();

          names.add(Object.hasOwn(written, key) ? written[key].name : '');
          byEnglish.set(entry.name, names);
        }
      }
      for (const [name, names] of byEnglish) {
        if (names.size > 1) {
          found.push(`${locale} ${name}: ${[...names].join(', ')}`);
        }
      }
    }
    expect(found).toEqual([]);
  });
});

describe('the gym leaders, Elite Four and other experts in ja and es', () => {
  const PEOPLE = v.record(v.string(), v.record(v.string(), v.string()));
  const LINES = v.record(v.string(), v.string());
  const CLOSING = {
    ja: /[。！？…]」?$/u,
    es: /[.!?…][»]?$/u,
  };
  /** Each file, and the fields every entry of it writes */
  const PEOPLE_FILES: Record<string, string[]> = {
    'gym-leaders': ['name', 'quote'],
    elite: ['name', 'quote'],
    champions: ['name', 'greeting'],
    legends: ['name', 'greeting'],
    executives: ['name', 'quote'],
    frontier: ['name', 'house', 'greeting'],
    syndicates: ['name', 'boss', 'boss-title', 'executive-title', 'boss-quote', 'grunt-quote'],
  };

  /** Every field of every entry a locale file holds, as `file key.field`, with its text */
  function written(locale: string, file: string, keys: string[]): Map<string, string> {
    const lines = new Map<string, string>();
    const people = v.parse(PEOPLE, read(locale, file));

    for (const key of keys) {
      for (const field of PEOPLE_FILES[file]) {
        lines.set(`${locale} ${file} ${key}.${field}`, people[key]?.[field] ?? '');
      }
    }
    return lines;
  }

  it('write every field of every person and team that English writes', () => {
    const missing: string[] = [];

    for (const locale of ['ja', 'es']) {
      for (const file of Object.keys(PEOPLE_FILES)) {
        const keys = Object.keys(v.parse(PEOPLE, read('en', file)));

        for (const [where, text] of written(locale, file, keys)) {
          if (!text) {
            missing.push(where);
          }
        }
      }
    }
    expect(missing).toEqual([]);
  });

  it('write every Pike curtain, Arcade panel and syndicate phrase', () => {
    const missing: string[] = [];

    for (const locale of ['ja', 'es']) {
      const english = v.parse(v.record(v.string(), LINES), read('en', 'frontier-rooms'));
      const rooms = v.parse(v.record(v.string(), LINES), read(locale, 'frontier-rooms'));

      for (const [section, lines] of Object.entries(english)) {
        for (const key of Object.keys(lines)) {
          if (!rooms[section]?.[key]) {
            missing.push(`${locale} frontier-rooms ${section}.${key}`);
          }
        }
      }
      const titles = v.parse(LINES, read(locale, 'syndicate-titles'));

      for (const key of Object.keys(v.parse(LINES, read('en', 'syndicate-titles')))) {
        if (!titles[key]) {
          missing.push(`${locale} syndicate-titles ${key}`);
        }
      }
    }
    expect(missing).toEqual([]);
  });

  it('end every quote and greeting on a mark that closes a sentence', () => {
    const open: string[] = [];

    for (const locale of ['ja', 'es'] as const) {
      for (const file of Object.keys(PEOPLE_FILES)) {
        const keys = Object.keys(v.parse(PEOPLE, read('en', file)));

        for (const [where, text] of written(locale, file, keys)) {
          const field = where.slice(where.lastIndexOf('.') + 1);

          if ((field.endsWith('quote') || field === 'greeting') && !CLOSING[locale].test(text)) {
            open.push(where);
          }
        }
      }
    }
    expect(open).toEqual([]);
  });

  it('give each syndicate phrase the same parameters as English', () => {
    for (const locale of ['ja', 'es']) {
      const titles = v.parse(LINES, read(locale, 'syndicate-titles'));
      const english = v.parse(LINES, read('en', 'syndicate-titles'));

      for (const key of Object.keys(english)) {
        expect(parameters(titles[key]).toSorted(), `${locale} ${key}`).toEqual(
          parameters(english[key]).toSorted(),
        );
      }
    }
  });
});

describe('the places in ja and es', () => {
  const LINES = v.record(v.string(), v.string());
  const FIELDS = v.record(v.string(), v.record(v.string(), v.string()));
  const STOP = { ja: '。', es: '.' } as const;

  /** The flat files of the batch, keyed like English, which every key of must be written */
  const FLAT = ['biomes', 'times-of-day', 'landmarks', 'lairs', 'phenomena', 'spawn-rarities'];

  it('write a name for every biome, hour, landmark, lair, phenomenon and rarity', () => {
    const missing: string[] = [];

    for (const locale of ['ja', 'es']) {
      for (const file of FLAT) {
        const written = v.parse(LINES, read(locale, file));

        for (const key of Object.keys(v.parse(LINES, read('en', file)))) {
          if (!written[key]) {
            missing.push(`${locale} ${file} ${key}`);
          }
        }
      }
    }
    expect(missing).toEqual([]);
  });

  it('write a name and a sentence for every sky, the sentence closing on a full stop', () => {
    const found: string[] = [];

    for (const locale of ['ja', 'es'] as const) {
      const written = v.parse(FIELDS, read(locale, 'weather'));

      for (const key of Object.keys(v.parse(FIELDS, read('en', 'weather')))) {
        if (!written[key]?.name) {
          found.push(`${locale} weather ${key}.name`);
        }
        if (!written[key]?.description?.endsWith(STOP[locale])) {
          found.push(`${locale} weather ${key}.description`);
        }
      }
    }
    expect(found).toEqual([]);
  });

  it('write both lair title phrases with the parameters English uses', () => {
    for (const locale of ['ja', 'es']) {
      const titles = v.parse(LINES, read(locale, 'lair-titles'));
      const english = v.parse(LINES, read('en', 'lair-titles'));

      for (const key of Object.keys(english)) {
        expect(parameters(titles[key]).toSorted(), `${locale} ${key}`).toEqual(
          parameters(english[key]).toSorted(),
        );
      }
    }
  });

  it('keep every ja place name free of kanji and every name in one locale distinct', () => {
    for (const locale of ['ja', 'es']) {
      for (const file of ['biomes', 'landmarks', 'lairs', 'spawn-rarities']) {
        const names = Object.values(v.parse(LINES, read(locale, file)));

        expect(new Set(names).size, `${locale} ${file}`).toBe(names.length);
        if (locale === 'ja') {
          expect(names.join(''), file).not.toMatch(/\p{Script=Han}/u);
        }
      }
    }
  });

  it('give the rarities the case their sentence needs: lower case in es', () => {
    for (const name of Object.values(v.parse(LINES, read('es', 'spawn-rarities')))) {
      expect(name, name).toBe(name.toLowerCase());
    }
  });
});

describe('town names in ja and es', () => {
  const TOWNS: [SettledBiome, number, number, string, string][] = [
    [
      Biome.Beach,
      164,
      -189,
      'コイシミナトタウン（ヒバリヌマ）',
      'Pueblo Guijarro del Refugio, Alondral',
    ],
    [
      Biome.Mangrove,
      44,
      -103,
      'ササエコウヤシティ（コハクカコイ）',
      'Ciudad Apuntalada de la Meseta, Redil Ámbar',
    ],
    [
      Biome.Swamp,
      -126,
      -94,
      'ガマノハラムラ（コガネザカイ）',
      'Aldea Ranera de la Landa, Marca Dorada',
    ],
    [
      Biome.TropicalRainforest,
      -25,
      -12,
      'オールドランザカイサト（クワヌマ）',
      'Caserío Viejo Orquídea de la Frontera, Rastrojal',
    ],
    [
      Biome.Grassland,
      -6,
      57,
      'イーストオオムギタニアイクロス（シオヌマ）',
      'Cruce Este Cebada de la Hoz, Salobral',
    ],
    [
      Biome.Mountain,
      -143,
      60,
      'ウエストチョウジョウタニシュクバ（カジヤ）',
      'Parada Oeste Cumbre del Valle, Ferrería',
    ],
  ];

  it('names the same town in every locale, from the words at its place in each list', () => {
    for (const [biome, x, y, ja, es] of TOWNS) {
      active.locale = 'ja';
      expect(nameTown(x, y, biome)).toBe(ja);
      active.locale = 'es';
      expect(nameTown(x, y, biome)).toBe(es);
    }
  });

  it('keeps the English names', () => {
    active.locale = 'en';
    expect(nameTown(0, 0, Biome.Glacier)).toBe('Hoarfell Town, Oakenwold');
  });

  it('writes the Japanese town words in katakana, as the games write a town', () => {
    const file = readFileSync(join(TEXT, 'ja', 'town-names.yaml'), 'utf8');
    const words = file.split('\n').filter((line) => !line.startsWith('#'));

    expect(words.join('\n')).not.toMatch(/[\p{Script=Hiragana}\p{Script=Han}]/u);
  });

  it('writes words that are distinct inside every list', () => {
    for (const locale of ['ja', 'es']) {
      const words = v.parse(
        v.object({
          heads: v.record(v.string(), v.array(v.string())),
          tails: v.array(v.string()),
          titles: v.array(v.string()),
          marks: v.array(v.string()),
          counties: v.array(v.string()),
        }),
        read(locale, 'town-names'),
      );
      const heads = Object.values(words.heads).flat();

      // No two biomes share a head, so a name never has to carry its biome
      expect(new Set(heads).size, `${locale} heads`).toBe(heads.length);
      for (const list of [words.tails, words.titles, words.marks, words.counties]) {
        expect(new Set(list).size, locale).toBe(list.length);
      }
    }
  });
});

describe('quests, awards, titles and the small name tables in ja and es', () => {
  const STOP = { ja: '。', es: '.' } as const;

  /** The files this batch closes the plan with */
  const PROGRESS = [
    'regions',
    'title-forms',
    'dex-chain',
    'quest-rotations',
    'quests',
    'awards',
    'achievements',
    'titles',
    'dex-rungs',
    'egg-groups',
    'item-types',
  ];

  /** The phrase templates among them: every `{param}` is kept */
  const TEMPLATES = ['title-forms', 'dex-chain', 'quest-rotations'];

  /** Every line of a file with the path it sits at */
  function lines(value: unknown, where: string): [string, string][] {
    if (typeof value === 'string') {
      return [[where, value]];
    }
    if (Array.isArray(value)) {
      return value.flatMap((item, at) => lines(item, `${where}[${at}]`));
    }
    if (typeof value === 'object' && value != null) {
      return Object.entries(value).flatMap(([key, item]) => lines(item, `${where}.${key}`));
    }
    return [];
  }

  it('write every entry English has, in both locales', () => {
    const missing: string[] = [];

    for (const locale of ['ja', 'es']) {
      for (const file of PROGRESS) {
        const written = new Map(lines(read(locale, file), file));

        for (const [where] of lines(read('en', file), file)) {
          if (!written.get(where)) {
            missing.push(`${locale} ${where}`);
          }
        }
      }
    }
    expect(missing).toEqual([]);
  });

  it('end a line on a full stop where English does, 。 in Japanese', () => {
    const open: string[] = [];

    for (const locale of ['ja', 'es'] as const) {
      for (const file of PROGRESS) {
        const written = new Map(lines(read(locale, file), file));

        for (const [where, english] of lines(read('en', file), file)) {
          if (english.endsWith('.') && !written.get(where)?.endsWith(STOP[locale])) {
            open.push(`${locale} ${where}`);
          }
        }
      }
    }
    expect(open).toEqual([]);
  });

  it('keep every parameter of the phrase templates and the quest names', () => {
    const found: string[] = [];

    for (const locale of ['ja', 'es']) {
      for (const file of [...TEMPLATES, 'quests', 'awards', 'achievements']) {
        const written = new Map(lines(read(locale, file), file));

        for (const [where, english] of lines(read('en', file), file)) {
          const used = parameters(written.get(where) ?? '').toSorted();

          if (used.join() !== parameters(english).toSorted().join()) {
            found.push(`${locale} ${where}`);
          }
        }
      }
    }
    expect(found).toEqual([]);
  });

  it('write no kanji in ja, comments included', () => {
    for (const file of PROGRESS) {
      expect(readFileSync(join(TEXT, 'ja', `${file}.yaml`), 'utf8'), file).not.toMatch(
        /\p{Script=Han}/u,
      );
    }
  });

  it('give the official names of the egg groups, regions and the Kanto badges', () => {
    const groups = v.parse(v.record(v.string(), v.string()), read('ja', 'egg-groups'));
    const groupsEs = v.parse(v.record(v.string(), v.string()), read('es', 'egg-groups'));
    const regions = v.parse(v.record(v.string(), v.string()), read('ja', 'regions'));
    const regionsEs = v.parse(v.record(v.string(), v.string()), read('es', 'regions'));
    const awards = v.parse(v.record(v.string(), v.string()), read('ja', 'awards'));
    const awardsEs = v.parse(v.record(v.string(), v.string()), read('es', 'awards'));

    expect([groups.Monster, groups.Field, groups.NoEggsDiscovered]).toEqual([
      'かいじゅう',
      'りくじょう',
      'タマゴみはっけん',
    ]);
    expect([groupsEs.Monster, groupsEs.HumanLike, groupsEs.NoEggsDiscovered]).toEqual([
      'Monstruo',
      'Humanoide',
      'Desconocido',
    ]);
    expect([regions.Unova, regions.Paldea]).toEqual(['イッシュ', 'パルデア']);
    expect([regionsEs.Unova, regionsEs.Hoenn]).toEqual(['Teselia', 'Hoenn']);
    expect([awards.BoulderBadge, awards.MarshBadge]).toEqual(['グレーバッジ', 'ゴールドバッジ']);
    expect([awardsEs.BoulderBadge, awardsEs.MarshBadge]).toEqual([
      'Medalla Roca',
      'Medalla Pantano',
    ]);
  });

  it('say no two egg groups, item kinds, quests or achievement lines by one name', () => {
    for (const locale of ['ja', 'es']) {
      for (const file of ['egg-groups', 'item-types', 'dex-rungs', 'titles']) {
        const names = lines(read(locale, file), file).map(([, line]) => line);

        expect(new Set(names).size, `${locale} ${file}`).toBe(names.length);
      }

      const quests = v.parse(
        v.object({
          chains: v.record(v.string(), v.string()),
          quests: v.record(v.string(), v.string()),
          daily: v.record(v.string(), v.string()),
        }),
        read(locale, 'quests'),
      );
      const names = Object.values({ ...quests.chains, ...quests.quests, ...quests.daily });

      expect(new Set(names).size, `${locale} quests`).toBe(names.length);
    }
  });

  it('read the quest names, the dex chain and the titles in the locale when asked', async () => {
    const { CHAINS } = await import('../../src/data/quests');
    const { getTitleName, professorTitle, lineTitle } = await import('../../src/data/ids/titles');
    const { default: Regions } = await import('../../src/data/ids/regions');
    const { AchievementLine } = await import('../../src/data/ids/achievements');

    active.locale = 'ja';
    expect(getTitleName(professorTitle(Regions.Kanto))).toBe('カントーはかせ');
    expect(Object.values(CHAINS).at(-1)?.name).toBe('イッシュずかん');
    active.locale = 'es';
    expect(getTitleName(professorTitle(Regions.Kanto))).toBe('Prof. de Kanto');
    expect(getTitleName(lineTitle(AchievementLine.Collector, true))).toBe(
      'Coleccionista de platino',
    );
    expect(Object.values(CHAINS).at(-1)?.name).toBe('Pokédex de Teselia');
  });
});
