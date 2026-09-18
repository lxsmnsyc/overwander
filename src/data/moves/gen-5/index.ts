import registerHoneClawsToSmackDown from './hone-claws-to-smack-down';
import registerStormThrowToSimpleBeam from './storm-throw-to-simple-beam';
import registerEntrainmentToHealPulse from './entrainment-to-heal-pulse';
import registerHexToBestow from './hex-to-bestow';
import registerInfernoToDrillRun from './inferno-to-drill-run';
import registerDualChopToGearGrind from './dual-chop-to-gear-grind';
import registerSearingShotToFusionBolt from './searing-shot-to-fusion-bolt';

/**
 * Unova's moves, in the order the move list numbers them, which is the
 * order Metronome reaches into
 */
export default function registerGen5Moves(): void {
  registerHoneClawsToSmackDown();
  registerStormThrowToSimpleBeam();
  registerEntrainmentToHealPulse();
  registerHexToBestow();
  registerInfernoToDrillRun();
  registerDualChopToGearGrind();
  registerSearingShotToFusionBolt();
}
