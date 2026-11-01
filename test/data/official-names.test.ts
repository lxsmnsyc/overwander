import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type * as LocaleModule from '../../src/i18n/locale';
import { getAbilityData } from '../../src/data/abilities';
import {
  ENGLISH_STAGE_NAMES,
  ENGLISH_STAT_NAMES,
  STAGE_NAMES,
  STAT_NAMES,
  Stages,
  Stats,
} from '../../src/data/constants/stats';
import { TYPE_NAMES, Types } from '../../src/data/constants/types';
import Abilities from '../../src/data/ids/abilities';
import { Items } from '../../src/data/ids/items';
import { Moves } from '../../src/data/ids/moves';
import Natures from '../../src/data/ids/natures';
import { Species } from '../../src/data/ids/species';
import { NATURE_NAMES } from '../../src/data/ids/text';
import registerGameData from '../../src/data/index';
import { getItemData } from '../../src/data/items';
import { getMoveData } from '../../src/data/moves';
import { getSpeciesData } from '../../src/data/species';
import { listTrueShadows } from '../../src/data/species/true-shadow';
import { keepWritten } from '../../scripts/i18n/keep-written';

/**
 * The official Japanese and Spanish names, written by
 * `scripts/i18n/official-names.ts` and laid over English. The active
 * locale is whatever a case sets, read through the real locale module.
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

describe('the official names', () => {
  it('name the species, moves, abilities and items in Japanese kana', () => {
    active.locale = 'ja';
    expect(getSpeciesData(Species.Bulbasaur).name).toBe('フシギダネ');
    expect(getSpeciesData(Species.Bulbasaur).category).toBe('たねポケモン');
    expect(getMoveData(Moves.Tackle).name).toBe('たいあたり');
    expect(getAbilityData(Abilities.Overgrow).name).toBe('しんりょく');
    expect(getItemData(Items.PokeBall).name).toBe('モンスターボール');
    expect(TYPE_NAMES[Types.Fire]).toBe('ほのお');
  });

  it('name them in Spanish', () => {
    active.locale = 'es';
    expect(getSpeciesData(Species.Bulbasaur).name).toBe('Bulbasaur');
    expect(getMoveData(Moves.Tackle).name).toBe('Placaje');
    expect(TYPE_NAMES[Types.Fire]).toBe('Fuego');
    expect(NATURE_NAMES[Natures.Hardy]).toBe('Fuerte');
  });

  it('leave English as it was', () => {
    expect(getSpeciesData(Species.Bulbasaur).category).toBe('Seed Pokemon');
    expect(getMoveData(Moves.Tackle).name).toBe('Tackle');
    expect(TYPE_NAMES[Types.Fire]).toBe('Fire');
  });

  it('give every true shadow its code name in each locale', () => {
    for (const locale of ['en', 'ja', 'es']) {
      active.locale = locale;
      for (const shadow of listTrueShadows()) {
        expect(getSpeciesData(shadow).name).toMatch(/XD-\d+/);
      }
    }
  });

  it('write Japanese without kanji', () => {
    const kanji = /\p{Script=Han}/u;
    const found: string[] = [];

    for (const entry of readdirSync('src/data/text/ja', { recursive: true, withFileTypes: true })) {
      if (entry.isFile() && kanji.test(readFileSync(join(entry.parentPath, entry.name), 'utf8'))) {
        found.push(entry.name);
      }
    }
    expect(found).toEqual([]);
  });
});

describe('the generator', () => {
  it('keeps a hand-written field and entry when it rewrites a file', () => {
    // A file holding a description beside a generated name, and an entry of the engine's own
    const held = {
      Tackle: { name: 'old', category: 'old', description: 'Written by hand.' },
      Frenzy: { name: 'Hand name', description: 'Also by hand.' },
    };
    const written = { Tackle: { name: 'たいあたり' }, Scratch: { name: 'ひっかく' } };

    expect(keepWritten(held, written)).toEqual({
      // The name is the script's, the description is kept, and a category it no longer writes goes
      Tackle: { name: 'たいあたり', description: 'Written by hand.' },
      Scratch: { name: 'ひっかく' },
      Frenzy: { name: 'Hand name', description: 'Also by hand.' },
    });
  });

  it('keeps hand-written fields inside a species family', () => {
    const held = {
      Bulbasaur: { Bulbasaur: { name: 'x', note: 'kept' } },
      Own: { Thing: { name: 'Mine' } },
    };
    const written = { Bulbasaur: { Bulbasaur: { name: 'フシギダネ' } } };

    expect(keepWritten(held, written)).toEqual({
      Bulbasaur: { Bulbasaur: { name: 'フシギダネ', note: 'kept' } },
      Own: { Thing: { name: 'Mine' } },
    });
  });

  it('writes the same file again when nothing is held', () => {
    const written = { Tackle: { name: 'たいあたり' } };

    expect(keepWritten(undefined, written)).toEqual(written);
    expect(keepWritten(keepWritten(undefined, written), written)).toEqual(written);
  });
});

describe('stat and stage names', () => {
  it('follow the locale', () => {
    active.locale = 'ja';
    expect(STAT_NAMES[Stats.SpecialAttack]).toBe('とくこう');
    expect(STAGE_NAMES[Stages.Evasion]).toBe('かいひ');
    active.locale = 'es';
    expect(STAT_NAMES[Stats.HP]).toBe('PS');
    expect(STAGE_NAMES[Stages.Accuracy]).toBe('Precisión');
  });

  it('stay English for the callers that match them', () => {
    active.locale = 'ja';
    expect(ENGLISH_STAT_NAMES[Stats.SpecialAttack]).toBe('Sp. Attack');
    expect(ENGLISH_STAGE_NAMES[Stages.Evasion]).toBe('Evasion');
  });

  it('name the stat in a vitamin description under each locale', () => {
    expect(getItemData(Items.Protein).description).toContain('Attack');
    active.locale = 'ja';
    expect(getItemData(Items.Protein).description).toContain('こうげき');
    active.locale = 'es';
    expect(getItemData(Items.Protein).description).toContain('Ataque');
  });
});

describe('Zenith names', () => {
  it('are built from each locale template', () => {
    expect(getSpeciesData(Species.ButterfreeZenith).name).toBe('Zenith Butterfree');
    active.locale = 'ja';
    expect(getSpeciesData(Species.ButterfreeZenith).name).toBe('ゼニスバタフリー');
    active.locale = 'es';
    expect(getSpeciesData(Species.ButterfreeZenith).name).toBe('Cenit-Butterfree');
  });

  it('read the active locale on each read', () => {
    const zenith = getSpeciesData(Species.ButterfreeZenith);

    active.locale = 'ja';
    expect(zenith.name).toBe('ゼニスバタフリー');
    active.locale = 'en';
    expect(zenith.name).toBe('Zenith Butterfree');
  });
});
