import Abilities from '../../../data/ids/abilities';
import { createBondAbility } from './__create';

/**
 * Kalos's three starters, each worth something to the team standing
 * with it rather than to itself: the knight shelters them, the mage
 * sharpens what they throw, and the ninja gets them moving sooner
 */
const setupAbilities = [
  createBondAbility(Abilities.SpineBond, 'shelter'),
  createBondAbility(Abilities.EmberBond, 'kindle'),
  createBondAbility(Abilities.ShadeBond, 'shade'),
];

export default setupAbilities;
