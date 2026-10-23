import * as v from 'valibot';
import type { Items } from '../ids/items';
import type { Moves } from '../ids/moves';
import { ITEM_IDS, MOVE_IDS, SPECIES_IDS } from '../ids/names';
import type { Species } from '../ids/species';
import { idOf } from '../yaml';
import noblesFile from './nobles.yaml';

/**
 * Noble Pokémon, as Legends: Arceus had them: a frenzied lord of the
 * land that is calmed rather than beaten. The five Nobles of Hisui are
 * written out in `nobles.yaml`; every other final stage of a tile's biome is a Noble by
 * rule, so an arena in any biome holds somebody.
 */

const NOBLE = v.strictObject({ treasure: v.string(), burst: v.string() });

/** What each canon Noble leaves its calmers beside the purse, out of `nobles.yaml` */
export const CANON_NOBLES = new Map<Species, Items>();

/** The Frenzy burst each canon Noble unleashes */
export const CANON_BURSTS = new Map<Species, Moves>();

for (const [name, written] of Object.entries(v.parse(v.record(v.string(), NOBLE), noblesFile))) {
  const where = `nobles.yaml: ${name}`;
  const noble = idOf<Species>(SPECIES_IDS, name, where);

  CANON_NOBLES.set(noble, idOf<Items>(ITEM_IDS, written.treasure, where));
  CANON_BURSTS.set(noble, idOf<Moves>(MOVE_IDS, written.burst, where));
}

/**
 * How often an arena whose biome is home to a canon Noble holds one of
 * them rather than any final stage by rule. A share rather than a
 * weight, so a canon Noble turns up as often in a biome of many lines
 * as in a biome of few
 */
export const CANON_NOBLE_SHARE = 1 / 2;

/** The most Balms a player packs for one Noble raid, taken from the bag as it starts */
export const NOBLE_BALM_PACK = 3;

/** Whether the species is one of Hisui's five Nobles */
export function isCanonNoble(species: Species): boolean {
  return CANON_NOBLES.has(species);
}

/** What a calmed Noble leaves beside the purse and the Balms, if it is a canon one */
export function getNobleTreasure(species: Species): Items | null {
  return CANON_NOBLES.get(species) ?? null;
}
