import { listSpeciesHabitats, listTownHabitats } from '../biome';
import { FOSSIL_SPECIES } from '../items/fossils';
import type { Species } from '../ids/species';
import { getRegisteredSpecies, getSpeciesData } from '../species';
import { HONEY_TREE_SPECIES } from './honey-tree';

/** Everything a bench brings back out of a rock */
const REVIVED_SPECIES = new Set<Species>(FOSSIL_SPECIES.values());

/**
 * Who lays each one, for the few that hatch out of something other
 * than their own line: a Manaphy's egg is a Phione, and breeding one
 * is the only way to a Phione there is. Built on first ask, since the
 * registry has to be filled before it can be read
 */
let layers: Map<Species, Species[]> | null = null;

function getLayers(species: Species): Species[] {
  if (layers == null) {
    layers = new Map();

    for (const parent of getRegisteredSpecies()) {
      const laid = getSpeciesData(parent).eggSpecies;

      if (laid != null) {
        layers.set(laid, [...(layers.get(laid) ?? []), parent]);
      }
    }
  }
  return layers.get(species) ?? [];
}

/** Whether this one stage is met somewhere, its line left out of it */
function metAsItself(species: Species): boolean {
  return (
    listSpeciesHabitats(species).length > 0 ||
    listTownHabitats(species).length > 0 ||
    HONEY_TREE_SPECIES.has(species) ||
    REVIVED_SPECIES.has(species)
  );
}

/**
 * Whether a player could be walking one of these at all: met in the
 * wild, met on a town's street, shaken out of a honey tree, brought
 * back from a fossil or hatched out of something that was, at any
 * stage of its line.
 *
 * A line is often written before the world has anywhere to put it:
 * the art is unfinished, or the thing it is paired with does not
 * exist yet, so it is registered and left out of every pool.
 * Anything that builds an opponent's party asks this first, since a
 * trainer walking a pokemon nobody can meet is a pokemon a player
 * sees once and can never have
 */
export default function canMeetSpecies(species: Species, seen = new Set<Species>()): boolean {
  let stage: Species | undefined = species;

  while (stage != null && !seen.has(stage)) {
    seen.add(stage);

    if (metAsItself(stage)) {
      return true;
    }
    for (const parent of getLayers(stage)) {
      if (canMeetSpecies(parent, seen)) {
        return true;
      }
    }
    stage = getSpeciesData(stage).evolvesFrom;
  }
  return false;
}
