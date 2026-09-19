import registerBlitzleSpecies from './blitzle';
import registerCottoneeSpecies from './cottonee';
import registerDrilburSpecies from './drilbur';
import registerLillipupSpecies from './lillipup';
import registerMunnaSpecies from './munna';
import registerOshawottSpecies from './oshawott';
import registerPatratSpecies from './patrat';
import registerPetililSpecies from './petilil';
import registerPidoveSpecies from './pidove';
import registerRoggenrolaSpecies from './roggenrola';
import registerSewaddleSpecies from './sewaddle';
import registerPurrloinSpecies from './purrloin';
import registerSnivySpecies from './snivy';
import registerTepigSpecies from './tepig';
import registerVenipedeSpecies from './venipede';
import registerWoobatSpecies from './woobat';

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
  registerRoggenrolaSpecies();
  registerWoobatSpecies();
  registerDrilburSpecies();
  registerSewaddleSpecies();
  registerVenipedeSpecies();
  registerCottoneeSpecies();
  registerPetililSpecies();
}
