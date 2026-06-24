import { Species } from './ids/species';

export interface PokemonInstance {
  // Pokemon species
  species: Species;

  // flags
  isShiny: boolean;
}
