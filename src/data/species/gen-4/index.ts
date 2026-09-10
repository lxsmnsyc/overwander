import registerChimcharSpecies from './chimchar';
import registerPiplupSpecies from './piplup';
import registerTurtwigSpecies from './turtwig';

/**
 * Sinnoh, in dex order
 */
export default function registerGen4Species(): void {
  registerTurtwigSpecies();
  registerChimcharSpecies();
  registerPiplupSpecies();
}
