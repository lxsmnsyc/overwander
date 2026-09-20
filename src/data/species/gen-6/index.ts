import registerChespinSpecies from './chespin';
import registerFennekinSpecies from './fennekin';
import registerFroakieSpecies from './froakie';

/** Kalos, as far as it is written */
export default function registerGen6Species(): void {
  registerChespinSpecies();
  registerFennekinSpecies();
  registerFroakieSpecies();
}
