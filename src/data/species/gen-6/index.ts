import registerChespinSpecies from './chespin';
import registerFennekinSpecies from './fennekin';
import registerFroakieSpecies from './froakie';
import registerBunnelbySpecies from './bunnelby';
import registerFletchlingSpecies from './fletchling';
import registerScatterbugSpecies from './scatterbug';

/** Kalos, as far as it is written */
export default function registerGen6Species(): void {
  registerChespinSpecies();
  registerFennekinSpecies();
  registerFroakieSpecies();
  registerBunnelbySpecies();
  registerFletchlingSpecies();
  registerScatterbugSpecies();
}
