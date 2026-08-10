import World from './world';

/**
 * The world every player shares. The seed comes from the
 * environment so a deployment can run its own world; the fallback
 * keeps development and tests on one predictable world
 */
export const WORLD_SEED = import.meta.env.VITE_WORLD_SEED || 'overworld';

let world: World | null = null;

/**
 * The shared world instance. Built lazily and reused, because the
 * three climate noise channels are worth deriving only once
 */
export default function getWorld(): World {
  world ??= new World(WORLD_SEED);
  return world;
}
