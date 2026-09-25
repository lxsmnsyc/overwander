import registerShoreUpToLeafage from './shore-up-to-leafage';
import registerSpotlightToSmartStrike from './spotlight-to-smart-strike';
import registerPurifyToAuroraVeil from './purify-to-aurora-veil';
import registerShellTrapToPhotonGeyser from './shell-trap-to-photon-geyser';
import registerZippyZapToDoubleIronBash from './zippy-zap-to-double-iron-bash';
import registerZMoves from './z-moves';

/**
 * Alola's moves, in the order the move list numbers them, which is the
 * order Metronome reaches into. The Z-Moves come first, as they are
 * numbered, and Metronome never reaches them
 */
export default function registerGen7Moves(): void {
  registerZMoves();
  registerShoreUpToLeafage();
  registerSpotlightToSmartStrike();
  registerPurifyToAuroraVeil();
  registerShellTrapToPhotonGeyser();
  registerZippyZapToDoubleIronBash();
}
