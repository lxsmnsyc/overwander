import registerGen1Species from './gen-1';

export {
  getBaseForms,
  getBaseSpecies,
  getEggMoves,
  getFamilyName,
  getLevelUpMoves,
  getMovesLearnedAt,
  getRegisteredSpecies,
  getSpeciesAbilities,
  getSpeciesAbilityPools,
  getSpeciesByBiome,
  getSpeciesData,
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
  getFeaturedFamily,
  isFeaturedSpecies,
} from './day';
export {
  SUPPORTED_METHODS,
  getAvailableEvolutions,
  getConsumedItem,
  isFullyEvolved,
  meetsEvolutionCriteria,
} from './evolution';
export type { EvolutionContext } from './evolution';
export { REGIONS, REGION_NAMES, getSpeciesByRegion, getSpeciesRegion } from './regions';

export function registerSpecies(): void {
  registerGen1Species();
}
