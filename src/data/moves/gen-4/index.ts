import registerRoostToHammerArm from './roost-to-hammer-arm';
import registerGyroBallToFeint from './gyro-ball-to-feint';
import registerPluckToCloseCombat from './pluck-to-close-combat';
import registerPaybackToTrumpCard from './payback-to-trump-card';
import registerHealBlockToPowerTrick from './heal-block-to-power-trick';
import registerGastroAcidToLastResort from './gastro-acid-to-last-resort';
import registerWorrySeedToFlareBlitz from './worry-seed-to-flare-blitz';
import registerForcePalmToXScissor from './force-palm-to-x-scissor';
import registerBugBuzzToEarthPower from './bug-buzz-to-earth-power';
import registerSwitcherooToMirrorShot from './switcheroo-to-mirror-shot';
import registerFlashCannonToRockWrecker from './flash-cannon-to-rock-wrecker';
import registerCrossPoisonToStealthRock from './cross-poison-to-stealth-rock';
import registerGrassKnotToAttackOrder from './grass-knot-to-attack-order';
import registerDefendOrderToShadowForce from './defend-order-to-shadow-force';

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
  registerGastroAcidToLastResort();
  registerWorrySeedToFlareBlitz();
  registerForcePalmToXScissor();
  registerBugBuzzToEarthPower();
  registerSwitcherooToMirrorShot();
  registerFlashCannonToRockWrecker();
  registerCrossPoisonToStealthRock();
  registerGrassKnotToAttackOrder();
  registerDefendOrderToShadowForce();
}
