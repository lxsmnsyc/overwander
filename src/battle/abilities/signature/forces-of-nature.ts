import { Types } from '../../../data/constants/types';
import Abilities from '../../../data/ids/abilities';
import { createGenieAbility } from './__create';

/**
 * The four that ride the storm clouds. Two of them ruin a field, the
 * third makes it rich again and the fourth brings the spring, and each
 * lifts its own element for whoever stands with it.
 */
const setupAbilities = [
  createGenieAbility(Abilities.Windfall, Types.Flying),
  createGenieAbility(Abilities.Stormfall, Types.Electric),
  createGenieAbility(Abilities.Landfall, Types.Ground),
  createGenieAbility(Abilities.Bloomfall, Types.Fairy),
];

export default setupAbilities;
