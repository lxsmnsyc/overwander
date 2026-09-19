import { STAT_ORDER } from '../constants/stats';
import { Species, speciesDexNumber } from '../ids/species';
import { getSpeciesData, registerSpecies } from './__create';

/**
 * The true shadows: a pokemon that is a shadow by what it is rather
 * than by what was done to it.
 *
 * Each one is a form of an ordinary species, drawn from the
 * collection's own Shadow slot, and the only differences from its
 * counterpart are the name, the ten points on every stat and the fact
 * that nothing can put it right. A shadow raid's prize is a pokemon
 * with something done to it; this is what was always down there.
 */

/** What a true shadow adds to each of its counterpart's stats */
export const TRUE_SHADOW_BONUS = 10;

/**
 * What one weighs in the special band of a dark day's pool, which is
 * what a legendary weighs in its own lair's biome
 */
export const TRUE_SHADOW_WEIGHT = 10;

/** Each counterpart and the true shadow of it */
const TRUE_SHADOWS = new Map<Species, Species>([
  [Species.Articuno, Species.ArticunoShadow],
  [Species.Zapdos, Species.ZapdosShadow],
  [Species.Moltres, Species.MoltresShadow],
]);

/** The same pairing read backwards, since no two counterparts share one */
const COUNTERPARTS = new Map<Species, Species>();

for (const [counterpart, shadow] of TRUE_SHADOWS) {
  COUNTERPARTS.set(shadow, counterpart);
}

/** The true shadow of this species, or null where none is drawn */
export function getTrueShadow(species: Species): Species | null {
  return TRUE_SHADOWS.get(species) ?? null;
}

/** Whether this is a true shadow rather than an ordinary pokemon */
export function isTrueShadow(species: Species): boolean {
  return COUNTERPARTS.has(species);
}

/** What a true shadow is the shadow of, or null for everything else */
export function getTrueShadowCounterpart(species: Species): Species | null {
  return COUNTERPARTS.get(species) ?? null;
}

/** Every true shadow there is, in the order the dex meets their counterparts */
export function listTrueShadows(): Species[] {
  return [...TRUE_SHADOWS.values()];
}

/**
 * The code name one goes by. They are not called after the thing they
 * are the shadow of: a player reads the dex number and nothing else
 */
export function trueShadowName(species: Species): string {
  return `XD-${speciesDexNumber(species)}`;
}

/**
 * Registered after every generation, since each one is read off the
 * counterpart that has to be registered first
 */
export default function registerTrueShadowSpecies(): void {
  for (const [counterpart, shadow] of TRUE_SHADOWS) {
    const base = getSpeciesData(counterpart);
    const stats = { ...base.stats };

    for (const stat of STAT_ORDER) {
      stats[stat] += TRUE_SHADOW_BONUS;
    }

    registerSpecies(shadow, {
      ...base,
      baseForm: false,
      name: trueShadowName(shadow),
      stats,
      // Met in the dark and nowhere else, so no biome lists one and
      // no pool stages one: the sky is what decides, not the country
      biomes: [],
    });
  }
}
