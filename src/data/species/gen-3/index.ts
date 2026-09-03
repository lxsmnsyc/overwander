import registerLotadSpecies from './lotad';
import registerMudkipSpecies from './mudkip';
import registerPoochyenaSpecies from './poochyena';
import registerSeedotSpecies from './seedot';
import registerTaillowSpecies from './taillow';
import registerTorchicSpecies from './torchic';
import registerTreeckoSpecies from './treecko';
import registerWingullSpecies from './wingull';
import registerWurmpleSpecies from './wurmple';
import registerZigzagoonSpecies from './zigzagoon';

export default function registerGen3Species(): void {
  registerTreeckoSpecies();
  registerTorchicSpecies();
  registerMudkipSpecies();
  registerPoochyenaSpecies();
  registerZigzagoonSpecies();
  registerWurmpleSpecies();
  registerLotadSpecies();
  registerSeedotSpecies();
  registerTaillowSpecies();
  registerWingullSpecies();
}
