import registerLillipupSpecies from './lillipup';
import registerOshawottSpecies from './oshawott';
import registerPatratSpecies from './patrat';
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
}
