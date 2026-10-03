import registerRowletSpecies from './rowlet';
import registerLittenSpecies from './litten';
import registerPopplioSpecies from './popplio';
import registerPikipekSpecies from './pikipek';
import registerYungoosSpecies from './yungoos';
import registerGrubbinSpecies from './grubbin';

/** Alola, as far as it is written */
export default function registerGen7Species(): void {
  registerRowletSpecies();
  registerLittenSpecies();
  registerPopplioSpecies();
  registerPikipekSpecies();
  registerYungoosSpecies();
  registerGrubbinSpecies();
}
