import registerKeldeoSpecies from './keldeo';
import registerOshawottSpecies from './oshawott';
import registerSnivySpecies from './snivy';
import registerSwordsOfJusticeSpecies from './swords-of-justice';
import registerTepigSpecies from './tepig';

export default function registerGen5Species(): void {
  registerSnivySpecies();
  registerTepigSpecies();
  registerOshawottSpecies();
  registerSwordsOfJusticeSpecies();
  registerKeldeoSpecies();
}
