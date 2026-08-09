import registerGen1Species from './gen-1';

export {
  getSpeciesAbilities,
  getSpeciesAbilityPools,
  getSpeciesByBiome,
  getSpeciesData,
} from './__create';
export type { EvolutionData, LearnSetData, SpeciesAbilityPools, SpeciesData } from './__create';

export function registerSpecies(): void {
  registerGen1Species();
}
