import {
  type LearnSetFile,
  type RecordFile,
  registerLearnSetRows,
  registerRecordRows,
} from './compact';
import registerTrueShadowSpecies from './true-shadow';

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

// The regions already loaded from their compact rows rather than their source
const COMPACT_RECORDS = import.meta.glob<RecordFile>(
  [
    './compact/gen-1.records.json',
    './compact/gen-2.records.json',
    './compact/gen-3.records.json',
    './compact/gen-4.records.json',
    './compact/gen-5.records.json',
    './compact/gen-6.records.json',
  ],
  {
    eager: true,
    import: 'default',
  },
);
const COMPACT_LEARN_SETS = import.meta.glob<LearnSetFile>(
  [
    './compact/gen-1.learnsets.json',
    './compact/gen-2.learnsets.json',
    './compact/gen-3.learnsets.json',
    './compact/gen-4.learnsets.json',
    './compact/gen-5.learnsets.json',
    './compact/gen-6.learnsets.json',
  ],
  {
    eager: true,
    import: 'default',
  },
);

export function registerSpecies(): void {
  registerRecordRows(COMPACT_RECORDS['./compact/gen-1.records.json']);
  registerLearnSetRows(COMPACT_LEARN_SETS['./compact/gen-1.learnsets.json']);
  registerRecordRows(COMPACT_RECORDS['./compact/gen-2.records.json']);
  registerLearnSetRows(COMPACT_LEARN_SETS['./compact/gen-2.learnsets.json']);
  registerRecordRows(COMPACT_RECORDS['./compact/gen-3.records.json']);
  registerLearnSetRows(COMPACT_LEARN_SETS['./compact/gen-3.learnsets.json']);
  registerRecordRows(COMPACT_RECORDS['./compact/gen-4.records.json']);
  registerLearnSetRows(COMPACT_LEARN_SETS['./compact/gen-4.learnsets.json']);
  registerRecordRows(COMPACT_RECORDS['./compact/gen-5.records.json']);
  registerLearnSetRows(COMPACT_LEARN_SETS['./compact/gen-5.learnsets.json']);
  registerRecordRows(COMPACT_RECORDS['./compact/gen-6.records.json']);
  registerLearnSetRows(COMPACT_LEARN_SETS['./compact/gen-6.learnsets.json']);
  // Last: each one is a copy of a counterpart that has to exist first
  registerTrueShadowSpecies();
}
