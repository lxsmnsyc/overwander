import * as v from 'valibot';
import type { Items } from '../ids/items';
import { ITEM_IDS, SPECIES_IDS } from '../ids/names';
import type { Species } from '../ids/species';
import { idOf } from '../yaml';
import fusionsFile from './fusions.yaml';

/**
 * A fusion is two pokemon standing as one: the husk takes the shape
 * and the stats, the partner folded into it is kept out of sight, and
 * an item puts the pair together and takes them apart again.
 *
 * Everything that asks about a fusion asks here rather than naming the
 * species, so a new pair is one row in `fusions.yaml`
 */
interface Fusion {
  /** The pokemon the partner is folded into */
  husk: Species;
  /** The pokemon kept inside it */
  partner: Species;
  /** What joins and parts the pair, one spent each time */
  item: Items;
  /**
   * Whether the shape fights with the partner's abilities too. Kyurem's
   * shapes do, and a rider wears its steed's neigh beside the king's
   * Unnerve, which is As One; Necrozma keeps its own armour whatever it
   * has absorbed
   */
  wearsPartner: boolean;
}

const FUSION = v.object({
  husk: v.string(),
  partner: v.string(),
  item: v.string(),
  'wears-partner': v.optional(v.boolean()),
});

/** Each fused shape, out of `fusions.yaml` */
const FUSIONS = new Map<Species, Fusion>();

for (const [name, written] of Object.entries(v.parse(v.record(v.string(), FUSION), fusionsFile))) {
  const where = `fusions.yaml: ${name}`;

  FUSIONS.set(idOf<Species>(SPECIES_IDS, name, where), {
    husk: idOf<Species>(SPECIES_IDS, written.husk, where),
    partner: idOf<Species>(SPECIES_IDS, written.partner, where),
    item: idOf<Items>(ITEM_IDS, written.item, where),
    wearsPartner: written['wears-partner'] === true,
  });
}

/** Every item that joins a pair, which the evolution road leaves alone */
export const FUSION_ITEMS = new Set<Items>();

/** The shape each partner puts its husk into */
const FUSED_SHAPES = new Map<Species, Species>();

for (const [shape, fusion] of FUSIONS) {
  FUSION_ITEMS.add(fusion.item);
  FUSED_SHAPES.set(fusion.partner, shape);
}

/** Whether this shape has a partner inside it */
export function isFusedSpecies(species: Species): boolean {
  return FUSIONS.has(species);
}

/** The partner this shape holds, or null where it holds none */
export function getFoldedDragon(species: Species): Species | null {
  return FUSIONS.get(species)?.partner ?? null;
}

/** The partner whose abilities this shape fights with, or null */
export function getWornPartner(species: Species): Species | null {
  const fusion = FUSIONS.get(species);

  return fusion?.wearsPartner === true ? fusion.partner : null;
}

/** The shape folding this partner in would make, or null for anything else */
export function getFusedShape(partner: Species): Species | null {
  return FUSED_SHAPES.get(partner) ?? null;
}

/** The partner a shape asks for, read the way the fusion route names it */
export function getFusionPartner(into: Species): Species | null {
  return getFoldedDragon(into);
}

/** The pokemon this shape is made from, or null for anything else */
export function getFusionHusk(shape: Species): Species | null {
  return FUSIONS.get(shape)?.husk ?? null;
}

/** What joins and parts this shape's pair, or null for anything else */
export function getFusionItem(shape: Species): Items | null {
  return FUSIONS.get(shape)?.item ?? null;
}
