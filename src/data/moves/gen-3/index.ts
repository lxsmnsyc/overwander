import registerFakeOutToTaunt from './fake-out-to-taunt';
import registerHelpingHandToDive from './helping-hand-to-dive';
import registerArmThrustToOverheat from './arm-thrust-to-overheat';
import registerOdorSleuthToHowl from './odor-sleuth-to-howl';
import registerDragonClawToPsychoBoost from './dragon-claw-to-psycho-boost';

/**
 * Hoenn's moves, in the order the move list numbers them. That order
 * is what Metronome reaches into, so the parts are read in the order
 * they were written
 */
export default function registerGen3Moves(): void {
  registerFakeOutToTaunt();
  registerHelpingHandToDive();
  registerArmThrustToOverheat();
  registerOdorSleuthToHowl();
  registerDragonClawToPsychoBoost();
}
