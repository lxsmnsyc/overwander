import registerRoostToHammerArm from './roost-to-hammer-arm';
import registerGyroBallToFeint from './gyro-ball-to-feint';
import registerPluckToCloseCombat from './pluck-to-close-combat';
import registerPaybackToTrumpCard from './payback-to-trump-card';
import registerHealBlockToPowerTrick from './heal-block-to-power-trick';

/**
 * Sinnoh's moves, in the order the move list numbers them. That order
 * is what Metronome reaches into, so the parts are read in the order
 * they were written
 */
export default function registerGen4Moves(): void {
  registerRoostToHammerArm();
  registerGyroBallToFeint();
  registerPluckToCloseCombat();
  registerPaybackToTrumpCard();
  registerHealBlockToPowerTrick();
}
