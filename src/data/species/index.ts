import registerGen1Species from './gen-1';

export {
  getSpeciesAbilities,
  getSpeciesAbilityPools,
  getSpeciesByBiome,
  getSpeciesData,
} from './__create';
export type { EvolutionData, LearnSetData, SpeciesAbilityPools, SpeciesData } from './__create';
export {
  SUPPORTED_METHODS,
  getAvailableEvolutions,
  getConsumedItem,
  meetsEvolutionCriteria,
} from './evolution';
export type { EvolutionContext } from './evolution';

export function registerSpecies(): void {
  registerGen1Species();
}
