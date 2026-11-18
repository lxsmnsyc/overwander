import type { Species } from '../ids/species';
import type { LearnSetData } from './__create';

/**
 * Where the learn sets are kept once they are loaded.
 *
 * They are most of the species data and nothing that draws the
 * overworld reads one, so the browser fetches them apart from the
 * rest (see [`learnset-data.ts`](../learnset-data.ts)) and the
 * server and tests register them at once. This module is the small
 * part that is always there: the map, and the read that says so when
 * it is asked too early.
 */
const LEARN_SETS = new Map<Species, LearnSetData>();

/** Whether the learn sets have been registered */
export function isLearnSetsLoaded(): boolean {
  return LEARN_SETS.size > 0;
}

/** Fill the store; a second call overwrites, so loading twice is harmless */
export function registerLearnSets(sets: Map<Species, LearnSetData>): void {
  for (const [species, set] of sets) {
    LEARN_SETS.set(species, set);
  }
}

/**
 * What a species learns, by level, machine and egg. Throws when asked
 * before the load, since an empty answer would pass for a species that
 * learns nothing
 */
export function getLearnSet(species: Species): LearnSetData {
  const found = LEARN_SETS.get(species);

  if (found != null) {
    return found;
  }
  if (LEARN_SETS.size === 0) {
    throw new Error(
      `The learn set of species ${species} was read before the learn sets were loaded: await ensureLearnSets() from src/data/learnset-data.ts, or register them with registerGameData()`,
    );
  }
  throw new Error(`Species ${species} has no learn set`);
}
