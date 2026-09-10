import registerBidoofSpecies from './bidoof';
import registerChimcharSpecies from './chimchar';
import registerKricketotSpecies from './kricketot';
import registerPiplupSpecies from './piplup';
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
}
