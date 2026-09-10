import registerBidoofSpecies from './bidoof';
import registerChimcharSpecies from './chimchar';
import registerCranidosSpecies from './cranidos';
import registerKricketotSpecies from './kricketot';
import registerPiplupSpecies from './piplup';
import registerShieldonSpecies from './shieldon';
import registerShinxSpecies from './shinx';
import registerStarlySpecies from './starly';
import registerTurtwigSpecies from './turtwig';

/**
 * Sinnoh, in dex order
 */
export default function registerGen4Species(): void {
  registerTurtwigSpecies();
  registerChimcharSpecies();
  registerPiplupSpecies();
  registerStarlySpecies();
  registerBidoofSpecies();
  registerKricketotSpecies();
  registerShinxSpecies();
  registerCranidosSpecies();
  registerShieldonSpecies();
}
