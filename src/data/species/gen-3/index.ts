import registerMudkipSpecies from './mudkip';
import registerPoochyenaSpecies from './poochyena';
import registerTorchicSpecies from './torchic';
import registerTreeckoSpecies from './treecko';
import registerZigzagoonSpecies from './zigzagoon';

export default function registerGen3Species(): void {
  registerTreeckoSpecies();
  registerTorchicSpecies();
  registerMudkipSpecies();
  registerPoochyenaSpecies();
  registerZigzagoonSpecies();
}
