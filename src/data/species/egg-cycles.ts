import type { Species } from '../ids/species';
import { getBaseSpecies, getSpeciesData } from './__create';

/**
 * How long a species' egg takes to open, in hatch cycles.
 *
 * A cycle is the mainline's own unit, and the figures below are its
 * figures: a Magikarp is the cheapest egg in the game and a Mewtwo the
 * dearest, with most of the dex sitting on the same middling number.
 * Only the exceptions are written down, as `egg-cycles:` in the
 * species' `species/stats/` file. Anything absent takes
 * `DEFAULT_EGG_CYCLES`, which is what the great majority take.
 *
 * What a cycle is worth in steps is
 * [`src/auth/egg.ts`](../../auth/egg.ts)'s business, not this table's:
 * this is the shape of the curve, and that file decides how far a
 * player has to walk along it.
 *
 * Only the stage a line hatches at needs an entry, since an egg is
 * always the first stage of its line
 */
export const DEFAULT_EGG_CYCLES = 20;

/**
 * How many cycles this species' egg takes.
 *
 * Asked of the stage that hatches rather than of the species handed
 * in, because a line runs on one figure the whole way up and a raid
 * can hand out an egg of something already evolved
 */
export function getEggCycles(species: Species): number {
  return getSpeciesData(getBaseSpecies(species)).eggCycles ?? DEFAULT_EGG_CYCLES;
}
