import { Items } from '../ids/items';
import type { Species } from '../ids/species';
import { canGigantamax } from '../moves/gmax-moves';

/**
 * Max Mushrooms: the Gigantamax Factor, given to one pokemon for good.
 *
 * Only a species with a Gigantamax form takes it, so an Eevee can and
 * a Vaporeon cannot. The factor stays through a trade and an evolution
 * all the same: an Eevee that has it and then evolves keeps it, and it
 * does nothing until something brings the line back to a shape that
 * can use it.
 */

export function isMaxMushrooms(item: Items): boolean {
  return item === Items.MaxMushrooms;
}

/** Whether the mushrooms would do anything for this pokemon */
export function takesGigantamaxFactor(caught: { species: Species; gigantamax: boolean }): boolean {
  return !caught.gigantamax && canGigantamax(caught.species);
}
