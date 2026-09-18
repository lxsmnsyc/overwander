import Abilities from '../../../data/ids/abilities';
import { Statuses } from '../../../data/ids/status';
import { createTuftAbility } from './__create';

/**
 * The elemental monkeys: one frame, one member each. Pansage's Leaf
 * Crown is the third and waits on that line being written
 */
const setupAbilities = [
  createTuftAbility(Abilities.EmberTuft, Statuses.Burned),
  createTuftAbility(Abilities.GeyserTail, Statuses.Trapped),
];

export default setupAbilities;
