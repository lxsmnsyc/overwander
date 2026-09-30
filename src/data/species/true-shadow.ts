import { STAT_ORDER } from '../constants/stats';
import { Species, getBaseFormSpecies, speciesDexNumber } from '../ids/species';
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
  [Species.Mewtwo, Species.MewtwoShadow],
  [Species.Regirock, Species.RegirockShadow],
  [Species.Regice, Species.RegiceShadow],
  [Species.Registeel, Species.RegisteelShadow],
  [Species.Latias, Species.LatiasShadow],
  [Species.Latios, Species.LatiosShadow],
  [Species.Kyogre, Species.KyogreShadow],
  [Species.Groudon, Species.GroudonShadow],
  [Species.Rayquaza, Species.RayquazaShadow],
]);

/**
 * The worn shapes a true shadow can take, keyed by its counterpart's
 * shape: a shadow Kyogre holding a Blue Orb reverts to its own Primal
 */
const SHADOW_SHAPES = new Map<Species, Species>([
  [Species.KyogrePrimal, Species.KyogreShadowPrimal],
  [Species.GroudonPrimal, Species.GroudonShadowPrimal],
  [Species.RayquazaMega, Species.RayquazaShadowMega],
]);

/** The same pairings read backwards, since no two counterparts share one */
const COUNTERPARTS = new Map<Species, Species>();
const SHAPE_COUNTERPARTS = new Map<Species, Species>();

for (const [counterpart, shadow] of TRUE_SHADOWS) {
  COUNTERPARTS.set(shadow, counterpart);
}
for (const [counterpart, shadow] of SHADOW_SHAPES) {
  SHAPE_COUNTERPARTS.set(shadow, counterpart);
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

/**
 * The shadow's version of a worn shape, or null where none is drawn.
 * A shape a true shadow cannot take in its own colours is not taken
 */
export function getTrueShadowShape(shape: Species): Species | null {
  return SHADOW_SHAPES.get(shape) ?? null;
}

/**
 * What a unit in this shape would be without the shadow: the
 * counterpart of a true shadow or of one of its worn shapes, or null
 * for anything that is not a shadow at all
 */
export function getShadowlessSpecies(species: Species): Species | null {
  return COUNTERPARTS.get(species) ?? SHAPE_COUNTERPARTS.get(species) ?? null;
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
  for (const [counterpart, shadow] of [...TRUE_SHADOWS, ...SHADOW_SHAPES]) {
    const base = getSpeciesData(counterpart);
    const stats = { ...base.stats };

    for (const stat of STAT_ORDER) {
      stats[stat] += TRUE_SHADOW_BONUS;
    }

    // A worn shape keeps its prefix: Primal Kyogre's is Primal XD-382
    const plain = getSpeciesData(getBaseFormSpecies(counterpart)).name;

    registerSpecies(shadow, {
      ...base,
      baseForm: false,
      name: base.name.replace(plain, trueShadowName(shadow)),
      stats,
      // Met in the dark and nowhere else, so no biome lists one and
      // no pool stages one: the sky is what decides, not the country
      biomes: [],
    });
  }
}
