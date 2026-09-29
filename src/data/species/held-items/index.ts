import type { Items } from '../../ids/items';
import type { Species } from '../../ids/species';
import GEN_1_HELD_ITEMS from './gen-1';
import GEN_2_HELD_ITEMS from './gen-2';
import GEN_3_HELD_ITEMS from './gen-3';
import GEN_4_HELD_ITEMS from './gen-4';
import GEN_5_HELD_ITEMS from './gen-5';
import GEN_6_HELD_ITEMS from './gen-6';

/**
 * What a wild pokemon is carrying when it is met.
 *
 * The mainline has given the same species different things to hold in
 * different generations — a Grimer carried a Nugget in Johto and
 * Black Sludge from Sinnoh on — so this table is the union of all of
 * them rather than any one game's list, cut to the three best for
 * each species. Where a species has fewer than three worth carrying,
 * it carries fewer.
 *
 * The slots are ranked by what the item is worth, because half of
 * every meeting hands the common one over: a berry or a small find
 * there, the type item or the trade item at a twentieth, and the
 * signature item — the one that is only worth anything in those hands
 * — at a hundredth. A market-priced item in the common slot would pay
 * a player more for walking than for playing. The roll is in
 * [`src/overworld/encounter/traits.ts`](../../../overworld/encounter/traits.ts), off
 * the same trait value the nature and the ability come from, so two
 * players meeting one spawn see it holding the same thing.
 */

/**
 * The odds of each slot. The first two are the mainline's own; the
 * third is this game's, and it exists because the union above gives
 * some species a signature item worth more than a 5% slot should hand
 * out
 */
export const WILD_HELD_COMMON = 0.5;
export const WILD_HELD_UNCOMMON = 0.05;
export const WILD_HELD_RARE = 0.01;

export interface WildHeldItems {
  /**
   * Carried by half of them, and worth the least
   */
  common?: Items;
  /**
   * One in twenty
   */
  uncommon?: Items;
  /**
   * One in a hundred, and always the one worth having
   */
  rare?: Items;
}

/**
 * Every species that carries anything, one file per generation. A line
 * holds what its first form holds, so a species reads the same all the
 * way up, and a later stage of an older line copies that line's entry
 */
const SPECIES_HELD_ITEMS = new Map<Species, WildHeldItems>([
  ...GEN_1_HELD_ITEMS,
  ...GEN_2_HELD_ITEMS,
  ...GEN_3_HELD_ITEMS,
  ...GEN_4_HELD_ITEMS,
  ...GEN_5_HELD_ITEMS,
  ...GEN_6_HELD_ITEMS,
]);

export function getSpeciesHeldItems(species: Species): WildHeldItems | undefined {
  return SPECIES_HELD_ITEMS.get(species);
}

/**
 * The item a roll of 0 to 1 lands on, or null for an empty-handed
 * meeting.
 *
 * Rarest slot first, cumulative: a species with all three hands over
 * the rare one on the bottom hundredth of the roll, the uncommon on
 * the twentieth above that, and the common one on the half above
 * those.
 *
 * `boost` widens the two rare slots and leaves the common one where
 * it is, for a player walking with something that finds what a
 * pokemon is carrying. Widening all three would only saturate: the
 * common slot is already half of every meeting, so doubling it hands
 * over something every time and the thing actually worth looking for
 * would be no likelier than before
 */
export function pickHeldItem(
  held: WildHeldItems | undefined,
  roll: number,
  boost = 1,
): Items | null {
  if (held == null) {
    return null;
  }

  let threshold = 0;

  if (held.rare != null) {
    threshold += WILD_HELD_RARE * boost;

    if (roll < threshold) {
      return held.rare;
    }
  }
  if (held.uncommon != null) {
    threshold += WILD_HELD_UNCOMMON * boost;

    if (roll < threshold) {
      return held.uncommon;
    }
  }
  if (held.common != null) {
    threshold += WILD_HELD_COMMON;

    if (roll < threshold) {
      return held.common;
    }
  }
  return null;
}
