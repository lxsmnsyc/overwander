import { Types } from '../../data/constants/types';
import { Species } from '../../data/ids/species';
import type Unit from '../unit';

/**
 * Ogerpon's masks. It is always in one of them, kept in it the way a
 * Rotom is kept in its appliance, and the mask decides its Tera type
 * and the Terastal shape it takes
 */
interface Mask {
  type: Types;
  tera: Species;
}

const MASKS = new Map<Species, Mask>([
  [Species.Ogerpon, { type: Types.Grass, tera: Species.OgerponTealTera }],
  [Species.OgerponWellspring, { type: Types.Water, tera: Species.OgerponWellspringTera }],
  [Species.OgerponHearthflame, { type: Types.Fire, tera: Species.OgerponHearthflameTera }],
  [Species.OgerponCornerstone, { type: Types.Rock, tera: Species.OgerponCornerstoneTera }],
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
 * The mask an Ogerpon is in, Terastal or not. None for anything but
 * Ogerpon
 */
export function maskShapeOf(unit: Unit): Species | undefined {
  return WORN_BY.get(unit.species);
}
