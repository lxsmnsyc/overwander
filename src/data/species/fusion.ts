import { Items } from '../ids/items';
import { Species } from '../ids/species';

/**
 * A fusion is two pokemon standing as one: the husk takes the shape
 * and the stats, the dragon folded into it is kept out of sight, and
 * the splicers put the pair together and take them apart again.
 *
 * Only Kyurem does this, so the table is small, but everything that
 * asks about a fusion asks here rather than naming the three species
 */

/** What the pair is joined and parted with, and never spent */
export const FUSION_ITEM = Items.DnaSplicers;

/** The shape a folded dragon puts the husk into */
const FUSED_SHAPES = new Map<Species, Species>([
  [Species.Zekrom, Species.KyuremBlack],
  [Species.Reshiram, Species.KyuremWhite],
]);

/** Which dragon is inside each fused shape */
const FOLDED_DRAGONS = new Map<Species, Species>([
  [Species.KyuremBlack, Species.Zekrom],
  [Species.KyuremWhite, Species.Reshiram],
]);

/** The one pokemon another can be folded into */
export const FUSION_HUSK = Species.Kyurem;

/** Whether this shape has a dragon inside it */
export function isFusedSpecies(species: Species): boolean {
  return FOLDED_DRAGONS.has(species);
}

/** The dragon this shape holds, or null where it holds none */
export function getFoldedDragon(species: Species): Species | null {
  return FOLDED_DRAGONS.get(species) ?? null;
}

/** The shape folding this dragon in would make, or null for anything else */
export function getFusedShape(dragon: Species): Species | null {
  return FUSED_SHAPES.get(dragon) ?? null;
}

/** The dragon a shape asks for, read the way the fusion route names it */
export function getFusionPartner(into: Species): Species | null {
  return getFoldedDragon(into);
}
