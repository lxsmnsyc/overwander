import { PokemonFlags, hasFlag } from '../data/constants/flags';
/**
 * What candy is worth, apart from the store that holds it. The
 * privileged server pays candy out and spends it, and the client
 * displays the same numbers, so the rules live where both can read
 * them without importing each other
 */

/**
 * What one catch is worth in candies, and what the family's own day
 * multiplies that to — the same fourfold bonus the species day gives
 * the spawn pool
 */
export const CANDY_PER_CATCH = 1;
export const SPECIES_DAY_CANDY_BOOST = 4;

/**
 * What one level costs in candies. A shadow is harder to raise: the
 * Shadow ability it keeps is paid for twice over at every level
 */
export const CANDY_PER_LEVEL = 1;
export const SHADOW_CANDY_MULTIPLIER = 2;

/**
 * What raising this catch by one level costs
 */
export default function getCandyCost(caught: { flags: number }): number {
  return hasFlag(caught.flags, PokemonFlags.Shadow)
    ? CANDY_PER_LEVEL * SHADOW_CANDY_MULTIPLIER
    : CANDY_PER_LEVEL;
}
