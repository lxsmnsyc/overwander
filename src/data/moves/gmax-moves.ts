import type { Types } from '../constants/types';
import type { Moves } from '../ids/moves';
import type { Species } from '../ids/species';

/**
 * The G-Max Move a Gigantamax of this species throws in place of its
 * type's Max Move, or null where it has none. Nothing has one yet
 */
// Named, since the Max Move conversion imports it by name
// oxlint-disable-next-line import/prefer-default-export
export function getGMaxMove(_species: Species, _type: Types): Moves | null {
  return null;
}
