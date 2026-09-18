import Abilities from '../../../data/ids/abilities';
import { Statuses } from '../../../data/ids/status';
import { createTuftAbility } from './__create';

/**
 * The elemental monkeys: one frame, one member each
 */
const setupAbilities = [
  createTuftAbility(Abilities.LeafCrown, Statuses.Seeding),
  createTuftAbility(Abilities.EmberTuft, Statuses.Burned),
  createTuftAbility(Abilities.GeyserTail, Statuses.Trapped),
];

export default setupAbilities;
