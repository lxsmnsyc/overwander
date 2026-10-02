import Abilities from '../../../data/ids/abilities';
import { createSkyArcAbility } from './__create';

/**
 * Alola's light, told on one axis: the sun and the moon burn brightest
 * whole, and the prism that lost its light burns brightest broken
 */
const setupAbilities = [
  createSkyArcAbility(Abilities.Zenith, true),
  createSkyArcAbility(Abilities.Nadir, false),
];

export default setupAbilities;
