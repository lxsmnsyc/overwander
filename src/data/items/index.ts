export { getItemData, listItemsByType, registerItem } from './__create';
export type { ItemData } from './__create';
export { getTeachableMoves } from './machines';
export {
  FOSSIL_PAIRS,
  FOSSIL_SPECIES,
  getFossilPairSpecies,
  getFossilPartners,
  getSpeciesFossil,
  isFossil,
  isFossilBottom,
  isFossilHalf,
  isFossilTop,
  listFossils,
  listRevivedSpecies,
} from './fossils';
export { FORM_ITEMS, getItemForms } from './form-items';
export { MEGA_STONES, getMegaStone, getStoneMega } from './mega-stones';
export { ZENITH_SHARDS } from './zenith-shards';
export { ITEM_TYPE_NAMES, ITEM_TYPE_ORDER } from './names';
export { WING_EFFORT, WING_STATS, isWing } from './wings';

/**
 * The families, in the order a shelf lists them: each family's items
 * come in the order its file writes them
 */
export const ITEM_FAMILIES = [
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
  'max-mushrooms',
  'tera-shards',
  'balms',
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
  'zenith-shards',
  'wings',
  'vitamins',
] as const;
