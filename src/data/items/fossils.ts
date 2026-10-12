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
 * What each whole fossil brings back. It is one species per fossil,
 * and no species is named by two, so the map reads both ways
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

/**
 * Galar's fossils come in halves, and what comes out is the pair's
 * rather than either half's. Each pair names one species, and no
 * species is named twice here or in the map above
 */
export const FOSSIL_PAIRS: [top: Items, bottom: Items, species: Species][] = [
  [Items.FossilizedBird, Items.FossilizedDrake, Species.Dracozolt],
  [Items.FossilizedBird, Items.FossilizedDino, Species.Arctozolt],
  [Items.FossilizedFish, Items.FossilizedDrake, Species.Dracovish],
  [Items.FossilizedFish, Items.FossilizedDino, Species.Arctovish],
];

export const FOSSIL_TOPS: Items[] = [Items.FossilizedBird, Items.FossilizedFish];
export const FOSSIL_BOTTOMS: Items[] = [Items.FossilizedDrake, Items.FossilizedDino];

export function isFossilTop(item: Items): boolean {
  return FOSSIL_TOPS.includes(item);
}

export function isFossilBottom(item: Items): boolean {
  return FOSSIL_BOTTOMS.includes(item);
}

/** Half of a fossil, which revives only beside a half of the other kind */
export function isFossilHalf(item: Items): boolean {
  return isFossilTop(item) || isFossilBottom(item);
}

/** A fossil at all, whole or half */
export function isFossil(item: Items): boolean {
  return FOSSIL_SPECIES.has(item) || isFossilHalf(item);
}

/**
 * Every fossil there is, the whole ones in the order the dex meets
 * them and then the halves. The maniac's seeded offer draws from this
 * list, so a new fossil goes on the end
 */
export function listFossils(): Items[] {
  return [...FOSSIL_SPECIES.keys(), ...FOSSIL_TOPS, ...FOSSIL_BOTTOMS];
}

/**
 * What a top and a bottom bring back together, or null when the two
 * are not a pair. Either order is read, since the bench does not care
 * which half went down first
 */
export function getFossilPairSpecies(first: Items, second: Items): Species | null {
  for (const [top, bottom, species] of FOSSIL_PAIRS) {
    if ((first === top && second === bottom) || (first === bottom && second === top)) {
      return species;
    }
  }
  return null;
}

/** The halves this one pairs with: the bottoms for a top, the tops for a bottom */
export function getFossilPartners(half: Items): Items[] {
  if (isFossilTop(half)) {
    return FOSSIL_BOTTOMS;
  }
  if (isFossilBottom(half)) {
    return FOSSIL_TOPS;
  }
  return [];
}

/** Every species a bench brings back, from a whole fossil or a pair */
export function listRevivedSpecies(): Species[] {
  const species = [...FOSSIL_SPECIES.values()];

  for (const [, , revived] of FOSSIL_PAIRS) {
    species.push(revived);
  }
  return species;
}

/**
 * Which fossils bring this species back: one whole rock, or a top and
 * a bottom, or null for everything met some other way. Sound because
 * no species is named twice
 */
export function getSpeciesFossil(species: Species): Items[] | null {
  for (const [item, held] of FOSSIL_SPECIES) {
    if (held === species) {
      return [item];
    }
  }
  for (const [top, bottom, revived] of FOSSIL_PAIRS) {
    if (revived === species) {
      return [top, bottom];
    }
  }
  return null;
}
