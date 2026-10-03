import registerRowletSpecies from './rowlet';
import registerLittenSpecies from './litten';
import registerPopplioSpecies from './popplio';

/** Alola, as far as it is written */
export default function registerGen7Species(): void {
  registerRowletSpecies();
  registerLittenSpecies();
  registerPopplioSpecies();
}
