import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type * as LocaleModule from '../../src/i18n/locale';
import { getAbilityData } from '../../src/data/abilities';
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
