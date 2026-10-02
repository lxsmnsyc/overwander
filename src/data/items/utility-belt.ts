import { Slots } from '../constants/slots';
import { Items } from '../ids/items';

/**
 * The Utility Belt: one more place for a pokemon to put something.
 *
 * It is the first thing in the game that changes what a catch has room
 * for. Everything else a pokemon is given is spent on what it already
 * has — a cap polishes the values it was born with, a vitamin fills the
 * effort it was going to fill anyway — and a belt widens the pokemon
 * instead, permanently and for one pokemon only.
 *
 * That is why it is found rather than stocked, and why the count it
 * moves is bounded: see `MAX_SLOTS`. A shop that sold belts would sell
 * every pokemon in the game a second held item, which is a different
 * game rather than a rarer one.
 */

/**
 * What a belt widens. It is written down rather than assumed because
 * the same shape would serve a fifth move or a second ability later,
 * and the item that does that should be its own item rather than this
 * one growing an argument
 */
export const UTILITY_BELT_SLOT = Slots.Item;

export function isUtilityBelt(item: Items): boolean {
  return item === Items.UtilityBelt;
}
