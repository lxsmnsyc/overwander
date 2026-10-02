import type { Items } from '../ids/items';
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
import { describeTreat } from './treats';
import { describeTypeBooster } from './type-boosters';
import { describeValuable } from './valuables';
import { describeVitamin } from './vitamins';
import { describeWing } from './wings';
import { describeZCrystal } from './z-crystals';
import registerMachines from './machines';
import { readItems } from './yaml';

export { getItemData, listItemsByType, registerItem } from './__create';
export type { ItemData } from './__create';
export { getTeachableMoves } from './machines';
export { FOSSIL_SPECIES, getSpeciesFossil, isFossil, listFossils } from './fossils';
export { FORM_ITEMS, getItemForms } from './form-items';
export { MEGA_STONES, getMegaStone, getStoneMega } from './mega-stones';
export { ITEM_TYPE_NAMES, ITEM_TYPE_ORDER } from './names';
export { WING_EFFORT, WING_STATS, isWing } from './wings';

/**
 * The families, in the order a shelf lists them: each family's items
 * come in the order its file writes them
 */
const ITEM_FAMILIES = [
  'balls',
  'apricorns',
  'berries',
  'medicine',
  'drinks',
  'treats',
  'stones',
  'trade-items',
  'type-boosters',
  'stat-boosters',
  'gear',
  'one-shots',
  'battle-items',
  'incenses',
  'trinkets',
  'power-items',
  'gems',
  'orbs',
  'plates',
  'drives',
  'memories',
  'z-crystals',
  'candy-items',
  'rare-candy',
  'bottle-caps',
  'mints',
  'utility-belt',
  'skill-book',
  'ability-items',
  'purifying-gem',
  'sacred-ash',
  'soothe-bell',
  'escape-rope',
  'portal-key',
  'key-items',
  'raid-items',
  'valuables',
  'heart-scale',
  'honey',
  'fossils',
  'form-items',
  'mega-stones',
  'wings',
  'vitamins',
] as const;

/**
 * The families whose lines follow their own tables, and the code that
 * writes each one out of its text file's templates
 */
const DESCRIBERS: Partial<Record<(typeof ITEM_FAMILIES)[number], (item: Items) => string>> = {
  'ability-items': describeAbilityItem,
  apricorns: describeApricorn,
  berries: describeBerry,
  'bottle-caps': describeBottleCap,
  drinks: describeDrink,
  drives: describeDrive,
  'escape-rope': describeEscapeRope,
  gems: describeGem,
  honey: describeHoney,
  incenses: describeIncense,
  'key-items': describeKeyItem,
  medicine: describeMedicine,
  'mega-stones': describeMegaStone,
  memories: describeMemory,
  mints: describeMintItem,
  plates: describePlate,
  'power-items': describePowerItem,
  'purifying-gem': describePurifyingGem,
  'rare-candy': describeRareCandy,
  treats: describeTreat,
  'type-boosters': describeTypeBooster,
  valuables: describeValuable,
  vitamins: describeVitamin,
  wings: describeWing,
  'z-crystals': describeZCrystal,
};

/**
 * The machines are generated from the species learn sets, so the
 * species and their moves have to be registered before this runs
 */
export default function registerItems(): void {
  // Written as YAML, a file per family (see ./yaml.ts)
  const { items, text } = readItems(
    {
      records: import.meta.glob('./records/*.yaml', { eager: true, import: 'default' }),
      text: import.meta.glob('../text/en/items/*.yaml', { eager: true, import: 'default' }),
    },
    ITEM_FAMILIES,
  );

  for (const [family, words] of text) {
    registerItemTemplates(family, words.templates);
  }
  for (const { item, data } of items) {
    registerItem(item, data);
  }
  // Once every name is in, since a line may name another item
  for (const { family, item, data } of items) {
    if (data.description === '') {
      const describe = DESCRIBERS[family as (typeof ITEM_FAMILIES)[number]];

      if (describe == null) {
        throw new Error(`${family}: ${data.name} has no description and nothing writes one`);
      }
      registerItem(item, { ...data, description: describe(item) });
    }
  }
  registerMachines();
}
