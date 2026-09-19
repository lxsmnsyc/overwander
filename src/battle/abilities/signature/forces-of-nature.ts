import { Types } from '../../../data/constants/types';
import Abilities from '../../../data/ids/abilities';
import { createGenieAbility } from './__create';

/**
 * The three that ride the storm clouds. Two of them ruin a field and
 * the third makes it rich again, and each lifts its own element for
 * whoever stands with it.
 */
const setupAbilities = [
  createGenieAbility(Abilities.Windfall, Types.Flying),
  createGenieAbility(Abilities.Stormfall, Types.Electric),
  createGenieAbility(Abilities.Landfall, Types.Ground),
];

export default setupAbilities;
