import { registerSpecies as registerSpeciesData } from './__create';
import registerMegaSpecies from './megas';
import registerTrueShadowSpecies from './true-shadow';
import { readSpecies } from './yaml';

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
  findSpeciesData,
  getSpeciesForms,
  getWornForms,
  isWornForm,
  getTeachableMoves,
  getHabitat,
  isBaseForm,
  getGrowthRoads,
  isCosmeticForm,
} from './__create';
export type {
  EvolutionData,
  LearnSetData,
  SpeciesAbilityPools,
  SpeciesData,
  SpeciesRank,
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
  getFeaturedFamilies,
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
export { getSeasonalCoat, getShoreForm, getWingPattern } from './forms';
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
  // Written as YAML, a folder per field and a block of families per file (see ./yaml.ts)
  const read = readSpecies({
    world: import.meta.glob('./world/**/*.yaml', { eager: true, import: 'default' }),
    stats: import.meta.glob('./stats/**/*.yaml', { eager: true, import: 'default' }),
    abilities: import.meta.glob('./abilities/**/*.yaml', { eager: true, import: 'default' }),
    learnsets: import.meta.glob('./learnsets/**/*.yaml', { eager: true, import: 'default' }),
    text: import.meta.glob('../text/en/species/**/*.yaml', { eager: true, import: 'default' }),
  });

  for (const [species, data] of read) {
    registerSpeciesData(species, data);
  }
  // Last: each one is a copy of a counterpart that has to exist first
  registerMegaSpecies();
  registerTrueShadowSpecies();
}
