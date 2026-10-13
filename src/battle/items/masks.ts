import { Types } from '../../data/constants/types';
import { Items } from '../../data/ids/items';
import { Species, getBaseFormSpecies } from '../../data/ids/species';
import type Unit from '../unit';

/**
 * Ogerpon's masks. It is always in one of them, the Teal with nothing
 * in hand, and the mask decides its Tera type and the Terastal shape it
 * takes
 */
interface Mask {
  item?: Items;
  type: Types;
  tera: Species;
}

const MASKS = new Map<Species, Mask>([
  [Species.Ogerpon, { type: Types.Grass, tera: Species.OgerponTealTera }],
  [
    Species.OgerponWellspring,
    { item: Items.WellspringMask, type: Types.Water, tera: Species.OgerponWellspringTera },
  ],
  [
    Species.OgerponHearthflame,
    { item: Items.HearthflameMask, type: Types.Fire, tera: Species.OgerponHearthflameTera },
  ],
  [
    Species.OgerponCornerstone,
    { item: Items.CornerstoneMask, type: Types.Rock, tera: Species.OgerponCornerstoneTera },
  ],
]);

/** Each shape, Terastal ones included, read back to the mask it wears */
const WORN_BY = new Map<Species, Species>();

for (const [shape, mask] of MASKS) {
  WORN_BY.set(shape, shape);
  WORN_BY.set(mask.tera, shape);
}

/** The Terastal shape a masked shape takes, or none for anything else */
export function teraShapeOf(species: Species): Species | undefined {
  return MASKS.get(species)?.tera;
}

/** The type of the mask this shape wears, or none for anything but Ogerpon */
export function maskTypeOf(species: Species): Types | undefined {
  const shape = WORN_BY.get(species);

  return shape == null ? undefined : MASKS.get(shape)?.type;
}

/**
 * The shape an Ogerpon's held mask puts it in, read from the item
 * rather than its species: Terastallizing comes before the mask is put
 * on as it takes the field. None for anything but Ogerpon
 */
export function maskShapeOf(unit: Unit): Species | undefined {
  if (getBaseFormSpecies(unit.species) !== Species.Ogerpon) {
    return undefined;
  }
  for (const [shape, mask] of MASKS) {
    if (mask.item != null && unit.hasItem(mask.item)) {
      return shape;
    }
  }
  return Species.Ogerpon;
}
