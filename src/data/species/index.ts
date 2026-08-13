import registerGen1Species from './gen-1';

export {
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
} from './__create';
export type { EvolutionData, LearnSetData, SpeciesAbilityPools, SpeciesData } from './__create';
export {
  SPECIES_DAY_CATCH_BOOST,
  SPECIES_DAY_SHINY_BOOST,
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

export function registerSpecies(): void {
  registerGen1Species();
}
