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
 * than a level of a Rattata, so the reward is the rarity band the
 * spawn pools sort a species into, counted from one. The bottom of a
 * three-stage line pays one, a legendary pays seven, and the bands
 * between them pay what they are worth.
 *
 * It is also what makes the rarer end of the dex worth chasing twice:
 * the pokemon, and the candies that raise the rest of its family
 */
export const CANDY_BY_RARITY: Record<SpawnRarity, number> = {
  [SpawnRarity.Base]: 1,
  [SpawnRarity.Uncommon]: 2,
  [SpawnRarity.Rare]: 3,
  [SpawnRarity.Scarce]: 4,
  [SpawnRarity.Elusive]: 5,
  [SpawnRarity.Prized]: 6,
  [SpawnRarity.Special]: 7,
  // A rung above a legendary: one relic, one fight, one of them
  [SpawnRarity.Mythical]: 8,
};

/**
 * What the family's own day multiplies a catch to — the same fourfold
 * bonus the species day gives the spawn pool
 */
export const SPECIES_DAY_CANDY_BOOST = 4;

/**
 * What meeting this species pays in its family's candy, before any
 * bonus
 */
export function getCatchCandy(species: Species): number {
  return CANDY_BY_RARITY[getSpawnRarity(species)];
}

/**
 * How many levels one candy of the release reward stands for
 */
export const RELEASE_CANDY_LEVELS = 25;

/**
 * What letting a pokemon go pays in its family's candy.
 *
 * The level rather than the rarity: what a released pokemon is worth
 * is the raising that went into it, since that is what the candy
 * bought and what the next one will need. Four bands of 25 levels, so
 * anything from 76 up pays 4 and a fresh catch pays 1. It is a
 * fraction of what a level cost, which is the point: releasing is
 * somewhere for a spare pokemon to go, never a way to farm candy
 */
export function getReleaseCandy(caught: { level: number }): number {
  return Math.max(1, Math.ceil(caught.level / RELEASE_CANDY_LEVELS));
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
