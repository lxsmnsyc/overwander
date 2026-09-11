import { ItemFlags, ItemTypes, Items } from '../ids/items';
import { Species } from '../ids/species';
import { registerItem } from './__create';

/**
 * The fossils: an extinct pokemon, still in the rock.
 *
 * Each one names exactly one species, and reviving it is the **only**
 * way that species is ever met: nothing that comes out of a fossil
 * spawns in the world any more, which is what makes them worth
 * carrying rather than a curiosity beside the nuggets.
 *
 * A fossil is worth nothing to a vendor and cannot be bought from one:
 * it is dug out of the ground or bought off the Fossil Maniac, and
 * spent at the Fossil Scientist's bench. That is the Heart Scale's
 * bargain, an item with exactly one use and no price on it, for the
 * same reason: what paces a fossil should be walking and the window,
 * rather than a purse deep enough to buy the line outright.
 */

/**
 * What each fossil brings back. It is one species per fossil, and no
 * species is named by two, so the map reads both ways
 */
export const FOSSIL_SPECIES = new Map<Items, Species>([
  [Items.HelixFossil, Species.Omanyte],
  [Items.DomeFossil, Species.Kabuto],
  [Items.OldAmber, Species.Aerodactyl],
  [Items.RootFossil, Species.Lileep],
  [Items.ClawFossil, Species.Anorith],
]);

export function isFossil(item: Items): boolean {
  return FOSSIL_SPECIES.has(item);
}

/**
 * Every fossil there is, in the order the dex meets them
 */
export function listFossils(): Items[] {
  return [...FOSSIL_SPECIES.keys()];
}

/**
 * Which fossil brings this species back, or null for everything that
 * is met some other way. It is the map read backwards, which is
 * sound because no two fossils name the same species
 */
export function getSpeciesFossil(species: Species): Items | null {
  for (const [item, held] of FOSSIL_SPECIES) {
    if (held === species) {
      return item;
    }
  }
  return null;
}

const NAMES: { [key in Items]?: string } = {
  [Items.HelixFossil]: 'Helix Fossil',
  [Items.DomeFossil]: 'Dome Fossil',
  [Items.OldAmber]: 'Old Amber',
  [Items.RootFossil]: 'Root Fossil',
  [Items.ClawFossil]: 'Claw Fossil',
};

/**
 * The picture each one is drawn with. The `fossils` sheet names them
 * by the rock rather than by the item, so the word "fossil" is the
 * part that is dropped
 */
const ICONS: { [key in Items]?: string } = {
  [Items.HelixFossil]: 'fossils/helix',
  [Items.DomeFossil]: 'fossils/dome',
  [Items.OldAmber]: 'fossils/old-amber',
  [Items.RootFossil]: 'fossils/root',
  [Items.ClawFossil]: 'fossils/claw',
};

export default function registerFossils(): void {
  for (const item of FOSSIL_SPECIES.keys()) {
    registerItem(item, {
      name: NAMES[item] ?? 'Fossil',
      // What is in the rock is not written on it. The bench is where
      // a player finds out, and a description that named the species
      // would settle it before they ever paid for one
      description: 'Something ancient is still in the rock. Spent bringing it back.',
      type: ItemTypes.Fossil,
      icon: ICONS[item] ?? 'fossils/old-amber',
      // Spent when it is revived, and worth nothing to anybody else:
      // no vendor stocks one and no vendor takes one
      flags: ItemFlags.Consumable,
      buy: 0,
      sell: 0,
    });
  }
}
