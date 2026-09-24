import registerGen1Species from './gen-1';
import registerGen2Species from './gen-2';
import registerGen3Species from './gen-3';
import registerGen4Species from './gen-4';
import registerGen5Species from './gen-5';
import registerGen6Species from './gen-6';
import registerMegaSpecies from './megas';
import registerTrueShadowSpecies from './true-shadow';

export {
  getBaseForms,
  getBaseSpecies,
  getEggBaseSpecies,
  getEggMoves,
  getFamilyName,
  getLearnableMoves,
  getReachableMoves,
  getLevelUpMoves,
  getMovesLearnedAt,
  getMovesLearnedBetween,
  getRegisteredFamilies,
  getRegisteredSpecies,
  getSpeciesAbilities,
  getSpeciesAbilityPools,
  getSpeciesByBiome,
  getSpeciesData,
  getSpeciesForms,
  getWornForms,
  isWornForm,
  getTeachableMoves,
  getHabitat,
  isBaseForm,
} from './__create';
export type { EvolutionData, LearnSetData, SpeciesAbilityPools, SpeciesData } from './__create';
export { DEFAULT_EGG_CYCLES, getEggCycles } from './egg-cycles';
export {
  SPECIES_DAY_CATCH_BOOST,
  SPECIES_DAY_HIDDEN_ABILITY_BOOST,
  SPECIES_DAY_SHINY_BOOST,
  SPECIES_DAY_STEP_BOOST,
  SPECIES_DAY_WEIGHT_BOOST,
  getDayOfYear,
  getDaysInYear,
  getFeaturedFamily,
  isFeaturedSpecies,
} from './day';
export {
  SUPPORTED_METHODS,
  canEverEvolve,
  coversHandover,
  coveredByHandover,
  getAvailableEvolutions,
  getShedEvolutions,
  getConsumedItem,
  getSpentHeldItem,
  isFullyEvolved,
  lineEvolvesByItem,
  meetsEvolutionCriteria,
  settleHandover,
} from './evolution';
export type { EvolutionContext, Handover } from './evolution';
export { REGIONS, REGION_NAMES, getSpeciesByRegion, getSpeciesRegion } from './regions';
export { getShoreForm } from './gen-4/shellos';
export { getWingPattern } from './gen-6/scatterbug';
export { getSeasonalCoat } from './gen-5/deerling';
export {
  TRUE_SHADOW_BONUS,
  TRUE_SHADOW_WEIGHT,
  getTrueShadow,
  getTrueShadowCounterpart,
  isTrueShadow,
  listTrueShadows,
  trueShadowName,
} from './true-shadow';
export { getMegaBase, isMegaSpecies, listMegas } from './megas';

export function registerSpecies(): void {
  registerGen1Species();
  registerGen2Species();
  registerGen3Species();
  registerGen4Species();
  registerGen5Species();
  registerGen6Species();
  // Last: each one is a copy of a counterpart that has to exist first
  registerMegaSpecies();
  registerTrueShadowSpecies();
}
