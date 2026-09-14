import World, { Depth } from './world';

/**
 * The world every player shares. The seed comes from the
 * environment so a deployment can run its own world; the fallback
 * keeps development and tests on one predictable world
 */
export const WORLD_SEED = import.meta.env.VITE_WORLD_SEED || 'overworld';

let world: World | null = null;

/**
 * The shared world instance, at the layer asked for. Built lazily and
 * reused, because the noise channels are worth deriving only once,
 * and the two layers are one pair rather than two worlds: everything
 * underground is read off the same fields as the ground over it
 */
export default function getWorld(depth: Depth = Depth.Surface): World {
  world ??= new World(WORLD_SEED);
  return world.at(depth);
}
