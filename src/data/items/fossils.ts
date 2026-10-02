import { Items } from '../ids/items';
import { Species } from '../ids/species';

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
  [Items.SkullFossil, Species.Cranidos],
  [Items.ArmorFossil, Species.Shieldon],
  [Items.CoverFossil, Species.Tirtouga],
  [Items.PlumeFossil, Species.Archen],
  [Items.JawFossil, Species.Tyrunt],
  [Items.SailFossil, Species.Amaura],
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
