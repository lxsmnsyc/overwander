import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'yaml';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type * as LocaleModule from '../../src/i18n/locale';
import registerGameData from '../../src/data/index';
import { FAMILY_NAMES } from '../../src/data/ids/text';
import { FAMILY_IDS } from '../../src/data/ids/names';
import { getMegaBase, getSpeciesData, listMegas } from '../../src/data/species';
import { COUNTY_NAMES, TOWN_JOINERS, checkTownWords } from '../../src/data/overworld/town-names';
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
    expect(TOWN_JOINERS.ja(parts)).toBe('AshmarchNewShellfellTown');
    expect(TOWN_JOINERS.es(parts)).toBe('Town New Shellfell, Ashmarch');
    expect(COUNTY_NAMES).toHaveLength(64);
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
