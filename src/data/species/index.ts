import { registerBulbasaurSpecies } from './bulbasaur';
import { registerCaterpieSpecies } from './caterpie';
import { registerCharmanderSpecies } from './charmander';
import { registerSquirtleSpecies } from './squirtle';

export { getSpeciesData } from './__create';

export function registerSpecies() {
  registerBulbasaurSpecies();
  registerCharmanderSpecies();
  registerSquirtleSpecies();
  registerCaterpieSpecies();
}
