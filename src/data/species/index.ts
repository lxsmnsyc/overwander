import { registerBulbasaurSpecies } from './bulbasaur';
import { registerCharmanderSpecies } from './charmander';

export { getSpeciesData } from './__create';

export function registerSpecies() {
  registerBulbasaurSpecies();
  registerCharmanderSpecies();
}
