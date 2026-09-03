import registerMudkipSpecies from './mudkip';
import registerTorchicSpecies from './torchic';
import registerTreeckoSpecies from './treecko';

export default function registerGen3Species(): void {
  registerTreeckoSpecies();
  registerTorchicSpecies();
  registerMudkipSpecies();
}
