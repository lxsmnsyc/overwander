import { Stages } from '../../../data/constants/stats';
import Abilities from '../../../data/ids/abilities';
import { createFieldDragAbility } from './__create';

/**
 * The three the world runs on: one holds when a thing happens, one
 * holds where, and one was thrown out of both. The far side reads a
 * stage lower for as long as it stands there, and the stage is the
 * only thing that differs between them
 */
const setupAbilities = [
  createFieldDragAbility(Abilities.TimeDrag, Stages.Speed),
  createFieldDragAbility(Abilities.SpaceDrift, Stages.Accuracy),
  createFieldDragAbility(Abilities.VoidWeight, Stages.Attack),
];

export default setupAbilities;
