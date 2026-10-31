import { readFileSync } from 'node:fs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type * as LocaleModule from '../../src/i18n/locale';
import { STATUS_IDS } from '../../src/data/ids/names';
import { Statuses } from '../../src/data/ids/status';
import { getStatusName } from '../../src/model/health';

/**
 * Status names follow the locale, the way type and nature names do:
 * the games' own words in Japanese and Spanish, laid over English
 */

const active = vi.hoisted(() => ({ locale: 'en' }));

vi.mock('../../src/i18n/locale', async (original) => ({
  ...(await original<typeof LocaleModule>()),
  currentLocale: () => active.locale,
}));

afterEach(() => {
  active.locale = 'en';
});

/** The status keys a locale's file writes */
function readWritten(locale: string): string[] {
  const text = readFileSync(
    new URL(`../../src/data/text/${locale}/statuses.yaml`, import.meta.url),
    'utf8',
  );
  const keys: string[] = [];

  for (const line of text.split('\n')) {
    const key = /^(\w+):/.exec(line);

    if (key != null) {
      keys.push(key[1]);
    }
  }
  return keys;
}

describe('the status names', () => {
  it('read in the active locale', () => {
    expect(getStatusName(Statuses.Burned)).toBe('Burned');
    active.locale = 'ja';
    expect(getStatusName(Statuses.Burned)).toBe('やけど');
    active.locale = 'es';
    expect(getStatusName(Statuses.Burned)).toBe('Quemado');
  });

  it.each(['ja', 'es'])('are all written in %s', (locale) => {
    expect(readWritten(locale).sort()).toEqual(Object.keys(STATUS_IDS).sort());
  });
});
