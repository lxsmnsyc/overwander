import { isMythicalSpecies } from '../biome';
import { Species } from '../ids/species';
import { ItemFlags, ItemTypes, Items } from '../ids/items';
import { registerItem } from './__create';

/**
 * Raid items: the relics that call a mythical out to be fought.
 *
 * The world never stages a mythical of its own — a landmark rolls
 * legendaries and rare species, and nothing else — so carrying the
 * relic is the only way to face one. Each item names exactly which
 * species it calls, and it is spent in the calling: the raid it opens
 * happens once, won or lost.
 *
 * They cannot be bought. A raid item is found in the special band of
 * the overworld item pool and nowhere else, which is what keeps a
 * mythical rare — see
 * [`src/data/overworld/item-pool.ts`](../overworld/item-pool.ts).
 */
export const RAID_ITEMS = new Map<Items, Species>([[Items.OldSeaMap, Species.Mew]]);

const NAMES: { [key in Items]?: string } = {
  [Items.OldSeaMap]: 'Old Sea Map',
};

/**
 * What the item calls, or null when it calls nothing. Only a mythical
 * answers: a relic naming anything else stages no raid
 */
export function getRaidSpecies(item: Items): Species | null {
  const species = RAID_ITEMS.get(item);

  return species != null && isMythicalSpecies(species) ? species : null;
}

/**
 * Register the raid items. They are key items rather than valuables —
 * nothing sells one — and consumable, since calling a mythical spends
 * the relic that called it
 */
export default function registerRaidItems(): void {
  for (const item of RAID_ITEMS.keys()) {
    registerItem(item, {
      name: NAMES[item] ?? `Item #${item}`,
      type: ItemTypes.KeyItem,
      // Used to open a raid, and gone once it has been
      flags: ItemFlags.Usable | ItemFlags.Consumable,
      buy: 0,
      sell: 0,
    });
  }
}
