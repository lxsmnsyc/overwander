import { Stages } from '../../../data/constants/stats';
import Abilities from '../../../data/ids/abilities';
import { createLakeGiftAbility } from './__create';

/**
 * The three that were made to hold something for the world: one hands
 * its side what it knows, one what it feels, one what it has decided.
 * The same gift three ways, so the stat is the only thing that differs
 */
const setupAbilities = [
  createLakeGiftAbility(Abilities.Mindgift, Stages.Accuracy),
  createLakeGiftAbility(Abilities.Heartgift, Stages.SpecialAttack),
  createLakeGiftAbility(Abilities.Willgift, Stages.Attack),
];

export default setupAbilities;
