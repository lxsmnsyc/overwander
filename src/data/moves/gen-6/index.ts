import registerFlyingPressToParabolicCharge from './flying-press-to-parabolic-charge';
import registerForestsCurseToElectrify from './forests-curse-to-electrify';
import registerPlayRoughToAromaticMist from './play-rough-to-aromatic-mist';
import registerEerieImpulseToHoldHands from './eerie-impulse-to-hold-hands';
import registerBabyDollEyesToHyperspaceFury from './baby-doll-eyes-to-hyperspace-fury';

/**
 * Kalos's moves, in the order the move list numbers them, which is the
 * order Metronome reaches into
 */
export default function registerGen6Moves(): void {
  registerFlyingPressToParabolicCharge();
  registerForestsCurseToElectrify();
  registerPlayRoughToAromaticMist();
  registerEerieImpulseToHoldHands();
  registerBabyDollEyesToHyperspaceFury();
}
