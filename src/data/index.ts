import registerAbilities from './abilities';
import registerBiomeSpawns from './biome';
import registerItems from './items';
import { registerMoves } from './moves';
import { registerSpecies } from './species';

/**
 * Fill every runtime registry. The data modules only describe
 * themselves — nothing is queryable until it is registered — so the
 * app calls this once at startup. Registration is an idempotent map
 * overwrite, so calling it again is harmless
 */
export default function registerGameData(): void {
  registerMoves();
  registerAbilities();
  registerSpecies();
  registerItems();
  registerBiomeSpawns();
}
