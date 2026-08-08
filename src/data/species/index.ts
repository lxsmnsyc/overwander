import { registerBulbasaurSpecies } from './bulbasaur';
import { registerCharmanderSpecies } from './charmander';
import { registerSquirtleSpecies } from './squirtle';

export { getSpeciesData } from './__create';

export function registerSpecies() {
  registerBulbasaurSpecies();
  registerCharmanderSpecies();
  registerSquirtleSpecies();
}
