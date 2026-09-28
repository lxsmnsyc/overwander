import { COMPACT_REGIONS, type RecordFile, registerRecordRows } from './compact';

export {
  getBaseForms,
  getBaseSpecies,
  getEggBaseSpecies,
  getEggMoves,
  getFamilyName,
  getLearnableMoves,
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
  getLearnSet,
  isBaseForm,
  getGrowthRoads,
  isCosmeticForm,
} from './__create';
export type {
  EvolutionData,
  LearnSetData,
  SpeciesAbilityPools,
  SpeciesData,
  SpeciesEntry,
} from './__create';
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
export { getSeasonalCoat, getShoreForm, getWingPattern } from './met-forms';
export {
  TRUE_SHADOW_BONUS,
  TRUE_SHADOW_WEIGHT,
  getTrueShadow,
  getTrueShadowCounterpart,
  isTrueShadow,
  listTrueShadows,
  trueShadowName,
} from './true-shadow';

// Eager, since the world reads the records at boot. Learn sets are
// loaded apart, with the fight data: see learn-sets.ts
const RECORDS = import.meta.glob<RecordFile>('./compact/*.records.json', {
  eager: true,
  import: 'default',
});

/** The species records, without their learn sets */
export function registerSpecies(): void {
  for (const region of COMPACT_REGIONS) {
    registerRecordRows(RECORDS[`./compact/${region}.records.json`]);
  }
}
