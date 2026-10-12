import { STAT_ORDER, type Stats } from '../constants/stats';
import { isLegendarySpecies, isMythicalSpecies } from '../biome/__create';
import type { Species } from '../ids/species';
import { getSpeciesData, isWornForm } from '../species/__create';
import { isTrueShadow } from '../species/true-shadow';
import { isUltraBeast } from '../species/ultra-beasts';

/**
 * Alpha Pokémon, as Legends: Arceus had them: an oversized wild pokemon
 * of any stage, standing on a landmark of its own and calling its own
 * kind to its side as it is worn down.
 */

/** How much bigger an Alpha is than its species, the way a Totem by rule is */
export const ALPHA_HEIGHT_SCALE = 2;
export const ALPHA_WEIGHT_SCALE = 4;

/** How many of its own kind an Alpha keeps at its side */
export const ALPHA_COPIES = 6;

/** How many of a caught Alpha's stats are perfect, chosen at random */
export const ALPHA_PERFECT_STATS = 3;

/**
 * Whether the species can stand as an Alpha: anything met rather than
 * worn, at any stage, but none of the kinds that hold lairs of their
 * own (legendaries, mythicals, Ultra Beasts and true shadows)
 */
export function isAlphaSpecies(species: Species): boolean {
  return (
    !isWornForm(species) &&
    !isLegendarySpecies(species) &&
    !isMythicalSpecies(species) &&
    !isUltraBeast(species) &&
    !isTrueShadow(species)
  );
}

/** How tall and how heavy an Alpha of this species stands, in meters and kilograms */
export function getAlphaSize(species: Species): { height: number; weight: number } {
  const data = getSpeciesData(species);

  return { height: data.height * ALPHA_HEIGHT_SCALE, weight: data.weight * ALPHA_WEIGHT_SCALE };
}

/**
 * The stats a caught Alpha has perfect: `ALPHA_PERFECT_STATS` distinct
 * ones, drawn without replacement from `random`
 */
export function pickAlphaPerfectStats(random: () => number): Set<Stats> {
  const left = [...STAT_ORDER];
  const picked = new Set<Stats>();

  while (picked.size < ALPHA_PERFECT_STATS) {
    const [stat] = left.splice(Math.floor(random() * left.length), 1);

    picked.add(stat);
  }
  return picked;
}
