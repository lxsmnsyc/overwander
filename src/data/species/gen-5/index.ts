import registerOshawottSpecies from './oshawott';
import registerSnivySpecies from './snivy';
import registerTepigSpecies from './tepig';

export default function registerGen5Species(): void {
  registerSnivySpecies();
  registerTepigSpecies();
  registerOshawottSpecies();
}
