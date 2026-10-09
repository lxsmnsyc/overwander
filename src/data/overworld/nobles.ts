import { Items } from '../ids/items';
import { Species } from '../ids/species';

/**
 * Noble Pokémon, as Legends: Arceus had them: a frenzied lord of the
 * land that is calmed rather than beaten. The five Nobles of Hisui are
 * written out; every other final stage of a tile's biome is a Noble by
 * rule, so an arena in any biome holds somebody.
 */

/**
 * The five canon Nobles, with what each leaves its calmers beside the
 * purse: Kleavor's own evolution stone, the stone the other four's
 * lines grow on in Hisui, and the ice Avalugg is made of
 */
export const CANON_NOBLES = new Map<Species, Items>([
  [Species.Kleavor, Items.BlackAugurite],
  [Species.LilligantHisui, Items.SunStone],
  [Species.ArcanineHisui, Items.FireStone],
  [Species.ElectrodeHisui, Items.LeafStone],
  [Species.AvaluggHisui, Items.NeverMeltIce],
]);

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
