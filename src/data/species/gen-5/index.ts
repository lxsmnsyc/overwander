import registerBlitzleSpecies from './blitzle';
import registerLillipupSpecies from './lillipup';
import registerMunnaSpecies from './munna';
import registerOshawottSpecies from './oshawott';
import registerPatratSpecies from './patrat';
import registerPidoveSpecies from './pidove';
import registerPurrloinSpecies from './purrloin';
import registerSnivySpecies from './snivy';
import registerTepigSpecies from './tepig';

export default function registerGen5Species(): void {
  registerSnivySpecies();
  registerTepigSpecies();
  registerOshawottSpecies();
  registerPatratSpecies();
  registerLillipupSpecies();
  registerPurrloinSpecies();
  registerMunnaSpecies();
  registerPidoveSpecies();
  registerBlitzleSpecies();
}
