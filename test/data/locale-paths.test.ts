import { describe, expect, it, vi } from 'vitest';
import type * as LocaleModule from '../../src/i18n/locale';
import { APRICORNS, ItemTypes } from '../../src/data/ids/items';
import registerGameData from '../../src/data/index';
import { getItemData, listItemsByType } from '../../src/data/items';
import apricornTreeSheet from '../../src/data/overworld/apricorn-tree';

/**
 * A sprite path is filed under the enum's own name, never under the
 * name a player reads. The data is registered here with Japanese
 * active, the way a browser showing Japanese registers it, and every
 * path must still read as the English file it points at.
 */

vi.mock('../../src/i18n/locale', async (original) => ({
  ...(await original<typeof LocaleModule>()),
  currentLocale: () => 'ja',
}));

registerGameData();

describe('a sprite path', () => {
  it('draws each machine from its type sheet, whatever the locale', () => {
    for (const machine of listItemsByType(ItemTypes.Machine)) {
      expect(getItemData(machine).icon).toMatch(/^tm\/[a-z]+$/);
    }
  });

  it('files each apricorn tree under its colour, whatever the locale', () => {
    for (const apricorn of APRICORNS) {
      expect(apricornTreeSheet(apricorn)).toMatch(/^landmarks-apricorn\/[a-z]+$/);
    }
  });
});
