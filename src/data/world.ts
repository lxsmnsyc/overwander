import registerBiomeSpawns from './biome';
import { registerSpecies } from './species';

/**
 * What the world needs before it can draw itself: the species and the
 * pools that decide which of them is standing in a given field at a
 * given hour.
 *
 * It is registered at boot, synchronously, because the overworld is
 * the first thing on screen and every chunk it derives asks who lives
 * there. Everything a **fight** needs — the moves, the abilities and
 * the items — is loaded separately, when something actually needs it:
 * see [`battle-data.ts`](./battle-data.ts)
 */
export default function registerWorldData(): void {
  registerSpecies();
  registerBiomeSpawns();
}
