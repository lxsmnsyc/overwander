import { Types } from '../../../data/constants/types';
import Abilities from '../../../data/ids/abilities';
import { createStitchedAbility } from './__create';

/**
 * Galar's four fossils, each a head and a tail that never belonged
 * together. The head decides what it throws, and the tail answers for
 * it wherever the tail would land harder
 */
const setupAbilities = [
  createStitchedAbility(Abilities.Boltdrake, Types.Electric, Types.Dragon),
  createStitchedAbility(Abilities.Boltfrost, Types.Electric, Types.Ice),
  createStitchedAbility(Abilities.Gilldrake, Types.Water, Types.Dragon),
  createStitchedAbility(Abilities.Gillfrost, Types.Water, Types.Ice),
];

export default setupAbilities;
