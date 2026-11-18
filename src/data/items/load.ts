import type { Items } from '../ids/items';
import { deriveLocalized } from '../yaml';
import { registerItem, registerItemTemplates } from './__create';
import { describeAbilityItem } from './ability-items';
import { describeApricorn } from './apricorns';
import { describeBerry } from './berries';
import { describeBottleCap } from './bottle-caps';
import { describeDrink } from './drinks';
import { describeDrive } from './drives';
import { describeEscapeRope } from './escape-rope';
import { describeGem } from './gems';
import { describeHoney } from './honey';
import { describeIncense } from './incenses';
import { describeKeyItem } from './key-items';
import { describeMedicine } from './medicine';
import { describeMegaStone } from './mega-stones';
import { describeMemory } from './memories';
import { describeMintItem } from './mints';
import { describePlate } from './plates';
import { describePowerItem } from './power-items';
import { describePurifyingGem } from './purifying-gem';
import { describeRareCandy } from './rare-candy';
import { describeTeraShard } from './tera-shards';
import { describeTreat } from './treats';
import { describeTypeBooster } from './type-boosters';
import { describeValuable } from './valuables';
import { describeVitamin } from './vitamins';
import { describeWing } from './wings';
import { describeZCrystal } from './z-crystals';
import { describeZenithShard } from './zenith-shards';
import registerMachines from './machines';
import { ITEM_FAMILIES } from './index';
import { readItems } from './yaml';
import { type LazyText, readActiveText } from '../locale-text';

/**
 * The items, read out of their YAML, described and registered.
 *
 * Nothing but `battle-data.ts` (through a dynamic import) and
 * `register.ts` reaches this module, which keeps the files and the
 * code that writes each family's lines out of the first frame's
 * download. The words of every locale but English are fetched apart,
 * one file each (see `locale-text.ts`).
 */

const RECORDS = import.meta.glob('./records/*.yaml', { eager: true, import: 'default' });
const ENGLISH = import.meta.glob('../text/en/items/*.yaml', { eager: true, import: 'default' });
const OTHER: LazyText = import.meta.glob(['../text/*/items/*.yaml', '!../text/en/items/*'], {
  import: 'default',
});

/**
 * The families whose lines follow their own tables, and the code that
 * writes each one out of its text file's templates
 */
const DESCRIBERS = new Map<string, (item: Items) => string>([
  ['ability-items', describeAbilityItem],
  ['apricorns', describeApricorn],
  ['berries', describeBerry],
  ['bottle-caps', describeBottleCap],
  ['drinks', describeDrink],
  ['drives', describeDrive],
  ['escape-rope', describeEscapeRope],
  ['gems', describeGem],
  ['honey', describeHoney],
  ['incenses', describeIncense],
  ['key-items', describeKeyItem],
  ['medicine', describeMedicine],
  ['mega-stones', describeMegaStone],
  ['memories', describeMemory],
  ['mints', describeMintItem],
  ['plates', describePlate],
  ['power-items', describePowerItem],
  ['purifying-gem', describePurifyingGem],
  ['rare-candy', describeRareCandy],
  ['tera-shards', describeTeraShard],
  ['treats', describeTreat],
  ['type-boosters', describeTypeBooster],
  ['valuables', describeValuable],
  ['vitamins', describeVitamin],
  ['wings', describeWing],
  ['z-crystals', describeZCrystal],
  ['zenith-shards', describeZenithShard],
]);

/**
 * Registers the items from every text file given, English among them.
 * The machines are generated from the species learn sets, so the
 * species and their moves have to be registered before this runs
 */
export function fillItems(textFiles: Record<string, unknown>): void {
  // Written as YAML, a file per family (see ./yaml.ts)
  const { items, text } = readItems({ records: RECORDS, text: textFiles }, ITEM_FAMILIES);
  for (const [family, words] of text) {
    registerItemTemplates(family, words.templates, words.translatedTemplates);
  }
  for (const { item, data } of items) {
    registerItem(item, data);
  }
  // Once every name is in, since a line may name another item
  for (const { family, item, data } of items) {
    if (data.description === '') {
      const describe = DESCRIBERS.get(family);

      if (describe == null) {
        throw new Error(`${family}: ${data.name} has no description and nothing writes one`);
      }
      // Written when read, in the reader's locale, out of the family's templates
      deriveLocalized(data, 'description', () => describe(item));
      registerItem(item, data);
    }
  }
  registerMachines();
}

/** Registers the items in English and the active locale, which is all a page shows */
export default async function loadItems(): Promise<void> {
  fillItems({ ...ENGLISH, ...(await readActiveText(OTHER)) });
}
