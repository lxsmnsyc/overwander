import Abilities from '../../../data/ids/abilities';
import { createNightfallAbility } from './__create';

/** What half the moon is worth to a status already running. */
const WANING_SCALE = 0.5;
const WAXING_SCALE = 1.5;

/**
 * The two halves of the same moon: one shortens the night on its own
 * side, the other lengthens the one it laid on the far side. Meeting
 * each other is the answer to both
 */
const setupAbilities = [
  createNightfallAbility(Abilities.WaningLight, WANING_SCALE, true),
  createNightfallAbility(Abilities.WaxingDark, WAXING_SCALE, false),
];

export default setupAbilities;
