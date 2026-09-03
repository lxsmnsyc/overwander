import registerMudkipSpecies from './mudkip';
import registerPoochyenaSpecies from './poochyena';
import registerTorchicSpecies from './torchic';
import registerTreeckoSpecies from './treecko';
import registerWurmpleSpecies from './wurmple';
import registerZigzagoonSpecies from './zigzagoon';

export default function registerGen3Species(): void {
  registerTreeckoSpecies();
  registerTorchicSpecies();
  registerMudkipSpecies();
  registerPoochyenaSpecies();
  registerZigzagoonSpecies();
  registerWurmpleSpecies();
}
