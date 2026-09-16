import registerOshawottSpecies from './oshawott';
import registerSnivySpecies from './snivy';
import registerTaoTrioSpecies from './tao-trio';
import registerTepigSpecies from './tepig';

export default function registerGen5Species(): void {
  registerSnivySpecies();
  registerTepigSpecies();
  registerOshawottSpecies();
  registerTaoTrioSpecies();
}
