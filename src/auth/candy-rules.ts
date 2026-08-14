import { SpawnRarity, getSpawnRarity } from '../data/biome';
import type { Species } from '../data/ids/species';

/**
 * What candy is worth, apart from the store that holds it. The
 * privileged server pays candy out and spends it, and the client
 * displays the same numbers, so the rules live where both can read
 * them without importing each other
 */

/**
 * What one catch is worth in candies, by how hard it was to meet.
 *
 * A candy is a level, and a level of a legendary is worth more work
 * than a level of a Rattata — so the reward is the rarity band the
 * spawn pools sort a species into, counted from one. A base-stage
 * pokemon pays one, a legendary pays five, and the bands between them
 * pay what they are worth.
 *
 * It is also what makes the rarer end of the dex worth chasing twice:
 * the pokemon, and the candies that raise the rest of its family
 */
export const CANDY_BY_RARITY: Record<SpawnRarity, number> = {
  [SpawnRarity.Base]: 1,
  [SpawnRarity.Uncommon]: 2,
  [SpawnRarity.Rare]: 3,
  [SpawnRarity.Prized]: 4,
  [SpawnRarity.Special]: 5,
};

/**
 * What the family's own day multiplies a catch to — the same fourfold
 * bonus the species day gives the spawn pool
 */
export const SPECIES_DAY_CANDY_BOOST = 4;

/**
 * What meeting this species pays in its family's candy, before any
 * bonus. Releasing one pays the same: what a pokemon is worth does
 * not depend on which end of the record it is being counted at
 */
export function getCatchCandy(species: Species): number {
  return CANDY_BY_RARITY[getSpawnRarity(species)];
}

/**
 * What one level costs in candies. A shadow is harder to raise: the
 * Shadow ability it keeps is paid for twice over at every level
 */
export const CANDY_PER_LEVEL = 1;
export const SHADOW_CANDY_MULTIPLIER = 2;

/**
 * What raising this catch by one level costs
 */
export default function getCandyCost(caught: { shadow: boolean }): number {
  return caught.shadow ? CANDY_PER_LEVEL * SHADOW_CANDY_MULTIPLIER : CANDY_PER_LEVEL;
}
