import registerAbilities from './abilities';
import registerBiomeSpawns from './biome';
import registerItems from './items';
import { registerMoves } from './moves';
import { registerSpecies } from './species';

/**
 * Fill every runtime registry at once, synchronously.
 *
 * The app does **not** call this: it registers the world at boot and
 * loads what a fight needs when something needs it, which is what
 * keeps two thirds of the data out of the first frame. See
 * [`world.ts`](./world.ts) and
 * [`battle-data.ts`](./battle-data.ts).
 *
 * What is left for this is everything that has no first frame to
 * protect: a test, a script, a tool that wants the whole dex in one
 * call. Importing it pulls every registry in eagerly, which is the
 * point of it and the reason nothing on the app's own path may
 * import it
 */
export default function registerGameData(): void {
  registerMoves();
  registerAbilities();
  registerSpecies();
  registerItems();
  registerBiomeSpawns();
}
