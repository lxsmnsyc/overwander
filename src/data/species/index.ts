import registerGen1Species from './gen-1';

export { getSpeciesAbilities, getSpeciesData } from './__create';
export type { EvolutionData, LearnSetData, SpeciesData } from './__create';

export function registerSpecies(): void {
  registerGen1Species();
}
