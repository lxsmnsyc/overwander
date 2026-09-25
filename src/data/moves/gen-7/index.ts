import registerShoreUpToLeafage from './shore-up-to-leafage';
import registerSpotlightToSmartStrike from './spotlight-to-smart-strike';
import registerPurifyToAuroraVeil from './purify-to-aurora-veil';
import registerShellTrapToPhotonGeyser from './shell-trap-to-photon-geyser';
import registerZippyZapToDoubleIronBash from './zippy-zap-to-double-iron-bash';

/**
 * Alola's moves, in the order the move list numbers them, which is the
 * order Metronome reaches into
 */
export default function registerGen7Moves(): void {
  registerShoreUpToLeafage();
  registerSpotlightToSmartStrike();
  registerPurifyToAuroraVeil();
  registerShellTrapToPhotonGeyser();
  registerZippyZapToDoubleIronBash();
}
