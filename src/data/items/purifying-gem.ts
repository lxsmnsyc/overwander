import { PURIFIED_FRIENDSHIP_BONUS } from '../constants/friendship';
import { MAX_IV, STAT_ORDER, getIV, setIV } from '../constants/stats';
import Abilities from '../ids/abilities';
import { Items } from '../ids/items';
import type { Species } from '../ids/species';
import { isTrueShadow } from '../species/true-shadow';
import { itemText } from './__create';

/**
 * The Purifying Gem: the only thing that takes a shadow off a pokemon.
 *
 * A shadow catch comes out of a shadow raid carrying the Shadow
 * ability for good and paying twice the candy at every level. That is
 * the trade — a stronger thing to have caught, dearer to raise — and
 * until now it was permanent. The gem undoes it: the ability becomes
 * `Purified`, which does nothing at all, the levelling cost drops back
 * to what any other pokemon pays, and the pokemon comes out of it a
 * little better than it went in.
 *
 * The mark is left on purpose. `Purified` is cosmetic, and it is the
 * only record on the pokemon itself that it was ever a shadow — a
 * player who purifies one has changed what it costs, not what it was.
 */

/**
 * What purifying adds to every one of the six values. It is small, and
 * it is the only reason to purify a pokemon you were going to raise
 * anyway: a gem is worth spending on a shadow worth keeping
 */
export const PURIFY_IV_BOOST = 2;

/**
 * Whether the item is the gem
 */
export function isPurifyingGem(item: Items): boolean {
  return item === Items.PurifyingGem;
}

/**
 * Whether the pokemon is one the gem has anything to do: a shadow, and
 * nothing else. Purifying what is already purified would spend a rare
 * item on nothing.
 *
 * A true shadow is refused however dark it is. It is not a pokemon
 * with something done to it, so there is nothing to undo and no
 * counterpart underneath for it to turn back into
 */
export function isPurifiable(caught: { shadow: boolean; species: Species }): boolean {
  return caught.shadow && !isTrueShadow(caught.species);
}

/**
 * The values a purified pokemon keeps: every stat two higher than it
 * was, and none of them past the cap. A stat already at 30 gains one
 * rather than overshooting
 */
export function purifyIVs(ivs: number): number {
  let purified = ivs;

  for (const stat of STAT_ORDER) {
    purified = setIV(purified, stat, Math.min(MAX_IV, getIV(ivs, stat) + PURIFY_IV_BOOST));
  }
  return purified;
}

/**
 * The abilities it walks away with: the Shadow ability becomes
 * `Purified` where it stands, so the rest of what it has — the one it
 * rolled — is left exactly where it was
 */
export function purifyAbilities(abilities: Abilities[]): Abilities[] {
  const purified: Abilities[] = [];

  for (const ability of abilities) {
    purified.push(ability === Abilities.Shadow ? Abilities.Purified : ability);
  }
  return purified;
}

export function describePurifyingGem(item: Items): string {
  if (item !== Items.PurifyingGem) {
    throw new Error(`Item #${item} is not the Purifying Gem`);
  }
  return itemText('purifying-gem', 'gem', {
    boost: PURIFY_IV_BOOST,
    max: MAX_IV,
    friendship: PURIFIED_FRIENDSHIP_BONUS,
  });
}
