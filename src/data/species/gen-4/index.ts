import registerBidoofSpecies from './bidoof';
import registerBronzorSpecies from './bronzor';
import registerBuizelSpecies from './buizel';
import registerBurmySpecies from './burmy';
import registerCherubiSpecies from './cherubi';
import registerBunearySpecies from './buneary';
import registerDrifloonSpecies from './drifloon';
import registerGibleSpecies from './gible';
import registerGlameowSpecies from './glameow';
import registerChimcharSpecies from './chimchar';
import registerCombeeSpecies from './combee';
import registerCranidosSpecies from './cranidos';
import registerKricketotSpecies from './kricketot';
import registerPiplupSpecies from './piplup';
import registerShellosSpecies from './shellos';
import registerShieldonSpecies from './shieldon';
import registerShinxSpecies from './shinx';
import registerStunkySpecies from './stunky';
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
  registerBurmySpecies();
  registerCombeeSpecies();
  registerBuizelSpecies();
  registerCherubiSpecies();
  registerDrifloonSpecies();
  registerBunearySpecies();
  registerGlameowSpecies();
  registerShellosSpecies();
  registerStunkySpecies();
  registerBronzorSpecies();
  registerGibleSpecies();
}
